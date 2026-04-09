# Vectorise Link

## Overview
Vectorise Link solves the problem of turning an arbitrary public webpage into searchable, reusable knowledge by automatically scraping the page, splitting it into manageable chunks, embedding those chunks, and storing them in a context/vector store for later retrieval.
It is implemented as a **single-flow** AgentKit pipeline (`vectorise-link`) that follows a classic retrieval-augmentation preparation pattern (ingest → chunk → embed → index), exposed via an API-triggered request/response interface.
It is primarily intended to be invoked by a developer, backend service, or automation that wants to ingest a URL into a vector store so downstream chat or Q&A systems can answer questions grounded in that page.
Key integrations include a web scraping component, an embedding/vectorization model, and a vector index/context store accessed via indexing nodes.

---

## Purpose
The goal of this agent system is to make webpage content usable for reliable downstream question-answering by converting it into vector embeddings stored in a searchable index. After it runs, the “state of the world” is improved in a concrete way: the target URL’s content is no longer just a raw page—it is represented as chunked, embedded knowledge that can be retrieved efficiently and referenced by other agents or applications.

Operationally, the pipeline takes a URL (and any associated metadata supplied by the caller), fetches and extracts the readable content, breaks it into chunks suitable for embedding, produces vector representations, and stores both vectors and metadata in an index. This creates a reusable context corpus keyed to the original source, enabling later workflows to perform semantic search and cite the underlying page.

Because this kit is a single-flow template, all ingestion responsibilities are centralized in one runnable flow. Any additional capabilities (for example, “chat with the webpage”) are expected to be implemented by a separate retrieval/chat flow that queries the same context store populated by this template.

## Flows

### Vectorise Link

- **Flow identifier:** `vectorise-link`
- **Description:** Scrape webpage content, vectorize it, and store it in a context store for later chat/Q&A over the page.

#### Trigger
- **Invocation type:** API request/response via a GraphQL-backed API trigger node (`graphqlNode`).
- **Expected input shape (logical):**
  - `url` — the webpage URL to scrape and ingest.
  - `metadata` (optional) — caller-provided fields to attach to indexed chunks (e.g., `source`, `tags`, `documentId`).
  - `index` / `namespace` (optional, depending on deployment) — where in the context store to write.

> The exact field names depend on the `API Request (graphqlNode)` configuration in the deployed template. If you are integrating programmatically, confirm the input schema from the generated GraphQL operation in Lamatic Studio for the deployed template.

#### What it does
Step-by-step execution from trigger to response:

1. **API Request (`graphqlNode`)**
   - Receives an API invocation containing the target `url` and any optional metadata.
   - Normalizes/validates incoming fields to feed the rest of the pipeline.

2. **Scraper (`scraperNode`)**
   - Fetches the webpage content from the provided `url`.
   - Extracts readable text content (and potentially basic page attributes such as title, canonical URL, or headings, depending on scraper configuration).

3. **Chunking (`chunkNode`)**
   - Splits the scraped text into smaller segments suitable for embeddings.
   - The chunking strategy (size/overlap/separators) is determined by the node configuration and should be tuned for your embedding model and expected retrieval patterns.

4. **Extract Chunks (`codeNode`)**
   - Transforms the chunking output into the exact array/object structure expected by the vectorization step.
   - Typically includes flattening nested structures, filtering empty chunks, and attaching per-chunk metadata.

5. **Vectorize (`vectorizeNode`)**
   - Generates embeddings for each chunk using the configured embedding model/provider.
   - Produces a vector representation for semantic search and retrieval.

6. **Index (`IndexNode`)**
   - Writes the chunk embeddings and associated metadata into the configured context store/vector index.
   - This is the durable output of the pipeline: a retrievable knowledge base representation of the webpage.

7. **Transform MetaData (`codeNode`)**
   - Shapes/cleans metadata for the API response.
   - Often used to return counts, identifiers, index locations, and/or source information back to the caller.

8. **API Response (`graphqlResponseNode`)**
   - Returns a structured response indicating success and any relevant indexing details.

#### When to use this flow
Use `vectorise-link` when:
- You have a specific webpage URL and want to ingest it into a vector store to support later semantic search or grounded Q&A.
- You are building a “chat with a link” experience and need an ingestion step before running retrieval/chat.
- You need a repeatable automation that converts web content into an indexed context corpus.

Do not use this flow when:
- You need immediate Q&A responses. This flow prepares data; a separate retrieval/chat flow should be used to query the indexed content.
- You are ingesting non-web sources (PDFs, databases, internal docs) unless the scraper is explicitly configured for those formats.

#### Output
- **On success:** a GraphQL API response from `graphqlResponseNode`.
- **Typical response content (logical):**
  - `status` / `success` indicator.
  - `url` and/or normalized `source`.
  - `indexedChunkCount` (or similar) indicating how many chunks were embedded and stored.
  - `indexLocation` / `namespace` / `documentId` (if configured).

> The exact response field names depend on the API Response node configuration.

#### Dependencies
- **Web access** for the scraper to fetch the target URL.
- **Scraping component** configured in `scraperNode` (may require headers, user agent, or proxy depending on target sites).
- **Embedding model/provider** used by `vectorizeNode` (e.g., OpenAI embeddings or another supported provider).
- **Vector store / context store** configured for `IndexNode`.
- **GraphQL API surface** configured by `graphqlNode` and `graphqlResponseNode`.
- **Credentials/secrets** for the embedding provider and vector store (see Environment Setup).

### Flow Interaction
This project contains a single flow (`vectorise-link`) and does not define any internal multi-flow orchestration. The intended interaction pattern is external: downstream agents or applications should query the same context store/vector index populated by this flow to enable retrieval-augmented chat or Q&A over the scraped webpage.

