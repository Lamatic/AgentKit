/**
 * Rule engine regression tests.
 *
 * Usage:  node tests/run-tests.js
 *
 * Loads the browser scripts into a shared VM context (they are plain,
 * build-free scripts) and asserts that every sample case is classified
 * into its expected primary failure category, that evidence references
 * are well-formed, and that the report composer produces all sections.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const ctx = { console };
vm.createContext(ctx);
const SCRIPTS = [
  "js/traces.js",
  "rules/core.js", "rules/tool_failure.js", "rules/hallucination.js",
  "rules/rag.js", "rules/prompt.js", "rules/wrong_tool.js",
  "js/adapters.js", "js/engine.js", "js/advisor.js", "js/compare.js", "js/report.js"
];
for (const f of SCRIPTS) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}

const EXPECTED = {
  "case-001": "HALLUCINATION",
  "case-002": "TOOL_FAILURE",
  "case-003": "PROMPT_AMBIGUITY",
  "case-004": "WRONG_TOOL",
  "case-005": "RAG_FAILURE"
};

let failures = 0;
const check = (cond, msg) => {
  if (!cond) { failures++; console.error("  FAIL " + msg); }
};

const g = (name) => vm.runInContext(name, ctx); // consts live in the context's lexical scope
for (const c of g("SAMPLE_TRACES")) {
  const r = g("runInvestigation")(c.trace);
  const rep = g("composeReport")(r, c.trace);
  const ok = r.primary === EXPECTED[c.id];
  console.log(`${ok ? "PASS" : "FAIL"} ${c.id} → ${r.primary} (${r.primaryPoints} pts, confidence ${r.confidence}%)`);

  check(ok, `${c.id}: expected ${EXPECTED[c.id]}, got ${r.primary}`);
  check(r.confidence > 0 && r.confidence <= 95, `${c.id}: confidence out of range (${r.confidence})`);
  check(r.fired.length > 0, `${c.id}: no rules fired`);
  check(r.timeline.length >= 2, `${c.id}: timeline too short`);
  check(rep.fixes.length > 0, `${c.id}: no recommended fixes`);
  check(rep.preventive.length > 0, `${c.id}: no preventive actions`);
  for (const f of r.fired) {
    for (const ref of f.refs) {
      check(["prompt", "tool", "doc", "log", "response", "msg"].includes(ref.type),
        `${c.id}: rule ${f.rule.id} has bad ref type "${ref.type}"`);
      check(Number.isInteger(ref.index) && ref.index >= 0,
        `${c.id}: rule ${f.rule.id} has bad ref index`);
    }
  }
}

// A healthy trace must not be diagnosed with anything.
const healthy = {
  system_prompt: "Answer questions using the weather tool.",
  conversation: [{ role: "user", ts: "12:00:00", content: "What's the weather in Berlin?" }],
  available_tools: [{ name: "get_weather", description: "Current weather for a city." }],
  tool_calls: [{ ts: "12:00:01", tool: "get_weather", input: { city: "Berlin" }, status: "success", duration_ms: 120, output: "Berlin: 22C, sunny, light wind" }],
  retrieved_docs: [],
  logs: [{ ts: "12:00:01", level: "INFO", event: "tool.result", message: "200 OK" }],
  final_response: { ts: "12:00:02", content: "It's currently 22C and sunny in Berlin with light wind." }
};
const hr = g("runInvestigation")(healthy);
console.log(`${hr.primary === null ? "PASS" : "FAIL"} healthy-trace → ${hr.primary} (no diagnosis expected)`);
check(hr.primary === null, `healthy trace was diagnosed with ${hr.primary}`);

const IMPORT_FIXTURES = [
  ["langgraph", [
    { event: "on_chain_start", timestamp: "2026-07-08T10:00:00Z", data: { input: { messages: [{ type: "human", content: "hi" }] } } },
    { event: "on_tool_start", run_id: "r1", name: "get_weather", timestamp: "2026-07-08T10:00:01Z", data: { input: { city: "Berlin" } } },
    { event: "on_tool_end", run_id: "r1", name: "get_weather", timestamp: "2026-07-08T10:00:02Z", data: { output: "22C sunny" } },
    { event: "on_chat_model_end", timestamp: "2026-07-08T10:00:03Z", data: { output: { content: "It is 22C." } } }
  ]],
  ["openai-agents", { object: "trace", id: "trace_1", spans: [
    { span_data: { type: "agent", name: "helper", tools: ["get_weather"] }, started_at: "2026-07-08T10:00:00Z" },
    { span_data: { type: "function", name: "get_weather", input: "{\"city\":\"Berlin\"}", output: "22C" }, started_at: "2026-07-08T10:00:01Z", ended_at: "2026-07-08T10:00:02Z" },
    { span_data: { type: "generation", input: [{ role: "user", content: "weather?" }], output: [{ role: "assistant", content: "22C." }] }, started_at: "2026-07-08T10:00:03Z" }
  ] }],
  ["crewai", { crew: "weather-crew", agents: [{ role: "analyst", goal: "answer", tools: ["get_weather"] }],
    tasks: [{ description: "weather?", agent: "analyst", output: { raw: "22C." }, tool_calls: [{ tool: "get_weather", result: "22C" }] }] }],
  ["autogen", { chat_history: [
    { role: "user", name: "user_proxy", content: "weather?" },
    { role: "assistant", name: "assistant", content: null, tool_calls: [{ id: "c1", function: { name: "get_weather", arguments: "{\"city\":\"Berlin\"}" } }] },
    { role: "tool", tool_call_id: "c1", content: "22C" },
    { role: "assistant", name: "assistant", content: "22C." }
  ] }],
  ["lamatic", { flowId: "flow_1", executionId: "ex_1", nodes: [
    { nodeType: "triggerNode", nodeName: "webhook", output: { query: "weather?" }, startedAt: "2026-07-08T10:00:00Z", status: "success" },
    { nodeType: "toolNode", nodeName: "get_weather", input: { city: "Berlin" }, output: "22C", durationMs: 90, startedAt: "2026-07-08T10:00:01Z", status: "success" },
    { nodeType: "llmNode", nodeName: "answer", output: { text: "22C." }, startedAt: "2026-07-08T10:00:02Z", status: "success" }
  ] }],
  ["native", healthy]
];

for (const [expected, doc] of IMPORT_FIXTURES) {
  let got = null, converted = null;
  try {
    const r = g("importTrace")(doc);
    got = r.format;
    converted = r.trace;
  } catch (e) { /* recorded as mismatch below */ }
  const ok = got === expected;
  console.log(`${ok ? "PASS" : "FAIL"} adapter:${expected} → detected ${got}`);
  check(ok, `adapter ${expected}: detected ${got}`);
  if (converted) {
    check(converted.final_response && typeof converted.final_response.content === "string",
      `adapter ${expected}: no final_response after conversion`);
    const rr = g("runInvestigation")(converted);
    check(rr.confidence >= 0 && rr.confidence <= 95, `adapter ${expected}: engine choked on converted trace`);
  }
}

