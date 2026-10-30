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

export function collectDocs(dir, {
  root = process.cwd(),
  extensions = ['.md', '.mdx', '.txt'],
  maxDocs = 200,
  maxChars = 200000,
  prioritizePaths = new Set(),
} = {}) {
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
  const relativePath = (full) => path.relative(root, full).split(path.sep).join('/');
  found.sort((a, b) => {
    const changedFirst = Number(prioritizePaths.has(relativePath(b))) - Number(prioritizePaths.has(relativePath(a)));
    return changedFirst || relativePath(a).localeCompare(relativePath(b));
  });
  const selected = found.slice(0, maxDocs);
  const truncatedDocuments = [];
  const documents = selected.map((full) => {
    const content = fs.readFileSync(full, 'utf8');
    const docPath = relativePath(full);
    if (content.length > maxChars) truncatedDocuments.push(docPath);
    return { path: docPath, content: content.slice(0, maxChars) };
  });
  return {
    documents,
    skipped: Math.max(0, found.length - maxDocs),
    truncatedDocuments,
  };
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
  if (typeof findings === 'string') {
    if (!findings.trim()) findings = [];
    else {
      try { findings = JSON.parse(findings); } catch { return null; }
    }
  }
  if (!Array.isArray(findings)) return null;
  return {
    findings,
    stats: r.stats && typeof r.stats === 'object' ? r.stats : {},
    candidate_count: Number(r.candidate_count ?? 0),
    total_found: Number(r.total_found ?? r.candidate_count ?? 0),
    truncated: r.truncated === true || r.truncated === 'true',
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

function renderFinding(f) {
  const a = f.evidence?.docA ?? {};
  const b = f.evidence?.docB ?? {};
  const lines = [`### ${ICONS[f.severity] ?? '⚪'} ${f.severity ?? 'Medium'} - \`${cell(f.key)}\``, '', cell(f.summary), ''];
  lines.push(`- **${a.path}** (line ${a.line}${a.date ? `, updated ${a.date}` : ''}): \`${cell(a.text)}\``);
  lines.push(`- **${b.path}** (line ${b.line}${b.date ? `, updated ${b.date}` : ''}): \`${cell(b.text)}\``);
  lines.push(`- **Authoritative:** ${f.authoritative_source}${f.authority_basis && f.authority_basis !== 'undetermined' ? ` (${f.authority_basis})` : ''}`, '');
  if (f.patch) {
    lines.push('```diff', `--- ${f.patch.file_to_update}`, `- ${cell(f.patch.current_text)}`, `+ ${cell(f.patch.replacement_text)}`, '```', '');
  } else if (f.patch_note) {
    lines.push(`> ${cell(f.patch_note)}`, '');
  }
  return lines.join('\n') + '\n';
}

export function renderMarkdown({
  findings,
  docsScanned,
  candidateCount,
  totalFound = candidateCount,
  truncated = false,
  changedOnly,
  hiddenCount = 0,
  incomplete = [],
  failOn = 'High',
}) {
  const lines = [MARKER, '## KB Conflict Auditor', ''];
  lines.push(`Scanned **${docsScanned}** docs, found **${candidateCount}** candidate conflicts, confirmed **${findings.length}**${changedOnly ? ' touching files changed in this PR' : ''}.`, '');
  if (truncated || totalFound > candidateCount) {
    lines.push(`⚠️ Candidate limit reached: **${candidateCount}** of **${totalFound}** candidate pairs were sent for review (maximum 10).`, '');
  }
  for (const message of incomplete) lines.push(`⚠️ **Incomplete audit:** ${message}`, '');
  if (findings.length === 0 && (incomplete.length > 0 || truncated || totalFound > candidateCount)) {
    lines.push('⚠️ No confirmed conflicts were returned for the candidate pairs that were reviewed.', '');
  } else if (findings.length === 0) {
    lines.push('✅ No conflicting facts found.', '', '_This check only sees numbers with units (timeouts, sizes, limits, counts) written as "name: value", "name = value" or "name is value". It cannot judge prose._');
  }
  if (hiddenCount > 0) lines.push(`_${hiddenCount} more finding(s) involve files this PR did not change and are hidden._`, '');
  const prefix = lines.join('\n') + '\n\n';
  const footer = '<sub>Facts are extracted by code and judged by an AI model. Code verifies authority and that the exact quoted text appears in both the raw file and conflicting line; replacement text remains a suggestion for human review.</sub>';
  const sections = findings.map(renderFinding);
  const failing = findings.map((f) => shouldFail([f], failOn));
  const failureReserve = sections.reduce((total, section, i) => total + (failing[i] ? section.length : 0), 0);
  const truncationNotice = '\n_Report truncated; all findings meeting the configured failure threshold are retained._\n\n';
  let available = Math.max(0, 60000 - prefix.length - footer.length - failureReserve - truncationNotice.length - 512);
  let omitted = 0;
  const included = sections.map((section, i) => {
    if (failing[i]) return true;
    if (section.length <= available) {
      available -= section.length;
      return true;
    }
    omitted++;
    return false;
  });
  const body = sections.filter((_, i) => included[i]).join('');
  const noticeText = omitted ? `\n_${omitted} non-failing finding(s) omitted to keep the report within 60,000 characters._\n\n` : '';
  return `${prefix}${body}${noticeText}${omitted ? truncationNotice : '\n'}${footer}`;
}

function notice(msg) { console.log(`::notice::${msg}`); }

export async function main(env = process.env) {
  const root = process.cwd();
  const docsDir = path.resolve(root, env.DOCS_DIR || 'docs');
  const reportFile = env.REPORT_FILE || 'kb-audit-report.md';
  const failOn = env.FAIL_ON || 'High';

  if (!fs.existsSync(docsDir)) { notice(`Docs folder "${env.DOCS_DIR || 'docs'}" not found; nothing to audit.`); return 0; }
  let changed = null;
  if (env.CHANGED_FILES_FILE) {
    if (!fs.existsSync(env.CHANGED_FILES_FILE)) {
      console.log(`::error::Changed-file list "${env.CHANGED_FILES_FILE}" is missing; the audit cannot determine its scope.`);
      return 1;
    }
    changed = new Set(fs.readFileSync(env.CHANGED_FILES_FILE, 'utf8').split('\0').filter(Boolean));
  }
  const { documents, skipped, truncatedDocuments } = collectDocs(docsDir, { root, prioritizePaths: changed ?? new Set() });
  if (documents.length < 2) { notice('Fewer than two documents; nothing to compare.'); return 0; }
  if (skipped) notice(`${skipped} document(s) were skipped (limit of 200 per audit).`);
  if (truncatedDocuments.length) notice(`${truncatedDocuments.length} document(s) exceeded the 200,000-character limit and were truncated.`);

  let response;
  if (env.KB_AUDIT_MOCK_RESPONSE) {
    response = JSON.parse(fs.readFileSync(env.KB_AUDIT_MOCK_RESPONSE, 'utf8'));
  } else {
    const endpoint = env.LAMATIC_API_URL || env.LAMATIC_PROJECT_ENDPOINT;
    const { LAMATIC_PROJECT_ID: projectId, LAMATIC_API_KEY: apiKey, LAMATIC_FLOW_ID: flowId } = env;
    if (!endpoint || !projectId || !apiKey || !flowId) {
      if (isForkPullRequest(env)) {
        notice('Lamatic secrets are not available for this fork pull request; skipping the audit.');
        return 0;
      }
      console.log('::error::Lamatic secrets are missing for this audit. Configure the required credentials or run this check only for fork pull requests without secrets.');
      return 1;
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
    console.log('::error::The audit response had an unexpected shape or malformed findings; the check cannot report a clean audit.');
    console.log(`Response (first 1500 characters): ${JSON.stringify(response)?.slice(0, 1500)}`);
    return 1;
  }

  const visible = filterByChanged(result.findings, changed);
  const incomplete = [];
  if (skipped) incomplete.push(`${skipped} eligible document(s) were skipped because the 200-document limit was reached.`);
  if (truncatedDocuments.length) incomplete.push(`${truncatedDocuments.length} document(s) were truncated at 200,000 characters.`);
  const markdown = renderMarkdown({
    findings: visible,
    docsScanned: result.docs_scanned || documents.length,
    candidateCount: result.candidate_count,
    totalFound: result.total_found,
    truncated: result.truncated,
    changedOnly: Boolean(changed && changed.size),
    hiddenCount: result.findings.length - visible.length,
    incomplete,
    failOn,
  });
  fs.writeFileSync(reportFile, markdown);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, markdown + '\n');
  console.log(markdown);

  if (skipped || truncatedDocuments.length || shouldFail(visible, failOn)) {
    console.log(`::error::The audit is incomplete or found conflicts at or above severity "${failOn}".`);
    return 1;
  }
  return 0;
}

function isForkPullRequest(env) {
  if (env.GITHUB_EVENT_NAME !== 'pull_request' || !env.GITHUB_EVENT_PATH || !fs.existsSync(env.GITHUB_EVENT_PATH)) {
    return false;
  }
  try {
    const event = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
    const headRepo = event.pull_request?.head?.repo?.full_name;
    const baseRepo = event.pull_request?.base?.repo?.full_name;
    return typeof headRepo === 'string' && typeof baseRepo === 'string' && headRepo !== baseRepo;
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code));
}
