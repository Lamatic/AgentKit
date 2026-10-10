#!/usr/bin/env node
/**
 * KB Conflict Auditor - GitHub Action script.
 * Collects the docs folder of the checked-out repo, sends it to the deployed audit-kb flow,
 * writes a markdown report, and exits 1 if a finding meets the FAIL_ON severity.
 *
 * Env: LAMATIC_API_URL (or LAMATIC_PROJECT_ENDPOINT), LAMATIC_PROJECT_ID, LAMATIC_API_KEY, LAMATIC_FLOW_ID
 * Optional: DOCS_DIR=docs  FAIL_ON=High|Critical|Medium|Low|none  CHANGED_FILES_FILE=path
 *           REPORT_FILE=kb-audit-report.md  KB_AUDIT_MOCK_RESPONSE=path (skip the API, use a saved response)
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const MARKER = '<!-- kb-conflict-auditor -->';
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const ICONS = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '⚪' };

export function collectDocs(dir, { root = process.cwd(), extensions = ['.md', '.mdx', '.txt'], maxDocs = 200, maxChars = 200000 } = {}) {
  const found = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (extensions.includes(path.extname(entry.name).toLowerCase())) found.push(full);
    }
  };
  walk(dir);
  found.sort();
  const documents = found.slice(0, maxDocs).map((full) => ({
    path: path.relative(root, full).split(path.sep).join('/'),
    content: fs.readFileSync(full, 'utf8').slice(0, maxChars),
  }));
  return { documents, skipped: Math.max(0, found.length - maxDocs) };
}

function findResult(v, depth = 0) {
  if (typeof v === 'string') {
    try { return findResult(JSON.parse(v), depth + 1); } catch { return null; }
  }
  if (!v || typeof v !== 'object' || depth > 6) return null;
  if ('findings' in v || 'candidate_count' in v) return v;
  for (const k of Object.keys(v)) {
    const r = findResult(v[k], depth + 1);
    if (r) return r;
  }
  return null;
}

/** Pulls { findings, stats, candidate_count, docs_scanned } out of whatever envelope the SDK returns. */
export function extractResult(response) {
  const r = findResult(response);
  if (!r) return null;
  let findings = r.findings;
  if (typeof findings === 'string' && findings.trim()) {
    try { findings = JSON.parse(findings); } catch { findings = []; }
  }
  return {
    findings: Array.isArray(findings) ? findings : [],
    stats: r.stats && typeof r.stats === 'object' ? r.stats : {},
    candidate_count: Number(r.candidate_count ?? 0),
    docs_scanned: Number(r.docs_scanned ?? 0),
  };
}

export function filterByChanged(findings, changed) {
  if (!changed || changed.size === 0) return findings;
  return findings.filter((f) => changed.has(f?.evidence?.docA?.path) || changed.has(f?.evidence?.docB?.path));
}

export function shouldFail(findings, failOn = 'High') {
  const threshold = SEVERITIES.indexOf(failOn);
  if (threshold === -1) return false; // "none" or unknown value
  return findings.some((f) => {
    const rank = SEVERITIES.indexOf(f.severity);
    return rank !== -1 && rank <= threshold;
  });
}

