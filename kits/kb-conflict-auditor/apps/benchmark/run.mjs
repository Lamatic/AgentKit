#!/usr/bin/env node
/**
 * Benchmark for the KB Conflict Auditor.
 *
 *   node benchmark/run.mjs          Stage 1: runs the SHIPPED extractor script (scripts/audit-kb_code-node-344_code.ts)
 *                                   on a seeded corpus. No account, no network. Exits 1 on any regression.
 *   node benchmark/run.mjs --live   Stage 2: also calls the deployed flow with the same corpus (needs apps/.env.local).
 *
 * Run it from the apps folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const kit = path.resolve(here, '..', '..');
const expected = JSON.parse(fs.readFileSync(path.join(here, 'expected.json'), 'utf8'));
const live = process.argv.includes('--live');

const ok = (b) => (b ? 'PASS' : 'FAIL');
let failures = 0;
const check = (label, pass, detail = '') => {
  if (!pass) failures += 1;
  console.log(`  [${ok(pass)}] ${label}${detail ? ' - ' + detail : ''}`);
};

function loadDocs() {
  const dir = path.join(here, 'docs');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
    .map((f) => ({ path: `docs/${f}`, content: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

/** Runs the exact script that ships in the flow, swapping only the Studio variable for the corpus. */
function runExtractor(documentsJson) {
  const file = path.join(kit, 'scripts', 'audit-kb_code-node-344_code.ts');
  let src = fs.readFileSync(file, 'utf8');
  const adapter = /const\s+documentsJson\s*=\s*\{\{[^}]*\}\}\s*;/;
  if (!adapter.test(src)) throw new Error('Could not find the documents_json line in ' + file);
  src = src.replace(adapter, 'const documentsJson = __DOCS__;');
  return new Function('__DOCS__', `let output;\n${src}\n;return output;`)(documentsJson);
}

function findResult(v, depth = 0) {
  if (typeof v === 'string') { try { return findResult(JSON.parse(v), depth + 1); } catch { return null; } }
  if (!v || typeof v !== 'object' || depth > 6) return null;
  if ('findings' in v || 'candidate_count' in v) return v;
  for (const k of Object.keys(v)) { const r = findResult(v[k], depth + 1); if (r) return r; }
  return null;
}

const docs = loadDocs();
const documentsJson = JSON.stringify(docs);

console.log(`\nStage 1: extractor on ${docs.length} seeded documents`);
const out = runExtractor(documentsJson);
const candidates = JSON.parse(out.candidates_json);
console.log(`  candidates found: ${out.candidate_count} (total ${out.total_found}, truncated: ${out.truncated})`);
for (const c of candidates) console.log(`    ${c.id} ${c.key}: ${c.docA.path} ("${c.docA.text.slice(0, 40)}") vs ${c.docB.path} ("${c.docB.text.slice(0, 40)}")`);

const keys = new Set(candidates.map((c) => c.key));
console.log('  must find:');
for (const m of expected.mustFind) check(m.key, keys.has(m.key), m.note);
for (const m of expected.mustFindPairs ?? []) {
  const pair = m.pair.slice().sort().join();
  check(`${m.key} expected document pair`, candidates.some((c) => c.key === m.key && [c.docA.path, c.docB.path].sort().join() === pair), pair);
}
console.log('  must NOT flag (false alarms):');
for (const m of expected.mustNotFlag) check(m.key, !keys.has(m.key), m.note);
const mobileDocument = expected.liveChecks.mobileDocument;
check(
  'mobile timeout is not compared with the general request timeout',
  !candidates.some((c) => [c.docA.path, c.docB.path].includes(mobileDocument)),
  mobileDocument,
);
const recall = expected.mustFind.filter((m) => keys.has(m.key)).length / expected.mustFind.length;
const falseAlarms = expected.mustNotFlag.filter((m) => keys.has(m.key)).length;
console.log(`  recall on seeded conflicts: ${(recall * 100).toFixed(0)}%   false alarms: ${falseAlarms}`);
console.log('  known limits (not counted, by design):');
for (const k of expected.knownMisses) console.log(`    - ${k}`);

