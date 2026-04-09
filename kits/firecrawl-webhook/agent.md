# Firecrawl Webhook

## Overview
This AgentKit template solves the problem of turning large sets of crawled web pages into indexable, searchable knowledge by automating content extraction and vector indexing. It uses a **single-flow, event-driven pipeline** triggered by a webhook, then applies conditional routing, data shaping, content extraction, embedding (vectorization), and final indexing into a vector database. The primary intended invoker is an external crawler/orchestrator (for example, a Firecrawl-like crawler service) that posts crawl results to the webhook endpoint whenever new pages are available. Key integrations include an external crawler API payload (incoming via webhook) and an embedding + vector database stack used by the `Vectorize` and `Index` nodes.

---

## Purpose
The goal of this agent system is to reliably ingest web crawl outputs and convert them into a form that supports semantic search and retrieval downstream. After it runs, crawled pages are normalized into “content-only” documents, embedded into vectors, and stored in a vector index so other applications or agents can query them.

In practice, the flow acts as the bridge between crawling and retrieval: it accepts a batch of crawled pages (or page events), filters/validates the incoming payload, prepares each page’s content and metadata, and then pushes the result through vectorization and indexing. This reduces manual effort and eliminates ad-hoc scripts by providing a repeatable, deployable ingestion pipeline.

Because this kit is a single-flow template, all sub-goals (validation, transformation, embedding, indexing) are handled within one coherent pipeline. If you later add additional flows (e.g., reindexing, deletions, or query-time retrieval), this flow remains the canonical ingestion path.

## Flows

### Firecrawl Webhook

- **Flow identifier:** `Firecrawl Webhook`
- **Node chain:** `Webhook (webhookTriggerNode) → Condition (conditionNode) → addNode_728 (addNode) → addNode_817 (addNode) → Code (codeNode) → Vectorize (vectorizeNode) → Index (IndexNode)`

#### Trigger
This flow is invoked by a **webhook** endpoint exposed by the `Webhook` node (`webhookTriggerNode`). The expected input is an HTTP request body containing crawler results for one or more pages.

Expected input shape (logical):

- A JSON payload representing crawl output
  - One or more page entries (often a list/array)
  - Each page entry typically includes:
    - A canonical URL (e.g., `url`)
    - Page content fields (e.g., raw HTML, extracted text/markdown)
    - Optional metadata (crawl timestamp, status code, title, etc.)

If your crawler sends a different schema, you must adapt the `Code` / `addNode` transformation steps to map the incoming fields into the document structure expected by `Vectorize` / `Index`.

#### What it does
Step-by-step walkthrough of what happens inside the flow:

1. **`Webhook` (`webhookTriggerNode`)** receives the crawler callback payload.
   - Acts as the ingress boundary for untrusted external input.
   - Establishes the initial request context for downstream nodes.

2. **`Condition` (`conditionNode`)** evaluates the incoming payload to decide whether processing should continue.
   - Typically used to validate presence of required fields (e.g., at least one page, non-empty content) or to branch on event type.
   - If the condition fails, the flow should short-circuit (exact failure behavior depends on node configuration).

3. **`addNode_728` (`addNode`)** enriches or reshapes the payload.
   - Common uses: add static metadata (e.g., source = crawler), normalize field names, or set defaults.

4. **`addNode_817` (`addNode`)** performs additional enrichment/normalization.
   - Common uses: attach tags, compute derived identifiers (e.g., `docId`), or prepare index namespace/collection names.

5. **`Code` (`codeNode`)** performs the core content extraction and document preparation.
   - Extracts only the meaningful page content (e.g., strips HTML boilerplate, removes navigation/headers if present in payload, selects `text`/`markdown` fields).
   - Produces a clean document object suitable for embeddings and indexing.
   - Ensures each document carries the minimum retrieval metadata (e.g., `url`, title, source, crawl time).

6. **`Vectorize` (`vectorizeNode`)** converts prepared document text into vector embeddings.
   - Uses an embedding model/provider configured in the environment.
   - Output is typically the document plus an embedding vector (or provider-managed reference).