const timeoutTrace = {
  system_prompt: "Book tables with the booking tool.",
  conversation: [{ role: "user", ts: "10:00:00", content: "Book a table for two tonight." }],
  available_tools: [{ name: "book_table", description: "Reserve a restaurant table." }],
  tool_calls: [{ ts: "10:00:01", tool: "book_table", input: {}, status: "timeout", duration_ms: 10000, output: "" }],
  retrieved_docs: [], logs: [{ ts: "10:00:11", level: "WARN", event: "flow.fallback", message: "fallback branch" }],
  final_response: { ts: "10:00:12", content: "Your table is booked for 7pm, confirmation #4521." }
};
const cmp = g("diffInvestigations")(timeoutTrace, healthy);
console.log(`${cmp.a.primary === "TOOL_FAILURE" && cmp.b.primary === null ? "PASS" : "FAIL"} compare: broken vs healthy`);
check(cmp.a.primary === "TOOL_FAILURE", "compare: trace A should be TOOL_FAILURE");
check(cmp.b.primary === null, "compare: trace B should be clean");
check(cmp.resolvedRules.length > 0, "compare: no resolved rules reported");
check(cmp.metrics.some(m => m.verdict === "better"), "compare: no improvement detected");

const advice = g("adviseRemediation")(cmp.a);
check(advice.length >= 4, "advisor: too few remediation items for TOOL_FAILURE");
check(advice.some(x => /circuit breaker/i.test(x.tag)), "advisor: circuit breaker missing from tool-failure playbook");
console.log(`${advice.length >= 4 ? "PASS" : "FAIL"} advisor: ${advice.length} remediation items for TOOL_FAILURE`);

console.log(failures === 0 ? "\nAll tests passed." : `\n${failures} assertion(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
