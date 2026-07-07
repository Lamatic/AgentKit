// Model config: Runbook RAG (RAGNode)
// Flow: investigate
//
// Controls runbook retrieval: embedding model, generative model, retrieval
// certainty, and result limit. Tuned to return the few most relevant runbook
// excerpts as grounding context rather than a synthesised answer — the ranking
// happens downstream in the Diagnose node, not here.
//
// Set the embedding + generative models and vector DB in Lamatic Studio.

export default {
  "limit": "@model-configs/investigate_rag.ts",
  "certainty": "@model-configs/investigate_rag.ts",
  "memories": "@model-configs/investigate_rag.ts",
  "messages": "@model-configs/investigate_rag.ts",
  "embeddingModelName": "@model-configs/investigate_rag.ts",
  "generativeModelName": "@model-configs/investigate_rag.ts"
};
