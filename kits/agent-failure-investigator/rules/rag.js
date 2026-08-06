const RETRIEVER_NAME = /vector|retriev|knowledge_base|kb_/i;

definePlugin({
  id: "R21",
  category: "RAG_FAILURE",
  points: 45,
  title: "Retrieval returned zero documents, but the agent still answered factually",
  fix: "When retrieval is empty, block factual answers: ask a clarifying question, widen the search, or escalate — never generate from parametric memory alone.",
  prevention: "Add a guardrail: any factual answer in this flow requires at least one supporting document above the score threshold.",
  test(trace) {
    const searched = (trace.tool_calls || []).some(tc => RETRIEVER_NAME.test(tc.tool));
    if (!searched || (trace.retrieved_docs || []).length) return null;
    const claims = extractClaims(trace.final_response?.content || "");
    if (!claims.length) return null;
    const li = findLogIndex(trace, l => /retriev|0 chunks|empty/i.test(l.event + " " + l.message));
    const refs = [{ type: "response", index: 0 }];
    if (li !== -1) refs.unshift({ type: "log", index: li });
    return {
      evidence: `Retrieval returned 0 documents, yet the final answer makes ${claims.length} specific factual claim(s) with nothing to ground them.`,
      refs
    };
  }
});

definePlugin({
  id: "R23",
  category: "RAG_FAILURE",
  points: 35,
  title: "All retrieved documents scored below the relevance threshold",
  fix: "Improve chunking or embeddings, raise top_k, and set a minimum relevance score with an honest fallback when nothing clears it.",
  prevention: "Track the retrieval score distribution per query type to catch drift early.",
  test(trace) {
    const docs = trace.retrieved_docs || [];
    if (!docs.length) return null;
    const best = docs.reduce((m, d) => Math.max(m, d.score ?? 0), 0);
    if (best >= 0.5) return null;
    return {
      evidence: `${docs.length} document(s) were retrieved but the best relevance score was only ${best.toFixed(2)} — the context was effectively noise.`,
      refs: docs.map((_, i) => ({ type: "doc", index: i }))
    };
  }
});

definePlugin({
  id: "R25",
  category: "RAG_FAILURE",
  points: 20,
  title: "Empty retrieval was not retried or reformulated",
  fix: "On empty retrieval, automatically reformulate the query (broader terms, lower min_score) before giving up.",
  prevention: "Add a query-reformulation step to the retrieval branch of the flow.",
  test(trace) {
    const li = findLogIndex(trace, l => /retriev.*(empty|0 chunks)|0 chunks/i.test(l.event + " " + l.message));
    if (li === -1) return null;
    const attempts = (trace.tool_calls || []).filter(tc => RETRIEVER_NAME.test(tc.tool));
    return attempts.length > 1 ? null : {
      evidence: "After retrieval came back empty, the flow went straight to generation — no query reformulation or second attempt.",
      refs: [{ type: "log", index: li }]
    };
  }
});
