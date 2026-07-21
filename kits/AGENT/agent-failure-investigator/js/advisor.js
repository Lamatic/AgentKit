const PLAYBOOKS = {
  TOOL_FAILURE: [
    { tag: "Retry policy", why: "Transient tool failures disappear with 2–3 retries and exponential backoff plus jitter." },
    { tag: "Circuit breaker", why: "Trip after N consecutive failures so the flow fails fast instead of stacking timeouts." },
    { tag: "Increase timeout", why: "If p95 latency of the dependency sits near the limit, the limit is the bug." },
    { tag: "Cache results", why: "Serve the last known-good result for idempotent lookups while the dependency recovers." },
    { tag: "Async execution", why: "Long-running tools should be fire-and-poll, not block the generation path." },
    { tag: "Honest fallback", why: "The fallback branch must say the operation failed — never synthesize a confirmation." }
  ],
  HALLUCINATION: [
    { tag: "Groundedness gate", why: "Extract dates, amounts and IDs from the draft and verify each against sources before sending." },
    { tag: "Strict context injection", why: "Pipe tool output verbatim into the final prompt with an answer-only-from-this instruction." },
    { tag: "Citation requirement", why: "Force the model to attach a source ref to every factual sentence; drop sentences without one." },
    { tag: "Temperature review", why: "Factual flows rarely justify temperature above 0.3." },
    { tag: "Refusal path", why: "Give the model an explicit, rewarded way to say it doesn't know." }
  ],
  RAG_FAILURE: [
    { tag: "Query reformulation", why: "On empty retrieval, auto-broaden terms and retry before generation is allowed." },
    { tag: "Min-score guardrail", why: "Block factual answers unless one document clears the relevance threshold." },
    { tag: "Chunking review", why: "Sub-0.5 top scores usually mean chunks are too large or split mid-concept." },
    { tag: "Hybrid search", why: "Combine dense vectors with BM25 keywords to survive vocabulary mismatch." },
    { tag: "Index freshness alert", why: "Alert when the corpus update lag exceeds the content change rate." }
  ],
  WRONG_TOOL: [
    { tag: "Mutually exclusive tool specs", why: "Overlapping descriptions make routing a coin flip; rewrite them to partition the query space." },
    { tag: "Routing examples", why: "Few-shot routing pairs (query → correct tool) fix most selection errors cheaply." },
    { tag: "Re-plan step", why: "After an irrelevant result, loop back to planning instead of forcing generation." },
    { tag: "Tool-choice eval suite", why: "Run selection accuracy tests on every prompt or tool-description change." }
  ],
  PROMPT_AMBIGUITY: [
    { tag: "Prompt linter", why: "Catch contradictory instruction pairs (concise vs. comprehensive) in CI, before deploy." },
    { tag: "Explicit output contract", why: "Pin exact length, structure and tone; delete every 'as appropriate'." },
    { tag: "Output-shape validator", why: "Validate the response shape at runtime so drift pages the team, not the users." },
    { tag: "Prompt versioning", why: "Version prompts like code — diffs make regressions findable." }
  ]
};

function adviseRemediation(result) {
  if (!result.primary) return [];
  const deck = [...(PLAYBOOKS[result.primary] || [])];
  Object.entries(result.scores)
    .filter(([k, pts]) => k !== result.primary && pts > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k]) => (PLAYBOOKS[k] || []).slice(0, 2).forEach(item => {
      if (!deck.some(d => d.tag === item.tag)) deck.push({ ...item, secondary: true });
    }));
  return deck;
}

if (typeof module !== "undefined") module.exports = { adviseRemediation, PLAYBOOKS };