if (live) {
  console.log('\nStage 2: deployed flow');
  try { process.loadEnvFile(path.join(kit, 'apps', '.env.local')); } catch { /* use the shell environment */ }
  const need = ['LAMATIC_API_URL', 'LAMATIC_PROJECT_ID', 'LAMATIC_API_KEY', 'AUDIT_KB_FLOW_ID'];
  const missing = need.filter((k) => !process.env[k] || /^your_/.test(process.env[k]));
  if (missing.length) {
    console.log(`  skipped: missing ${missing.join(', ')} (set them in apps/.env.local)`);
    failures += 1;
  } else {
    const mod = await import('lamatic');
    const Lamatic = mod.Lamatic ?? mod.default?.Lamatic ?? mod.default;
    const client = new Lamatic({ endpoint: process.env.LAMATIC_API_URL, projectId: process.env.LAMATIC_PROJECT_ID, apiKey: process.env.LAMATIC_API_KEY });
    const started = Date.now();
    const response = await client.executeFlow(process.env.AUDIT_KB_FLOW_ID, { documents_json: documentsJson });
    console.log(`  call took ${((Date.now() - started) / 1000).toFixed(1)}s`);
    const r = findResult(response);
    if (!r) {
      check('response has the expected shape', false, 'first 800 characters: ' + JSON.stringify(response)?.slice(0, 800));
    } else {
      const findings = Array.isArray(r.findings) ? r.findings : [];
      console.log(`  findings: ${findings.length}   stats: ${JSON.stringify(r.stats)}`);
      for (const f of findings) {
        console.log(`    ${f.severity.padEnd(8)} ${f.key}  authority: ${f.authoritative_source}  patch: ${f.patch ? 'kept' : 'withheld'}  (${f.evidence.docA.path} vs ${f.evidence.docB.path})`);
      }
      const fk = new Set(findings.map((f) => f.key));
      console.log('  must report:');
      for (const m of expected.mustFind) check(m.key, fk.has(m.key));
      console.log('  must NOT report:');
      for (const m of expected.mustNotFlag) check(m.key, !fk.has(m.key));
      const a = expected.liveChecks.authority;
      const pairFinding = findings.find((f) => f.key === a.key && [f.evidence.docA.path, f.evidence.docB.path].sort().join() === a.pair.slice().sort().join());
      check('newer document wins (api-limits over sdk-guide)', pairFinding?.authoritative_source === a.expectedAuthority, pairFinding ? `got ${pairFinding.authoritative_source}` : 'that pair was not reported');
      check('dated conflict includes a patch for the older evidence document', pairFinding?.patch?.file_to_update === a.pair.find((file) => file !== a.expectedAuthority), pairFinding?.patch?.file_to_update ?? 'patch withheld');
      const u = expected.liveChecks.undatedPairShouldBeUnclear;
      const undated = findings.filter((f) => f.key === u.key && [f.evidence.docA.path, f.evidence.docB.path].includes(u.withFile));
      check('pairs with the undated cli.md say "unclear" and withhold the patch', undated.length > 0 && undated.every((f) => f.authoritative_source === 'unclear' && !f.patch), `${undated.length} pair(s)`);
      const inj = findings.filter((f) => f.key === 'max_retries' && [f.evidence.docA.path, f.evidence.docB.path].includes(expected.liveChecks.injectionDocument));
      check('the document with the hidden instruction was still audited', inj.length > 0, `${inj.length} finding(s) involve it`);
      const mobile = findings.filter((f) => [f.evidence.docA.path, f.evidence.docB.path].includes(mobileDocument));
      check('no finding is attributed to the mobile timeout document', mobile.length === 0, `${mobile.length} finding(s) involve it`);
      check('every kept patch targets the older evidence file', findings.filter((f) => f.patch).every((f) => {
        const { docA, docB } = f.evidence;
        if (!docA.date || !docB.date || docA.date === docB.date) return false;
        const olderPath = docA.date < docB.date ? docA.path : docB.path;
        const newerPath = olderPath === docA.path ? docB.path : docA.path;
        return f.patch.file_to_update === olderPath && f.authoritative_source === newerPath;
      }));
    }
  }
}

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