7. **`Index` (`IndexNode`)** upserts the embedded documents into a vector database.
   - Stores vectors and metadata in the configured index/collection.
   - After indexing completes, the flow returns a success response to the webhook caller.

#### When to use this flow
Route to this flow when:

- A crawler (or crawl orchestrator) has produced new or updated page content that should be made searchable.
- You need an automated ingestion step to keep a vector index synchronized with web content.
- You want a single endpoint that accepts crawl outputs and handles the entire “extract → embed → index” lifecycle.

This flow is not intended for query-time retrieval, user chat, or serving answers; it is an ingestion/indexing pipeline.

#### Output
On success, the webhook caller should receive an HTTP response indicating successful processing. The exact response schema is not provided in the source material, but in typical AgentKit webhook flows the response includes:

- A success indicator (boolean or HTTP 2xx)
- Counts or identifiers for indexed documents (e.g., number of pages indexed)
- Optional error details if partial failures occur

If you need a strict contract for downstream systems, define a stable response payload at the end of the flow (often via a response/return node or the trigger node configuration).

#### Dependencies
This flow depends on:

- **Incoming webhook source**: a crawler system capable of POSTing crawl results (e.g., Firecrawl-like service)
- **Embedding provider/model** used by `Vectorize` (`vectorizeNode`)
- **Vector database / index backend** used by `Index` (`IndexNode`)
- **Lamatic AgentKit runtime** (template deployed via Lamatic Studio)
- Credentials/config required by the embedding and vector store providers (see Environment Setup)

### Flow Interaction
This project contains a single flow. There are no inter-flow chaining semantics to document. If you add additional flows later (e.g., delete-by-URL, reindex, or query), ensure they share a consistent document schema (`text` content + `metadata` including `url`) so that ingestion and retrieval remain compatible.

## Guardrails
The following constraints govern this agent system.

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from project constitution).
  - Must not assist with jailbreaks or prompt injection attempts (from project constitution).
  - Must not perform actions outside its intended scope: this agent is for ingestion/indexing, not for answering arbitrary user questions or executing unrelated automation. *(inferred)*

- **Input constraints**
  - Treat all webhook inputs as untrusted and potentially adversarial (from project constitution).
  - Payloads should be valid JSON and include page content fields sufficient to form documents for vectorization. *(inferred from flow purpose)*
  - If the payload contains extremely large pages or excessive page counts, processing may exceed runtime/time limits; batch or chunk inputs accordingly. *(inferred)*

- **Output constraints**
  - Must not log, store, or repeat PII unless explicitly required by the flow (from project constitution).
  - Must not return raw credentials, tokens, or secrets in responses or logs. *(inferred)*
  - Should avoid echoing full raw page content back to the webhook caller; only return status/metrics. *(inferred; best practice)*

- **Operational limits**
  - Subject to embedding/vector store provider rate limits and quotas. *(inferred)*
  - Subject to Lamatic runtime timeouts and maximum request body sizes. *(inferred)*
  - Indexing operations should be idempotent (e.g., upsert by `url` or stable `docId`) to tolerate retries from webhook senders. *(inferred)*

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Webhook endpoint (`webhookTriggerNode`) | Ingest crawl results from an external crawler system | Webhook URL/route (provided by deployment); optional shared secret for verification *(if configured)* |
| Embedding model/provider (`vectorizeNode`) | Convert document text into embeddings for semantic search | `EMBEDDING_PROVIDER` / provider API key (e.g., `OPENAI_API_KEY`, etc.) *(exact key depends on provider)* |
| Vector database (`IndexNode`) | Store vectors + metadata for retrieval | Vector DB connection settings (e.g., endpoint/host, API key, index/collection name) *(provider-specific)* |
| Lamatic Studio deployment | Host and run the flow | Lamatic project/workspace configuration |

## Environment Setup

