(function () {
  const affinity = (query, tool) => sharedTokens(query, `${tool.name.replace(/_/g, " ")} ${tool.description}`);

  definePlugin({
    id: "R41",
    category: "WRONG_TOOL",
    points: 40,
    title: "A better-matching tool was available but not used",
    fix: "Rewrite tool descriptions to be mutually exclusive and add routing examples (\"internal policy/SLA questions -> knowledge_base_search\").",
    prevention: "Maintain an eval suite for tool-selection accuracy and run it on every prompt or tool-description change.",
    test(trace) {
      const query = lastUserMessage(trace);
      const calls = trace.tool_calls || [];
      const toolbox = trace.available_tools || [];
      if (!query || !calls.length || toolbox.length < 2) return null;
      const used = new Set(calls.map(c => c.tool));
      let bar = toolbox.filter(t => used.has(t.name)).reduce((m, t) => Math.max(m, affinity(query, t)), 0);
      let winner = null;
      toolbox.forEach(t => {
        if (used.has(t.name)) return;
        const s = affinity(query, t);
        if (s > bar && s >= 2) { winner = t; bar = s; }
      });
      if (!winner) return null;
      return {
        evidence: `The query matches "${winner.name}" (${bar} keyword overlaps: internal/policy/SLA-type terms) far better than the tool actually called, "${calls[0].tool}".`,
        refs: [{ type: "tool", index: 0 }]
      };
    }
  });

  definePlugin({
    id: "R42",
    category: "WRONG_TOOL",
    points: 20,
    title: "Irrelevant tool result was not followed by a re-plan",
    fix: "When a tool result doesn't answer the question, re-plan with an alternative tool instead of generating from the weak result.",
    prevention: "Add an explicit re-planning step to the agent loop with a relevance check on tool results.",
    test(trace) {
      const query = lastUserMessage(trace);
      const calls = trace.tool_calls || [];
      const toolbox = trace.available_tools || [];
      if (calls.length !== 1 || toolbox.length < 2) return null;
      const only = calls[0];
      if (only.status !== "success") return null;
      const rel = overlapRatio(query, only.output || "");
      if (rel > 0.4) return null;
      const candidates = toolbox
        .filter(t => t.name !== only.tool)
        .map(t => ({ t, s: affinity(query, t) }))
        .filter(x => x.s >= 2)
        .sort((x, y) => y.s - x.s);
      if (!candidates.length) return null;
      return {
        evidence: `The single tool result covered only ${Math.round(rel * 100)}% of the question's key terms, yet the agent generated an answer instead of trying "${candidates[0].t.name}".`,
        refs: [{ type: "tool", index: 0 }, { type: "response", index: 0 }]
      };
    }
  });
})();
