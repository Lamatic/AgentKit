import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { collectDocs, extractResult, filterByChanged, MARKER, renderMarkdown, shouldFail } from './kb-audit.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'kb-audit.mjs');

const finding = (over = {}) => ({
  id: 'c1', key: 'request_timeout', severity: 'High', summary: 'Timeout differs.',
  authoritative_source: 'docs/api.md', authority_basis: 'newer last_updated date', authority_overridden: false,
  evidence: {
    docA: { path: 'docs/api.md', date: '2026-01-15', line: 5, text: 'The request timeout = 30s.' },
    docB: { path: 'docs/sdk.md', date: '2024-05-10', line: 5, text: 'The default request timeout is 60 seconds.' },
  },
  patch: { file_to_update: 'docs/sdk.md', current_text: 'The default request timeout is 60 seconds.', replacement_text: 'The default request timeout is 30s.' },
  patch_note: '', ...over,
});

function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-'));
  fs.mkdirSync(path.join(dir, 'docs', 'sub'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs', 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs', 'api.md'), '# API\nThe request timeout = 30s.\n');
  fs.writeFileSync(path.join(dir, 'docs', 'sdk.md'), '# SDK\nThe default request timeout is 60 seconds.\n');
  fs.writeFileSync(path.join(dir, 'docs', 'sub', 'notes.txt'), 'notes');
  fs.writeFileSync(path.join(dir, 'docs', 'logo.png'), 'x');
  fs.writeFileSync(path.join(dir, 'docs', 'node_modules', 'skip.md'), 'skip');
  fs.writeFileSync(path.join(dir, 'docs', '.hidden.md'), 'skip');
  return dir;
}

function run(dir, env) {
  // Start from the real environment (Windows needs SystemRoot etc.) but drop anything that could change the result.
  const base = { ...process.env };
  for (const k of Object.keys(base)) if (/^(LAMATIC_|KB_AUDIT_|DOCS_DIR|FAIL_ON|CHANGED_FILES_FILE|REPORT_FILE|GITHUB_STEP_SUMMARY)/.test(k)) delete base[k];
  return spawnSync(process.execPath, [SCRIPT], { cwd: dir, env: { ...base, ...env }, encoding: 'utf8' });
}

test('collectDocs reads md/mdx/txt, skips hidden and node_modules, uses repo-relative paths', () => {
  const dir = workspace();
  const { documents } = collectDocs(path.join(dir, 'docs'), { root: dir });
  assert.deepEqual(documents.map((d) => d.path), ['docs/api.md', 'docs/sdk.md', 'docs/sub/notes.txt']);
});

test('collectDocs caps document count and size', () => {
  const dir = workspace();
  const { documents, skipped } = collectDocs(path.join(dir, 'docs'), { root: dir, maxDocs: 2, maxChars: 5 });
  assert.equal(documents.length, 2);
  assert.equal(skipped, 1);
  assert.equal(documents[0].content.length, 5);
});

test('extractResult handles plain, nested and stringified responses', () => {
  const plain = { findings: [finding()], stats: { confirmed: 1 }, candidate_count: 1, docs_scanned: 2 };
  assert.equal(extractResult(plain).findings.length, 1);
  assert.equal(extractResult({ status: 'success', result: plain }).findings.length, 1);
  assert.equal(extractResult({ data: { executeWorkflow: { result: JSON.stringify(plain) } } }).candidate_count, 1);
  assert.deepEqual(extractResult({ findings: '', stats: '', candidate_count: 0, docs_scanned: 3 }).findings, []);
  assert.equal(extractResult({ unrelated: true }), null);
  assert.equal(extractResult(null), null);
});

test('filterByChanged keeps findings that touch a changed file, or everything when none are given', () => {
  const f = finding();
  assert.equal(filterByChanged([f], new Set(['docs/sdk.md'])).length, 1);
  assert.equal(filterByChanged([f], new Set(['docs/other.md'])).length, 0);
  assert.equal(filterByChanged([f], new Set()).length, 1);
  assert.equal(filterByChanged([f], null).length, 1);
});

test('shouldFail compares severities', () => {
  assert.equal(shouldFail([finding({ severity: 'High' })], 'High'), true);
  assert.equal(shouldFail([finding({ severity: 'Medium' })], 'High'), false);
  assert.equal(shouldFail([finding({ severity: 'Critical' })], 'High'), true);
  assert.equal(shouldFail([finding({ severity: 'Low' })], 'Low'), true);
  assert.equal(shouldFail([finding({ severity: 'Critical' })], 'none'), false);
  assert.equal(shouldFail([], 'High'), false);
});

