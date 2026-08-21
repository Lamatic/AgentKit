/**
 * Report composer.
 *
 * Two modes, by design:
 *
 *   1. Rule-based narrative (default, offline) — the report is assembled
 *      deterministically from the engine result. Works with zero
 *      dependencies and zero API keys. This is what the demo uses.
 *
 *   2. LLM narrative (optional) — if the user provides an Anthropic API
 *      key, Claude rewrites the Root Cause section as fluent prose. The
 *      LLM receives ONLY the engine result (fired rules + evidence), never
 *      the freedom to invent a diagnosis. If the call fails for any
 *      reason, we fall back to mode 1 silently.
 *
 * The separation matters: an investigator that hallucinated its own
 * findings would be useless. Diagnosis is deterministic; language is not.
 */

const ROOT_CAUSE_TEMPLATES = {
  HALLUCINATION: (r) =>
    `The model generated content from parametric memory instead of the evidence in front of it. ` +
    `${r.fired.filter(f => f.rule.category === "HALLUCINATION").map(f => f.evidence).join(" ")} ` +
    `Nothing in the flow forced the answer to stay grounded, so nothing did.`,
  TOOL_FAILURE: (r) =>
    `The failure began in infrastructure, not in the model. ` +
    `${r.fired.filter(f => f.rule.category === "TOOL_FAILURE").map(f => f.evidence).join(" ")} ` +
    `The flow then continued to generation as if the tool had succeeded, which converted an infrastructure error into a user-facing false statement.`,
  PROMPT_AMBIGUITY: (r) =>
    `The instructions themselves are the defect. ` +
    `${r.fired.filter(f => f.rule.category === "PROMPT_AMBIGUITY").map(f => f.evidence).join(" ")} ` +
    `Given contradictory or vague constraints, the model resolves them differently on every run — the erratic output is the prompt's variance, not the model's.`,
  WRONG_TOOL: (r) =>
    `The agent routed the task to the wrong capability. ` +
    `${r.fired.filter(f => f.rule.category === "WRONG_TOOL").map(f => f.evidence).join(" ")} ` +
    `Everything downstream of a wrong tool choice — the weak result, the ungrounded answer — is a consequence, not a separate failure.`,
  RAG_FAILURE: (r) =>
    `The retrieval layer failed to supply grounding, and the flow did not treat that as a stop condition. ` +
    `${r.fired.filter(f => f.rule.category === "RAG_FAILURE").map(f => f.evidence).join(" ")} ` +
    `An empty context window plus a confident model is the canonical recipe for a fabricated citation.`
};

function composeReport(result, trace) {
  if (!result.primary) {
    return {
      category: null,
      confidence: 0,
      rootCause: "No rule in the catalog matched this trace. Either the run was healthy, or the failure mode is not covered yet — see the rule catalog in js/rules.js to add one.",
      contributing: [],
      fixes: [],
      preventive: []
    };
  }

  const primaryCat = CATEGORIES[result.primary];
  const others = Object.entries(result.scores)
    .filter(([k, v]) => k !== result.primary && v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({
      category: CATEGORIES[k],
      points: v,
      rules: result.fired.filter(f => f.rule.category === k).map(f => f.rule.title)
    }));

  const firedRules = result.fired;
  const fixes = dedupe(firedRules.map(f => ({ ruleId: f.rule.id, text: f.rule.fix })));
  const preventive = dedupe(firedRules.map(f => ({ ruleId: f.rule.id, text: f.rule.prevention })));

  return {
    category: primaryCat,
    confidence: result.confidence,
    rootCause: ROOT_CAUSE_TEMPLATES[result.primary](result),
    contributing: others,
    fixes,
    preventive
  };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(i => (seen.has(i.text) ? false : (seen.add(i.text), true)));
}

/* ---------- optional LLM mode ---------- */

async function composeRootCauseWithClaude(apiKey, result, trace) {
  const findings = result.fired.map(f =>
    `[${f.rule.id}] (${f.rule.category}, +${f.rule.points}) ${f.rule.title}: ${f.evidence}`
  ).join("\n");

  const prompt =
    `You are the narrative layer of a deterministic agent-failure investigator. ` +
    `A rule engine already analyzed a failed AI-agent trace. Its findings are final — do not add, remove, or reweigh evidence.\n\n` +
    `Primary failure category: ${CATEGORIES[result.primary].label} (confidence ${result.confidence}%)\n` +
    `Fired rules:\n${findings}\n\n` +
    `User question was: "${lastUserMessage(trace)}"\n` +
    `Final (failed) response was: "${trace.final_response?.content}"\n\n` +
    `Write a Root Cause narrative of 3-4 sentences for an engineering report. ` +
    `Reference the rule ids in brackets. Plain prose, no headers, no lists.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  if (!text) throw new Error("Empty response");
  return text;
}