## Guardrails
- **Prohibited tasks**
  - Must not be used to scrape or index content that violates applicable laws, terms of service, or access controls (**inferred**).
  - Must not attempt to bypass paywalls, authentication gates, robots directives, or anti-bot protections (**inferred**).
  - Must not generate or return raw credentials, API keys, or secrets.

- **Input constraints**
  - `url` must be a valid absolute URL (e.g., `https://...`) pointing to a retrievable webpage.
  - Avoid extremely large pages or pages with infinite scroll/dynamic rendering unless the scraper supports it (**inferred**).
  - Inputs should be treated as adversarial; do not execute or evaluate arbitrary code originating from the page content.

- **Output constraints**
  - Must not return scraped personal data beyond what is necessary for indexing/metadata; avoid exposing sensitive content in responses (**inferred**).
  - Should not return the full scraped document by default; return identifiers, counts, and indexing metadata instead (**inferred**, consistent with ingestion flows).

- **Operational limits**
  - Subject to network timeouts, target-site rate limiting, and scraper limitations (**inferred**).
  - Embedding/vectorization throughput is bounded by the embedding provider rate limits and token limits (**inferred**).
  - Vector store write limits and payload size constraints apply (**inferred**).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (`graphqlNode`, `graphqlResponseNode`) | Expose the ingestion flow as an API-triggered request/response operation | Lamatic deployment GraphQL endpoint/config (platform-managed) |
| Web Scraper (`scraperNode`) | Fetch and extract readable text from the target webpage URL | Optional: proxy config, custom headers/user-agent (deployment-specific) |
| Embedding Provider (`vectorizeNode`) | Convert text chunks into vector embeddings | `OPENAI_API_KEY` or equivalent embedding provider key (provider-specific) |
| Vector Store / Context Store (`IndexNode`) | Persist embeddings + metadata for later retrieval | Vector DB credentials (e.g., `PINECONE_API_KEY`, `PINECONE_INDEX`, `WEAVIATE_URL`, etc.; deployment-specific) |

## Environment Setup
- `OPENAI_API_KEY` — API key for the embedding model used by `vectorizeNode`; required by `vectorise-link` if OpenAI embeddings are configured.
- Vector store credentials — required by `IndexNode`; exact variables depend on which store is configured in your deployment of the template:
  - `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_ENVIRONMENT` — if using Pinecone.
  - `WEAVIATE_URL`, `WEAVIATE_API_KEY` — if using Weaviate.
  - `QDRANT_URL`, `QDRANT_API_KEY` — if using Qdrant.
  - Any Lamatic-managed context store settings if using a first-party store.
- Network/proxy configuration (optional) — required only if `scraperNode` must route through a proxy or requires special egress settings to reach target sites.
- `lamatic.config.ts` — project metadata and template configuration (name, description, version, author, tags, deploy/github links).

## Quickstart
1. Deploy the template from Lamatic Studio:
   - https://studio.lamatic.ai/template/vectorise-link
2. Configure credentials in your deployment environment:
   - Set your embedding provider key (e.g., `OPENAI_API_KEY`).
   - Configure your vector store connection for the `Index` node.
3. Identify the deployed GraphQL endpoint and operation for the `API Request (graphqlNode)` trigger (from the deployment’s API panel).
4. Invoke the flow via GraphQL with a URL to ingest (placeholder shape):

   - **Mutation (example shape):**
     - Operation name: `vectoriseLink` (your deployment may differ)
     - Variables:
       - `url`: `"https://example.com/article"`
       - `metadata`: `{ "source": "example", "tags": ["demo"], "documentId": "doc_123" }`

   - **Example request (structure):**
     - `query`: `mutation VectoriseLink($url: String!, $metadata: JSON) { vectoriseLink(url: $url, metadata: $metadata) { success status indexedChunkCount documentId namespace } }`
     - `variables`: `{ "url": "https://example.com/article", "metadata": { "source": "example", "tags": ["demo"], "documentId": "doc_123" } }`

   Adjust the selection set (`success`, `indexedChunkCount`, etc.) to match your deployed response schema.
5. Verify the run:
   - Confirm the response indicates success.
   - Confirm vectors/chunks appear in the configured index/namespace.
6. (Optional) Connect a separate retrieval/chat agent to query the same index for Q&A.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Scraper returns empty content or fails | Target site blocks bots, requires JS rendering, or denies access | Add headers/user-agent, use a proxy, switch to a renderer-capable scraper, or choose a different source URL |
| Timeout during scraping | Slow site response or large/dynamic page | Increase timeout limits, narrow scope, or ingest a simpler canonical page |
| Vectorization fails / rate limited | Embedding provider key missing/invalid or rate limits exceeded | Set/verify `OPENAI_API_KEY` (or provider key), implement retries/backoff, reduce chunk count |
| Indexing fails | Vector store credentials misconfigured, index missing, or schema mismatch | Verify vector DB env vars, ensure index exists, confirm dimensionality matches embedding model |
| Flow succeeds but retrieval later is poor | Chunking configuration not suitable (too large/small, no overlap) or noisy scrape | Tune chunk size/overlap, improve scraper extraction, attach better metadata for filtering |

## Notes
- Template metadata is defined in `lamatic.config.ts` (name: `Vectorise Link`, version: `1.0.0`, author: Naitik Kapadia, tags: `startup`, `apps`).
- This kit is designed as an ingestion step; “chat with the webpage” requires a separate retrieval/chat flow that queries the stored vectors.
- Project directories include `constitutions`, `flows`, `prompts`, and `scripts`, indicating support for policy/guardrail configuration and extensibility beyond the single included flow.