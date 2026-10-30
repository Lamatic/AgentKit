import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const DIR = path.dirname(fileURLToPath(import.meta.url));

function loadNode(file, names) {
  const source = fs.readFileSync(path.join(DIR, '../scripts', file), 'utf8').split('// ---- Studio adapter ----')[0];
  const context = {};
  vm.runInNewContext(`${source}\nglobalThis.api = { ${names.join(', ')} };`, context);
  return context.api;
}

const { extract } = loadNode('audit-kb_code-node-344_code.ts', ['extract']);
const { verify } = loadNode('audit-kb_code-node-615_code.ts', ['verify']);

test('candidate extraction rejects impossible dates and prioritizes matching sections within the pair cap', () => {
  const first = [
    '---',
    'last_updated: 2026-99-99',
    '---',
    '# Production',
    'request timeout = 30s',
    'max retries = 3',
    'cache size = 10mb',
    'connection limit = 20',
    '# Staging',
    'request timeout = 60s',
    'max retries = 5',
    'cache size = 12mb',
    'connection limit = 25',
  ].join('\n');
  const second = [
    '---',
    'last_updated: 2025-01-01',
    '---',
    '# Production',
    'request timeout = 45s',
    'max retries = 4',
    'cache size = 11mb',
    'connection limit = 22',
    '# Staging',
    'request timeout = 90s',
    'max retries = 6',
    'cache size = 13mb',
    'connection limit = 30',
  ].join('\n');

  const result = JSON.parse(JSON.stringify(extract([
    { path: 'docs/a.md', content: first },
    { path: 'docs/b.md', content: second },
  ])));
  const candidates = JSON.parse(result.candidates_json);

  assert.equal(result.total_found, 16);
  assert.equal(result.candidate_count, 10);
  assert.equal(result.truncated, true);
  assert.equal(candidates.some((c) => c.docA.date), false);
  assert.ok(candidates.slice(0, 8).every((c) => c.docA.heading === c.docB.heading));

  const proseDate = extract([
    { path: 'docs/a.md', content: '# A\nupdated_at: 2026-01-01\nrequest timeout = 30s' },
    { path: 'docs/b.md', content: '---\ndate: 2025-01-01\n---\nrequest timeout = 60s' },
  ]);
  assert.equal(JSON.parse(proseDate.candidates_json)[0].docA.date, '');
});

test('verification deduplicates candidate IDs and only accepts a patch quote from its conflicting line', () => {
  const candidate = {
    id: 'c1',
    key: 'request_timeout',
    docA: { path: 'docs/new.md', date: '2026-01-01', line: 2, text: 'request timeout = 30s' },
    docB: { path: 'docs/old.md', date: '2024-01-01', line: 2, text: 'request timeout = 60s' },
  };
  const documents = [
    { path: 'docs/new.md', content: 'request timeout = 30s' },
    { path: 'docs/old.md', content: 'request timeout = 60s\nunrelated timeout = 90s' },
  ];
  const base = {
    candidate_id: 'c1',
    is_real_conflict: true,
    severity: 'High',
    authoritative_source: 'docs/new.md',
  };
  const verified = JSON.parse(JSON.stringify(verify(
    { results: [
      { ...base, suggested_patch: { file_to_update: 'docs/old.md', current_text: 'unrelated timeout = 90s', replacement_text: 'timeout = 30s' } },
      { ...base, suggested_patch: { file_to_update: 'docs/old.md', current_text: 'request timeout = 60s', replacement_text: '' } },
    ] },
    [candidate],
    documents,
  )));

  assert.equal(verified.findings.length, 1);
  assert.equal(verified.stats.confirmed, 1);
  assert.equal(verified.findings[0].patch, null);
  assert.match(verified.findings[0].patch_note, /conflicting line/i);
  assert.equal(verified.stats.patches_withheld, 1);

  const emptyReplacement = JSON.parse(JSON.stringify(verify(
    { results: [{ ...base, suggested_patch: { file_to_update: 'docs/old.md', current_text: 'request timeout = 60s', replacement_text: '' } }] },
    [candidate],
    documents,
  )));
  assert.equal(emptyReplacement.findings[0].patch, null);
  assert.match(emptyReplacement.findings[0].patch_note, /no replacement text/i);
  assert.equal(emptyReplacement.stats.confirmed, 1);

  const nonVerbatimQuote = JSON.parse(JSON.stringify(verify(
    { results: [{ ...base, suggested_patch: { file_to_update: 'docs/old.md', current_text: 'Request timeout = 60s', replacement_text: 'request timeout = 30s' } }] },
    [candidate],
    documents,
  )));
  assert.equal(nonVerbatimQuote.findings[0].patch, null);
  assert.match(nonVerbatimQuote.findings[0].patch_note, /exact quoted text/i);

  const stringFalse = JSON.parse(JSON.stringify(verify(
    { results: [{ ...base, is_real_conflict: 'false' }] },
    [candidate],
    documents,
  )));
  assert.equal(stringFalse.findings.length, 0);
  assert.equal(stringFalse.stats.dismissed, 1);

  const validPatch = JSON.parse(JSON.stringify(verify(
    { results: [{ ...base, suggested_patch: { file_to_update: 'docs/old.md', current_text: 'request timeout = 60s', replacement_text: 'request timeout = 30s' } }] },
    [candidate],
    documents,
  )));
  assert.equal(validPatch.findings[0].patch.file_to_update, 'docs/old.md');
});
