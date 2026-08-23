// Code: Parse DiffContext JSON
// Flow: impact-review
//
// Parses the `diffcontext compile --json` payload the user supplied and
// distills it into a compact, LLM-ready impact summary. This node does NO
// retrieval of its own — the caller already ran diffcontext locally/CI and
// pasted the result. Serverless flows cannot read the user's filesystem.

let raw = {{triggerNode_1.output.diffcontext_json}};

function fail(msg) {
  output = { brief: "DIFFCONTEXT PARSE ERROR: " + msg };
}

try {
  let payload = raw;
  if (typeof payload === "string") {
    let cleaned = payload.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    payload = JSON.parse(cleaned);
  }

  let included = Array.isArray(payload.included_symbols) ? payload.included_symbols : [];
  let dropped = Array.isArray(payload.dropped_symbols) ? payload.dropped_symbols : [];
  let context = typeof payload.context === "string" ? payload.context : "";
  let symbolCount = payload.symbol_count;
  let tokenEstimate = payload.token_estimate;
  let reductionPct = payload.reduction_pct;

  let changed = included.filter((s) => s && s.role === "changed").map((s) => s.id);
  let impacted = included.filter((s) => s && s.role === "impacted").map((s) => s.id);
  let dependency = included.filter((s) => s && s.role === "dependency").map((s) => s.id);

  // Tests surfaced in the impact set (path under a tests/testing dir, or id starts with test_).
  let includedTests = included
    .filter((s) => {
      let id = String(s.id || "");
      return /\/(tests|testing)\//.test(id) || /:test_/.test(id) || /:Test/.test(id);
    })
    .map((s) => s.id);

  let droppedCount = dropped.length;
  let droppedTop = dropped
    .slice()
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 15)
    .map((s) => s.id);

  // Pull the two blind-spot lines diffcontext writes into its own meta header.
  let directCallers = "";
  let staticCaveat = "";
  if (context) {
    let m = context.match(/Direct callers found\s*:\s*(\d+)/);
    if (m) directCallers = m[1];
    let c = context.match(/Static analysis cannot see[^\n]*/);
    if (c) staticCaveat = c[0].trim();
  }

  let lines = [];
  lines.push("DIFFCONTEXT IMPACT SUMMARY");
  lines.push("=========================");
  if (typeof symbolCount === "number") lines.push("Symbols in context (impact set): " + symbolCount);
  if (typeof reductionPct === "number") lines.push("Context reduction: " + reductionPct + "% (" + (typeof tokenEstimate === "number" ? tokenEstimate : "?") + " tokens kept)");
  lines.push("");
  lines.push("CHANGED SYMBOLS (the edit under review):");
  if (changed.length) changed.forEach((id) => lines.push("- " + id));
  else lines.push("- (none — was the diff pasted?)");
  lines.push("");
  lines.push("IMPACT SET — included_symbols (" + included.length + " total):");
  lines.push("[impacted] direct callers/dependents (" + impacted.length + "):");
  if (impacted.length) impacted.forEach((id) => lines.push("  - " + id));
  else lines.push("  - (none)");
  lines.push("[dependency] 2-hop / structural (" + dependency.length + "):");
  if (dependency.length) dependency.forEach((id) => lines.push("  - " + id));
  else lines.push("  - (none)");
  lines.push("");
  lines.push("COVERING TESTS surfaced in the impact set (" + includedTests.length + "):");
  if (includedTests.length) includedTests.forEach((id) => lines.push("- " + id));
  else lines.push("- (no test symbols were included by the retriever)");
  lines.push("");
  lines.push("DROPPED FOR BUDGET (" + droppedCount + " symbols you cannot see; top 15 by score):");
  if (droppedTop.length) droppedTop.forEach((id) => lines.push("- " + id));
  else lines.push("- (none)");
  lines.push("");
  lines.push("BLIND-SPOT NOTES (from diffcontext meta):");
  if (directCallers) lines.push("- Direct callers found by the graph: " + directCallers + " (only " + impacted.length + " 'impacted' were included — the rest were dropped for budget or were 2-hop).");
  else lines.push("- Direct caller count not present in meta.");
  if (staticCaveat) lines.push("- " + staticCaveat);
  else lines.push("- Graph confidence is structural completeness only; it cannot see cross-subsystem conceptual coupling.");
  lines.push("");
  lines.push("CODE CONTEXT (actual source of the included symbols, as compiled by diffcontext):");
  lines.push(context || "(empty)");

  output = { brief: lines.join("\n") };
} catch (e) {
  fail(String(e && e.message ? e.message : e));
}