test('renderMarkdown includes the marker, evidence and a diff, and handles the empty case', () => {
  const md = renderMarkdown({ findings: [finding()], docsScanned: 2, candidateCount: 1, changedOnly: false });
  assert.ok(md.startsWith(MARKER));
  assert.ok(md.includes('docs/sdk.md'));
  assert.ok(md.includes('```diff'));
  assert.ok(md.includes('- The default request timeout is 60 seconds.'));
  assert.ok(md.includes('+ The default request timeout is 30s.'));
  const noPatch = renderMarkdown({ findings: [finding({ patch: null, patch_note: 'A human must decide.' })], docsScanned: 2, candidateCount: 1 });
  assert.ok(noPatch.includes('A human must decide.'));
  assert.ok(!noPatch.includes('```diff'));
  const empty = renderMarkdown({ findings: [], docsScanned: 3, candidateCount: 0 });
  assert.ok(empty.includes('No conflicting facts found'));
});

test('main: a High finding fails the check and writes the report', () => {
  const dir = workspace();
  const mock = path.join(dir, 'resp.json');
  fs.writeFileSync(mock, JSON.stringify({ findings: [finding()], stats: {}, candidate_count: 1, docs_scanned: 3 }));
  const r = run(dir, { KB_AUDIT_MOCK_RESPONSE: mock });
  assert.equal(r.status, 1);
  assert.ok(fs.readFileSync(path.join(dir, 'kb-audit-report.md'), 'utf8').includes('Timeout differs.'));
});

test('main: Medium findings pass at the default threshold, and FAIL_ON=none never fails', () => {
  const dir = workspace();
  const mock = path.join(dir, 'resp.json');
  fs.writeFileSync(mock, JSON.stringify({ findings: [finding({ severity: 'Medium' })], stats: {}, candidate_count: 1, docs_scanned: 3 }));
  assert.equal(run(dir, { KB_AUDIT_MOCK_RESPONSE: mock }).status, 0);
  fs.writeFileSync(mock, JSON.stringify({ findings: [finding({ severity: 'Critical' })], stats: {}, candidate_count: 1, docs_scanned: 3 }));
  assert.equal(run(dir, { KB_AUDIT_MOCK_RESPONSE: mock, FAIL_ON: 'none' }).status, 0);
});

test('main: changed-files filter hides unrelated findings', () => {
  const dir = workspace();
  const mock = path.join(dir, 'resp.json');
  fs.writeFileSync(mock, JSON.stringify({ findings: [finding()], stats: {}, candidate_count: 1, docs_scanned: 3 }));
  const changed = path.join(dir, 'changed.txt');
  fs.writeFileSync(changed, 'docs/unrelated.md\n');
  const r = run(dir, { KB_AUDIT_MOCK_RESPONSE: mock, CHANGED_FILES_FILE: changed });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('hidden'));
});

test('main: clean docs response reports no conflicts and passes', () => {
  const dir = workspace();
  const mock = path.join(dir, 'resp.json');
  fs.writeFileSync(mock, JSON.stringify({ findings: '', stats: '', candidate_count: 0, docs_scanned: 3 }));
  const r = run(dir, { KB_AUDIT_MOCK_RESPONSE: mock });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('No conflicting facts found'));
});

test('main: missing secrets (fork PRs) skip quietly with exit 0 and no report', () => {
  const dir = workspace();
  const r = run(dir, {});
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('::notice::'));
  assert.equal(fs.existsSync(path.join(dir, 'kb-audit-report.md')), false);
});

test('main: missing docs folder or too few docs skip with exit 0', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-empty-'));
  assert.equal(run(empty, {}).status, 0);
  fs.mkdirSync(path.join(empty, 'docs'));
  fs.writeFileSync(path.join(empty, 'docs', 'one.md'), 'only one');
  assert.equal(run(empty, {}).status, 0);
});

test('main: an unexpected response shape warns and exits 0', () => {
  const dir = workspace();
  const mock = path.join(dir, 'resp.json');
  fs.writeFileSync(mock, JSON.stringify({ hello: 'world' }));
  const r = run(dir, { KB_AUDIT_MOCK_RESPONSE: mock });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('::warning::'));
});
