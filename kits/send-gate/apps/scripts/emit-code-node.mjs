// Generates the two Lamatic Code-node scripts from apps/lib/gate.js so the flow and the
// app share ONE implementation.
//
//   node scripts/emit-code-node.mjs          # rewrites ../../scripts/send-gate_code-node-{211,515}_code.ts
//   node scripts/emit-code-node.mjs --check  # exits 1 if those files are stale
//
// Readable (un-minified) versions land in scripts/out/ (git-ignored) for inspection.
// Lamatic caps a Code node at roughly 10,000 characters of source, so the output is
// minified with terser. `{{node.output}}` template variables are swapped for sentinel
// identifiers before minifying and restored afterwards; Studio inlines them at run time.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const here = dirname(fileURLToPath(import.meta.url));
const kitRoot = join(here, "..", "..");
const check = process.argv.includes("--check");

const lib = readFileSync(join(here, "..", "lib", "gate.js"), "utf8")
  // Code nodes are plain scripts: strip ESM exports, keep the functions.
  .replace(/^export const STATUS/m, "const STATUS")
  .replace(/^export const DEFAULT_STATEMENT_RULES/m, "const DEFAULT_STATEMENT_RULES")
  .replace(/^export function /gm, "function ")
  .replace(/^export const _internals[^\n]*\n/m, "");

const precheck = `
// Trigger fields arrive as strings (Studio trigger schema); the library parses JSON itself.
const trigger = {{triggerNode_1.output}};

${lib}

const draft = String(trigger.draft || "");
const claims = extractClaims(draft, trigger.policy);
claims.draft = draft;
const forced = String(trigger.needs_fact_check || "").toLowerCase() === "true";
const needsFactCheck = claims.needsFactCheck || forced;

// Source of truth: if the caller gave us a truth_url, fetch the facts ourselves, keyed by the
// identifiers the draft actually mentions. Fetched values override whatever the drafter passed
// in (see mergeFacts). Only runs when a check is needed.
let fetched = null;
let fetchError = "";
const truthUrl = String(trigger.truth_url || "").trim();
if (needsFactCheck && (truthUrl.indexOf("http://") === 0 || truthUrl.indexOf("https://") === 0)) {
  try {
    const ids = (claims.figures || []).filter((f) => f.kind === "identifier").map((f) => f.token);
    const url = truthUrl + (truthUrl.indexOf("?") >= 0 ? "&" : "?") + "ids=" + encodeURIComponent(ids.join(",")) + "&recipient=" + encodeURIComponent(String(trigger.recipient || ""));
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.ok) fetched = await res.json(); else fetchError = "truth_url responded " + res.status;
  } catch (e) {
    fetchError = "truth_url fetch failed: " + (e && e.message ? e.message : String(e));
  }
}
const merged = mergeFacts(trigger.facts, fetched);

const verification = needsFactCheck
  ? verifyClaims(claims, merged.facts, trigger.recipient, trigger.policy, merged.provenance)
  : { verifications: [], preVerdict: "allow", counts: {}, factIndexSize: 0 };

output = {
  draft,
  claims,
  needsFactCheck,
  provenance: merged.provenance,
  fetchError,
  facts: merged.facts,
  recipient: trigger.recipient || "",
  verifications: verification.verifications,
  findings: verification.verifications.filter((v) => v.severity !== "info"),
  preVerdict: verification.preVerdict,
  counts: verification.counts,
  // What the judge needs, pre-serialised so the prompt stays small and stable.
  judgeInput: JSON.stringify({
    draft,
    facts: merged.facts,
    recipient: trigger.recipient || null,
    findings: verification.verifications.filter((v) => v.severity !== "info"),
    unresolved: (claims.statements || []).filter((s) => !s.factPath && !s.never)
  })
};
`;

const decide = `
const pre = {{codeNode_211.output}};
// Judge output is absent on the fast path; bracket-wrap so it degrades to undefined.
const judge = [{{InstructorLLMNode_699.output}}][0];

${lib}

const input = { draft: pre.draft, facts: pre.facts, recipient: pre.recipient, provenance: pre.provenance };
let result;
if (!pre.needsFactCheck) {
  result = { verdict: "allow", finalMessage: pre.draft, findings: [], counts: { block: 0, rewrite: 0 }, rewriteCheck: null, judgeNotes: "fast path: no verifiable claims" };
} else {
  result = decide(input, { preVerdict: pre.preVerdict, findings: pre.findings }, judge);
}

output = {
  verdict: result.verdict,
  finalMessage: result.finalMessage,
  claims: pre.claims,
  verifications: pre.verifications,
  findings: result.findings,
  counts: result.counts,
  rewriteCheck: result.rewriteCheck,
  audit: {
    needsFactCheck: pre.needsFactCheck,
    provenance: pre.provenance,
    fetchError: pre.fetchError || "",
    judgeUsed: !!(judge && pre.needsFactCheck),
    judgeNotes: result.judgeNotes,
    schemaVersion: pre.claims && pre.claims.schemaVersion
  }
};
`;

const BANNER = "// GENERATED from apps/lib/gate.js by apps/scripts/emit-code-node.mjs (terser). Edit the library, not this file.\n";
const LIMIT = 10000;

async function build(name, source) {
  const vars = [];
  const withSentinels = source.replace(/\{\{[^}]+\}\}/g, (m) => { vars.push(m); return `__LV${vars.length - 1}__`; });
  const out = await minify(withSentinels, { module: true, toplevel: true, mangle: true, compress: { passes: 2 }, format: { comments: false } });
  let code = out.code.replace(/__LV(\d+)__/g, (_, i) => vars[Number(i)]);
  if (!/\{\{triggerNode_1\.output\}\}|\{\{codeNode_211\.output\}\}/.test(code)) throw new Error(name + ": template variables were lost during minification");
  if (name === "decide" && !/\[\{\{InstructorLLMNode_699\.output\}\}\]\[0\]/.test(code)) throw new Error("decide: judge bracket guard was folded");
  code = BANNER + code + "\n";
  if (code.length > LIMIT) throw new Error(`${name}: ${code.length} chars exceeds Studio's ~${LIMIT}-char Code node limit`);
  return code;
}

const targets = [
  ["precheck", precheck, join(kitRoot, "scripts", "send-gate_code-node-211_code.ts")],
  ["decide", decide, join(kitRoot, "scripts", "send-gate_code-node-515_code.ts")]
];

mkdirSync(join(here, "out"), { recursive: true });
let stale = 0;
for (const [name, source, target] of targets) {
  writeFileSync(join(here, "out", name + ".js"), source);
  const code = await build(name, source);
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";
  if (check) {
    if (current !== code) { stale++; console.error(`STALE: ${target}`); }
    else console.log(`ok: ${target} (${code.length} chars)`);
  } else {
    writeFileSync(target, code);
    console.log(`wrote ${target} (${code.length} chars)`);
  }
}
if (check && stale) process.exit(1);
