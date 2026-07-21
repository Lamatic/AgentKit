definePlugin({
  id: "R14",
  category: "HALLUCINATION",
  points: 35,
  title: "Tool succeeded but its output was ignored in the final answer",
  fix: "Inject the tool output directly into the final generation prompt and instruct the model to answer strictly from it.",
  prevention: "Add a post-generation check: the response must share key tokens with the tool output it claims to be based on.",
  test(trace) {
    const answer = trace.final_response?.content || "";
    const calls = trace.tool_calls || [];
    for (let idx = 0; idx < calls.length; idx++) {
      const tc = calls[idx];
      if (tc.status !== "success" || !tc.output || tc.output.length < 15) continue;
      const coverage = overlapRatio(tc.output, answer);
      if (coverage >= 0.15) continue;
      return {
        evidence: `Tool "${tc.tool}" succeeded and returned data, but only ${Math.round(coverage * 100)}% of its meaningful tokens appear in the final answer — the model answered without it.`,
        refs: [{ type: "tool", index: idx }, { type: "response", index: 0 }]
      };
    }
    return null;
  }
});

definePlugin({
  id: "R22",
  category: "HALLUCINATION",
  points: 30,
  title: "The answer contains specific claims unsupported by any source",
  fix: "Add a groundedness gate before sending: extract dates, quantities and section references from the draft and verify each against tool outputs and retrieved docs.",
  prevention: "Track an \"unsupported claim rate\" metric per flow and alert when it rises.",
  test(trace) {
    const claims = extractClaims(trace.final_response?.content || "");
    if (!claims.length) return null;
    const known = groundingCorpus(trace).toLowerCase();
    const orphans = claims.filter(c => !known.includes(c.toLowerCase()));
    return orphans.length ? {
      evidence: `The answer states ${orphans.map(c => `"${c}"`).join(", ")} — none of these appear in any tool output or retrieved document.`,
      refs: [{ type: "response", index: 0 }]
    } : null;
  }
});