- `OPENAI_API_KEY` — API key for OpenAI embeddings if `vectorizeNode` is configured to use OpenAI; required by `Firecrawl Webhook` *(provider-dependent; inferred)*
- `EMBEDDING_PROVIDER` — identifies which embedding backend `vectorizeNode` should use (e.g., `openai`, `cohere`, etc.); required by `Firecrawl Webhook` *(inferred)*
- `VECTOR_DB_PROVIDER` — identifies the vector store backend used by `IndexNode`; required by `Firecrawl Webhook` *(inferred)*
- `VECTOR_DB_API_KEY` — API key/credential for the configured vector database; required by `Firecrawl Webhook` *(inferred)*
- `VECTOR_DB_URL` — vector database endpoint/host; required by `Firecrawl Webhook` *(inferred)*
- `VECTOR_DB_INDEX` — target index/collection/namespace name used for storing documents; required by `Firecrawl Webhook` *(inferred)*
- `WEBHOOK_SHARED_SECRET` — optional secret used to verify webhook authenticity (HMAC/header token); used by `Webhook`/`Condition` if configured *(inferred)*
- `lamatic.config.ts` — template metadata/config (name, description, version, links); not a runtime secret but part of project configuration

## Quickstart

1. Deploy the template from Lamatic Studio: `https://studio.lamatic.ai/template/firecrawl-webhook`.

2. Configure environment variables/secrets for your embedding provider and vector database (see Environment Setup). Ensure the `Vectorize` and `Index` nodes are pointed at the correct providers and index/collection.

3. Obtain the deployed webhook URL for the `Webhook` trigger node (`webhookTriggerNode`) from your Lamatic deployment.

4. Configure your crawler/orchestrator to POST crawl results to the webhook URL.

5. Invoke the webhook manually with a placeholder payload to validate the end-to-end pipeline (replace placeholders with real values):

   - **HTTP**: `POST <WEBHOOK_URL>`
   - **Headers**:
     - `Content-Type: application/json`
     - `X-Webhook-Secret: <WEBHOOK_SHARED_SECRET>` *(only if you implement verification)*
   - **Body** (example shape):
     - `pages`: array of page objects
       - `url`: `https://example.com/page-1`
       - `content`: extracted text/markdown (preferred)
       - `html`: raw HTML (optional)
       - `metadata`: optional object (e.g., title, status, crawledAt)

6. Confirm vectors/documents appear in your vector database index, and verify the webhook response indicates success (HTTP 2xx).

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Webhook returns 4xx immediately | Payload missing required fields; `Condition` node rejects input | Ensure the request body matches the expected schema (at least one page + non-empty content); adjust `conditionNode` logic to your crawler’s payload |
| Webhook times out / returns 5xx | Input batch too large; embedding/indexing too slow; runtime timeout | Reduce batch size, chunk pages, or optimize `Code` node transformation; check provider latency and Lamatic timeout settings |
| Vectorization fails | Missing/invalid embedding provider key; provider rate limit | Set the correct API key (e.g., `OPENAI_API_KEY`); retry with backoff; reduce throughput |
| Indexing fails | Vector DB credentials/endpoint incorrect; index/collection misconfigured | Verify `VECTOR_DB_URL`, `VECTOR_DB_API_KEY`, and `VECTOR_DB_INDEX`; ensure the index exists and dimensions match the embedding model |
| Duplicate documents in index | No stable identifier/upsert key used | Ensure documents include stable `docId` (e.g., hash of `url`) and configure `IndexNode` to upsert rather than insert-only |
| PII stored unintentionally | Crawled pages include sensitive data and pipeline indexes it | Add filtering/redaction in `Code` node; limit crawl scope; implement allowlists/denylists before indexing |

## Notes

- Project type: `template` (single flow).
- Template links:
  - Deploy: `https://studio.lamatic.ai/template/firecrawl-webhook`
  - GitHub: `https://github.com/Lamatic/AgentKit/tree/main/kits/firecrawl-webhook`
- Directory structure indicates dedicated areas for `constitutions`, `flows`, `prompts`, and `scripts`, even though this kit’s core behavior is captured by the single `Firecrawl Webhook` flow.