const cell = (s) => String(s ?? '').replace(/`/g, "'").replace(/\s+/g, ' ').trim();

export function renderMarkdown({ findings, docsScanned, candidateCount, changedOnly, hiddenCount = 0 }) {
  const lines = [MARKER, '## KB Conflict Auditor', ''];
  lines.push(`Scanned **${docsScanned}** docs, found **${candidateCount}** candidate conflicts, confirmed **${findings.length}**${changedOnly ? ' touching files changed in this PR' : ''}.`, '');
  if (findings.length === 0) {
    lines.push('✅ No conflicting facts found.', '', '_This check only sees numbers with units (timeouts, sizes, limits, counts) written as "name: value", "name = value" or "name is value". It cannot judge prose._');
  }
  for (const f of findings) {
    const a = f.evidence?.docA ?? {};
    const b = f.evidence?.docB ?? {};
    lines.push(`### ${ICONS[f.severity] ?? '⚪'} ${f.severity ?? 'Medium'} - \`${cell(f.key)}\``, '', cell(f.summary), '');
    lines.push(`- **${a.path}** (line ${a.line}${a.date ? `, updated ${a.date}` : ''}): \`${cell(a.text)}\``);
    lines.push(`- **${b.path}** (line ${b.line}${b.date ? `, updated ${b.date}` : ''}): \`${cell(b.text)}\``);
    lines.push(`- **Authoritative:** ${f.authoritative_source}${f.authority_basis && f.authority_basis !== 'undetermined' ? ` (${f.authority_basis})` : ''}`, '');
    if (f.patch) {
      lines.push('```diff', `--- ${f.patch.file_to_update}`, `- ${cell(f.patch.current_text)}`, `+ ${cell(f.patch.replacement_text)}`, '```', '');
    } else if (f.patch_note) {
      lines.push(`> ${cell(f.patch_note)}`, '');
    }
  }
  if (hiddenCount > 0) lines.push(`_${hiddenCount} more finding(s) involve files this PR did not change and are hidden._`, '');
  lines.push('<sub>Facts are extracted by code; an AI model judges each pair; code re-checks authority and patches before anything is reported.</sub>');
  const text = lines.join('\n');
  return text.length > 60000 ? text.slice(0, 60000) + '\n\n_Report truncated._' : text;
}

function notice(msg) { console.log(`::notice::${msg}`); }

export async function main(env = process.env) {
  const root = process.cwd();
  const docsDir = path.resolve(root, env.DOCS_DIR || 'docs');
  const reportFile = env.REPORT_FILE || 'kb-audit-report.md';
  const failOn = env.FAIL_ON || 'High';

  if (!fs.existsSync(docsDir)) { notice(`Docs folder "${env.DOCS_DIR || 'docs'}" not found; nothing to audit.`); return 0; }
  const { documents, skipped } = collectDocs(docsDir, { root });
  if (documents.length < 2) { notice('Fewer than two documents; nothing to compare.'); return 0; }
  if (skipped) notice(`${skipped} document(s) were skipped (limit of 200 per audit).`);

  let response;
  if (env.KB_AUDIT_MOCK_RESPONSE) {
    response = JSON.parse(fs.readFileSync(env.KB_AUDIT_MOCK_RESPONSE, 'utf8'));
  } else {
    const endpoint = env.LAMATIC_API_URL || env.LAMATIC_PROJECT_ENDPOINT;
    const { LAMATIC_PROJECT_ID: projectId, LAMATIC_API_KEY: apiKey, LAMATIC_FLOW_ID: flowId } = env;
    if (!endpoint || !projectId || !apiKey || !flowId) {
      notice('Lamatic secrets are not available (this is normal for pull requests from forks); skipping the audit.');
      return 0;
    }
    try {
      const { Lamatic } = await import('lamatic');
      const lamatic = new Lamatic({ endpoint, projectId, apiKey });
      response = await lamatic.executeFlow(flowId, { documents_json: JSON.stringify(documents) });
    } catch (err) {
      console.log(`::warning::The audit service could not be reached: ${err?.message ?? err}. The check was skipped.`);
      return 0;
    }
  }

  const result = extractResult(response);
  if (!result) {
    console.log('::warning::The audit response had an unexpected shape; the check was skipped.');
    console.log(`Response (first 1500 characters): ${JSON.stringify(response)?.slice(0, 1500)}`);
    return 0;
  }

  let changed = null;
  if (env.CHANGED_FILES_FILE && fs.existsSync(env.CHANGED_FILES_FILE)) {
    const names = fs.readFileSync(env.CHANGED_FILES_FILE, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
    changed = new Set(names);
  }
  const visible = filterByChanged(result.findings, changed);
  const markdown = renderMarkdown({
    findings: visible,
    docsScanned: result.docs_scanned || documents.length,
    candidateCount: result.candidate_count,
    changedOnly: Boolean(changed && changed.size),
    hiddenCount: result.findings.length - visible.length,
  });
  fs.writeFileSync(reportFile, markdown);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, markdown + '\n');
  console.log(markdown);

  if (shouldFail(visible, failOn)) {
    console.log(`::error::Conflicting documentation found at or above severity "${failOn}".`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code));
}
