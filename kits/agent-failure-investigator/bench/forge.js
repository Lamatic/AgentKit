let seed = 1337;
const rng = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
const pick = arr => arr[Math.floor(rng() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

const CITIES = ["Berlin", "Beirut", "Tokyo", "Lagos", "Lima", "Oslo", "Doha", "Porto"];
const ORDERS = () => `A-${between(10000, 99999)}`;
const CLOCK = () => `${String(between(9, 18)).padStart(2, "0")}:${String(between(0, 59)).padStart(2, "0")}:${String(between(0, 59)).padStart(2, "0")}`;

const skeleton = () => {
  const t = CLOCK();
  return {
    meta: { agent: pick(["support-bot", "booking-bot", "hr-bot", "sales-bot"]), flow_id: `flow_${between(1000, 9999)}`, model: pick(["gpt-4o-mini", "claude-haiku", "llama-3-70b"]), session: `s${between(100, 999)}`, date: "2026-07-08" },
    system_prompt: "You are a support agent. Use the tools provided and base every answer on tool results and retrieved documents.",
    conversation: [{ role: "user", ts: t, content: "" }],
    available_tools: [
      { name: "get_order_status", description: "Look up live shipping status, carrier and ETA for an order id." },
      { name: "knowledge_base_search", description: "Search internal policy documents, SLA terms and refund rules." }
    ],
    tool_calls: [], retrieved_docs: [], logs: [], final_response: { ts: t, content: "" }
  };
};

const FORGES = {
  TOOL_FAILURE() {
    const t = skeleton();
    t.conversation[0].content = `Where is my order ${ORDERS()}? It's late.`;
    const doomed = rng() < 0.5;
    t.tool_calls.push({ ts: t.conversation[0].ts, tool: "get_order_status", input: { order_id: "x" }, status: doomed ? "timeout" : "error", duration_ms: doomed ? between(8000, 15000) : between(100, 900), output: "" });
    if (rng() < 0.7) t.logs.push({ ts: t.conversation[0].ts, level: "WARN", event: "flow.fallback", message: "fallback branch activated after tool failure" });
    t.final_response.content = `Your order will arrive by 2026-07-${between(10, 28)} via the standard carrier.`;
    return t;
  },
  HALLUCINATION() {
    const t = skeleton();
    t.conversation[0].content = `Where is my order ${ORDERS()}?`;
    t.tool_calls.push({ ts: t.conversation[0].ts, tool: "get_order_status", input: { order_id: "x" }, status: "success", duration_ms: between(90, 400), output: `{"status":"in_transit","carrier":"DHL","eta":"2026-07-12","last_scan":"${pick(CITIES)} hub"}` });
    t.final_response.content = `Great news — your package was delivered on July ${between(1, 6)}th and signed for at ${between(8, 11)}:00. A refund of $${between(20, 90)} was also issued per Section ${between(2, 7)}.${between(1, 9)}.`;
    return t;
  },
  RAG_FAILURE() {
    const t = skeleton();
    t.conversation[0].content = "What is our refund SLA for enterprise customers?";
    const empty = rng() < 0.55;
    t.tool_calls.push({ ts: t.conversation[0].ts, tool: "knowledge_base_search", input: { q: "refund sla" }, status: "success", duration_ms: between(60, 300), output: empty ? "[]" : "results below" });
    if (empty) {
      t.logs.push({ ts: t.conversation[0].ts, level: "WARN", event: "retrieval.empty", message: "0 chunks above threshold" });
    } else {
      const n = between(2, 4);
      for (let i = 0; i < n; i++) t.retrieved_docs.push({ id: `doc-${i}`, source: "handbook.md", score: rng() * 0.35, content: "General onboarding notes about office equipment and travel booking procedures." });
    }
    t.final_response.content = `Enterprise refunds are processed within ${between(3, 21)} business days, per Section ${between(1, 9)}.${between(1, 9)} of the policy.`;
    return t;
  },
  WRONG_TOOL() {
    const t = skeleton();
    t.conversation[0].content = "What does our internal policy say about SLA credits and refund rules for enterprise accounts?";
    t.tool_calls.push({ ts: t.conversation[0].ts, tool: "get_order_status", input: { order_id: "none" }, status: "success", duration_ms: between(80, 500), output: `{"status":"unknown","carrier":null,"note":"no shipment found"}` });
    t.final_response.content = "Our policy offers generous credits for any missed commitments.";
    return t;
  },
  PROMPT_AMBIGUITY() {
    const t = skeleton();
    t.system_prompt = "Always respond in a single sentence. Provide comprehensive, detailed answers with examples. Format output as appropriate, escalate if needed, add caveats when necessary, etc.";
    t.conversation[0].content = "Summarize our shipping policy.";
    t.tool_calls.push({ ts: t.conversation[0].ts, tool: "knowledge_base_search", input: { q: "shipping" }, status: "success", duration_ms: between(60, 250), output: "Standard shipping takes 5 to 9 business days per the policy document." });
    t.retrieved_docs.push({ id: "doc-1", source: "shipping-policy.md", score: 0.82, content: "Standard shipping takes 5 to 9 business days. Carrier delays are outside our control." });
    if (rng() < 0.6) t.logs.push({ ts: t.conversation[0].ts, level: "WARN", event: "output.validation", message: "response shape varies across recent runs" });
    t.final_response.content = "Standard shipping takes 5 to 9 business days; carrier delays are outside our control.";
    return t;
  },
  HEALTHY() {
    const t = skeleton();
    const city = pick(CITIES);
    t.conversation[0].content = `Where is my order ${ORDERS()}?`;
    const payload = `{"status":"in_transit","carrier":"DHL","eta":"2026-07-12","last_scan":"${city} hub"}`;
    t.tool_calls.push({ ts: t.conversation[0].ts, tool: "get_order_status", input: { order_id: "x" }, status: "success", duration_ms: between(90, 400), output: payload });
    t.retrieved_docs.push({ id: "doc-1", source: "shipping-policy.md", score: 0.84, content: "Standard shipping takes 5 to 9 business days. Track parcels with the carrier tracking id." });
    t.final_response.content = `Your order is in_transit with DHL, last scan at the ${city} hub, eta 2026-07-12. Standard shipping takes 5 to 9 business days.`;
    t.logs.push({ ts: t.conversation[0].ts, level: "INFO", event: "tool.result", message: "200 OK" });
    return t;
  }
};

const GRIME = {
  HALLUCINATION(t) {
    t.final_response.content = `Your order is in_transit with DHL. It was actually delivered on July ${between(1, 6)}th per Section ${between(2, 7)}.${between(1, 9)} of the carrier terms.`;
  },
  RAG_FAILURE(t) {
    if (t.retrieved_docs.length) t.retrieved_docs.forEach(d => { d.score = 0.42 + rng() * 0.16; });
    else t.logs = t.logs.filter(l => l.event !== "retrieval.empty");
  },
  PROMPT_AMBIGUITY(t) {
    t.system_prompt = "Always respond in a single sentence. Provide comprehensive, detailed answers. Escalate if needed.";
    t.logs = t.logs.filter(l => l.event !== "output.validation");
  },
  WRONG_TOOL(t) {
    t.conversation[0].content = "Can you check the SLA credit situation on my recent order shipment?";
  },
  TOOL_FAILURE(t) {
    t.logs = t.logs.filter(l => !/fallback/.test(l.event));
  },
  HEALTHY(t) {
    t.tool_calls[0].duration_ms = between(4000, 7000);
    t.logs.push({ ts: t.conversation[0].ts, level: "INFO", event: "flow.callback", message: "post-response webhook fired" });
    t.system_prompt += " Escalate to a human if needed.";
  }
};

function forgeDataset(total) {
  // Proportional mix (percent of total) so the class balance is identical
  // at N=100, N=1,000 and N=10,000 and results stay comparable across scales.
  const RATIOS = [
    ["TOOL_FAILURE", 0.18], ["HALLUCINATION", 0.18], ["RAG_FAILURE", 0.18],
    ["WRONG_TOOL", 0.13], ["PROMPT_AMBIGUITY", 0.13]
  ];
  const mix = RATIOS.map(([label, r]) => [label, Math.round(total * r)]);
  mix.push(["HEALTHY", total - mix.reduce((s, [, n]) => s + n, 0)]);
  const dataset = [];
  mix.forEach(([label, n]) => {
    for (let i = 0; i < n; i++) {
      const trace = FORGES[label]();
      if (rng() < 0.28) GRIME[label](trace);
      dataset.push({ label: label === "HEALTHY" ? null : label, trace });
    }
  });
  for (let i = dataset.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
  }
  return dataset;
}

/* ---------- trace-size scaling (bench/scale.js) ---------- */

/** Count every event in a trace: messages + tool calls + docs + logs + final. */
function countEvents(t) {
  return (t.conversation || []).length + (t.tool_calls || []).length +
         (t.retrieved_docs || []).length + (t.logs || []).length +
         (t.final_response ? 1 : 0);
}

/**
 * Pad a forged trace up to `targetEvents` total events with *diagnostically
 * neutral* traffic — the kind of noise a real long-running agent produces:
 * INFO logs (~86%), intermediate assistant turns (~9%) and successful
 * auxiliary heartbeat tool calls with bland outputs (~5%). None of these
 * fire or unfire any rule, so the label stays valid: the benchmark asserts
 * the verdict is unchanged at every size.
 */
const NOISE_EVENTS = ["node.enter", "node.exit", "llm.token_usage", "memory.checkpoint", "http.request", "http.response", "queue.dequeue", "cache.hit"];
function inflateTrace(trace, targetEvents) {
  const t = JSON.parse(JSON.stringify(trace));
  let need = targetEvents - countEvents(t);
  while (need-- > 0) {
    const r = rng();
    const ts = CLOCK();
    if (r < 0.86) {
      t.logs.push({ ts, level: "INFO", event: pick(NOISE_EVENTS), message: `step ${between(1, 9999)} completed in ${between(1, 40)}ms` });
    } else if (r < 0.95) {
      t.conversation.push({ role: "assistant", ts, content: `Working on it — step ${between(1, 999)} of the plan.` });
    } else {
      t.tool_calls.push({ ts, tool: "heartbeat_ping", input: { seq: between(1, 9999) }, status: "success", duration_ms: between(1, 30), output: `{"ok":true}` });
    }
  }
  return t;
}

module.exports = { forgeDataset, inflateTrace, countEvents };
