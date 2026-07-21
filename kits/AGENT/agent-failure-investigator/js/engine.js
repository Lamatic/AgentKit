/**
 * Investigation engine.
 *
 * runInvestigation(trace) executes every rule in the catalog against the
 * trace and produces a structured, fully deterministic result:
 *
 *   {
 *     fired:      [ { rule, evidence, refs } ]        // rules that matched
 *     scores:     { CATEGORY: points }                // evidence weight per category
 *     primary:    CATEGORY key                        // highest-scoring category
 *     confidence: 0..95                               // evidence-weighted confidence
 *     timeline:   [ { ts, label, kind } ]             // reconstructed event sequence
 *   }
 *
 * The LLM (js/report.js) only narrates this result. It never decides it.
 */

/**
 * Conflict resolution: when a root-cause rule fires, its downstream
 * symptoms are suppressed so they don't outvote the actual cause.
 * Example: if the agent called the WRONG tool (R41), then "ignored the
 * tool output" (R14) is a consequence of that choice, not independent
 * evidence of hallucination — the model was right to distrust an
 * irrelevant result.
 */
const SUPPRESSIONS = [
  { when: "R41", suppress: ["R14"] }
];

function runInvestigation(trace) {
  let fired = [];
  for (const rule of RULES) {
    let hit = null;
    try { hit = rule.test(trace); } catch (e) { /* a broken rule must never kill the run */ }
    if (hit) fired.push({ rule, evidence: hit.evidence, refs: hit.refs || [] });
  }

  // conflict resolution pass
  const firedIds = new Set(fired.map(f => f.rule.id));
  const suppressed = new Set();
  for (const s of SUPPRESSIONS) {
    if (firedIds.has(s.when)) s.suppress.forEach(id => suppressed.add(id));
  }
  fired = fired.filter(f => !suppressed.has(f.rule.id));

  const scores = {};
  for (const key of Object.keys(CATEGORIES)) scores[key] = 0;
  for (const f of fired) scores[f.rule.category] += f.rule.points;

  let primary = null, primaryPoints = -1;
  for (const [key, pts] of Object.entries(scores)) {
    if (pts > primaryPoints) { primary = key; primaryPoints = pts; }
  }
  if (primaryPoints <= 0) primary = null;

  // Confidence: a floor of 35 plus 0.8 × evidence points, capped at 95.
  // Deliberately never 100 — a rule engine reports evidence, not certainty.
  const confidence = primary ? Math.min(95, Math.round(35 + primaryPoints * 0.8)) : 0;

  return {
    fired,
    scores,
    primary,
    primaryPoints,
    confidence,
    timeline: buildTimeline(trace, fired, primary)
  };
}

/* ---------- timeline reconstruction ---------- */

function buildTimeline(trace, fired, primary) {
  const events = [];

  for (const m of trace.conversation || []) {
    if (m.role === "user") events.push({ ts: m.ts, label: "Prompt sent", kind: "info" });
  }

  for (const tc of trace.tool_calls || []) {
    events.push({ ts: tc.ts, label: `${tc.tool} invoked`, kind: "tool" });
    if (tc.status === "timeout") {
      events.push({ ts: addSeconds(tc.ts, Math.round((tc.duration_ms || 0) / 1000)), label: `${tc.tool} TIMEOUT (${tc.duration_ms}ms)`, kind: "fail" });
    } else if (tc.status === "error") {
      events.push({ ts: tc.ts, label: `${tc.tool} ERROR`, kind: "fail" });
    } else {
      events.push({ ts: tc.ts, label: `${tc.tool} completed (${tc.duration_ms}ms)`, kind: "ok" });
    }
  }

  for (const l of trace.logs || []) {
    if (/fallback/i.test(l.event)) events.push({ ts: l.ts, label: "Fallback activated", kind: "warn" });
    if (/retrieval\.empty|0 chunks/i.test(l.event + " " + l.message)) events.push({ ts: l.ts, label: "Retrieval: 0 chunks", kind: "warn" });
    if (/output\.validation/i.test(l.event)) events.push({ ts: l.ts, label: "Output instability detected", kind: "warn" });
  }

  if (trace.final_response) {
    const respIsFailure = primary === "HALLUCINATION" || primary === "RAG_FAILURE" || primary === "WRONG_TOOL" ||
      fired.some(f => f.refs.some(r => r.type === "response"));
    events.push({
      ts: trace.final_response.ts,
      label: respIsFailure ? failureLabelFor(primary) : "Response generated",
      kind: respIsFailure ? "fail" : "ok"
    });
  }

  events.sort((a, b) => (a.ts || "").localeCompare(b.ts || ""));
  // de-duplicate identical (ts,label)
  return events.filter((e, i) => i === 0 || e.ts !== events[i - 1].ts || e.label !== events[i - 1].label);
}

function failureLabelFor(primary) {
  switch (primary) {
    case "HALLUCINATION": return "Hallucination started";
    case "RAG_FAILURE": return "Ungrounded answer generated";
    case "WRONG_TOOL": return "Answer built on wrong tool's result";
    case "TOOL_FAILURE": return "Answer generated despite tool failure";
    case "PROMPT_AMBIGUITY": return "Erratic output generated";
    default: return "Response generated";
  }
}

function addSeconds(ts, s) {
  if (!ts || !/^\d{2}:\d{2}:\d{2}$/.test(ts)) return ts;
  const [h, m, sec] = ts.split(":").map(Number);
  const total = h * 3600 + m * 60 + sec + (s || 0);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}
