(() => {
  const firstCallWhere = (trace, status) => {
    const i = (trace.tool_calls || []).findIndex(tc => tc.status === status);
    return i === -1 ? null : { i, call: trace.tool_calls[i] };
  };

  definePlugin({
    id: "R11",
    category: "TOOL_FAILURE",
    points: 45,
    title: "A tool call timed out",
    fix: "Increase the tool timeout, add retries with exponential backoff, or make the flow degrade gracefully when the tool is slow.",
    prevention: "Alert on p95 tool latency and add a circuit breaker so slow dependencies fail fast instead of stalling the flow.",
    test: trace => {
      const hit = firstCallWhere(trace, "timeout");
      return hit && {
        evidence: `Tool "${hit.call.tool}" timed out after ${hit.call.duration_ms}ms and never returned a result.`,
        refs: [{ type: "tool", index: hit.i }]
      };
    }
  });

  definePlugin({
    id: "R12",
    category: "TOOL_FAILURE",
    points: 40,
    title: "A tool call returned an error",
    fix: "Handle the tool error explicitly: surface the failure to the user or retry, instead of letting generation continue as if the call succeeded.",
    prevention: "Add contract tests for tool APIs and validate tool responses before they enter the prompt.",
    test: trace => {
      const hit = firstCallWhere(trace, "error");
      return hit && {
        evidence: `Tool "${hit.call.tool}" returned an error status.`,
        refs: [{ type: "tool", index: hit.i }]
      };
    }
  });

  definePlugin({
    id: "R13",
    category: "TOOL_FAILURE",
    points: 20,
    title: "Fallback branch activated after a tool failure",
    fix: "Make the fallback path answer honestly (\"I couldn't complete the booking\") instead of generating content the tool never confirmed.",
    prevention: "Require the fallback branch to state uncertainty and never emit confirmations without a tool-provided id.",
    test(trace) {
      const i = findLogIndex(trace, l => /fallback/i.test(l.event + " " + l.message));
      if (i === -1) return null;
      const broken = (trace.tool_calls || []).some(tc => tc.status === "timeout" || tc.status === "error");
      if (!broken) return null;
      return {
        evidence: "The flow switched to a fallback branch after the tool failure — the final answer was generated without any tool result.",
        refs: [{ type: "log", index: i }]
      };
    }
  });
})();
