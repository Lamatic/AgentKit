# Hybrid RRF Search

This bundle implements a production-ready **Hybrid Search Pipeline** using Reciprocal Rank Fusion (RRF) and an LLM-based reranker. It allows you to search large documents with incredibly high precision by combining the best of Keyword Search (BM25) and Vector Search (Cosine Similarity), and having an LLM pick the final winners.

## What is it?

Pure vector search struggles with exact keyword matching (like names or IDs). Pure keyword search struggles with semantic meaning. 
**Hybrid Search** runs both searches simultaneously, and **Reciprocal Rank Fusion (RRF)** mathematically combines their scores to bubble the most relevant passages to the top.

This pipeline takes it one step further by piping those top results into an LLM (`Generate JSON` node) to act as a **Reranker**, outputting the final top 5 passages as a perfectly formatted JSON array.

## Features

- **Cohere Embeddings**: Uses `embed-english-v3.0` for highly accurate vector representations.
- **Weaviate Vector DB**: Leverages Weaviate's native `rankedFusion` capabilities.
- **Data Ingestion**: A robust `codeNode` setup for formatting raw chunks.
- **LLM Reranking**: Uses an LLM to evaluate the top results and enforce a strict JSON output schema.

## Setup Instructions

1. **Import the flows**: Import this bundle into your Lamatic project.
2. **Configure your Database**: Ensure your VectorDB is connected and configured for Hybrid RRF in the Studio integrations.
3. **Run the Ingestion Flow**: Push your text chunks into the VectorDB.
4. **Deploy the Search Flow**: The GraphQL API is ready to accept queries.

## Usage Example

Send a GraphQL request to your Lamatic endpoint:

```json
{
  "query": "what do I do in a dust storm?"
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "passage_0",
      "content": "## 2. Dealing with Dust Storms\nIf a massive planetary dust event is detected by the orbital satellite network, all rovers must immediately return to the main garage...",
      "score": 1
    }
  ]
}
```
