export default {
  "name": "Hybrid RRF Search",
  "description": "A powerful RAG pipeline that combines keyword and vector search (Reciprocal Rank Fusion) with an LLM-based reranker to return the top 5 most relevant passages.",
  "version": "1.0.0",
  "type": "bundle",
  "author": {
    "name": "Yash Hirani",
    "email": "yash.hirani.work@gmail.com"
  },
  "tags": ["search", "hybrid", "reranking", "weaviate", "cohere"],
  "steps": [
    {
      "id": "hybrid-rrf-search",
      "type": "mandatory"
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/hybrid-rrf-search",
    "docs": "https://lamatic.ai/docs/nodes/data/hybrid-search-node"
  }
};
