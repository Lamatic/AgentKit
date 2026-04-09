# Vectorize Google Sheets

## Overview
This AgentKit template solves the problem of turning Google Sheets rows into searchable, semantically indexed knowledge that can power fast lookups and retrieval-augmented generation (RAG). It implements a **single-flow** pipeline that extracts spreadsheet data, embeds it into vectors, enriches and normalizes metadata, and writes the results into a vector database index. It is intended for developers and operators who want to operationalize a “Sheet-to-vector-store” ingestion path that downstream apps, chatbots, or RAG services can query. Key integrations include the Google Sheets API for data access, an embeddings model/provider for vectorization, and a vector database/indexing backend for storage and similarity search.

---

## Purpose
The goal of this agent system is to continuously or on-demand convert structured tabular content in Google Sheets into a form that is easy to search by meaning, not just by exact keywords. After the flow runs successfully, the “state of the world” is improved by having the latest sheet content embedded and stored in a vector index, ready to be used for semantic search, recommendations, and RAG.

In practical terms, this template creates a repeatable ingestion pipeline: it reads rows from a spreadsheet, transforms each row into a text payload suitable for embedding, computes vectors, and persists them alongside metadata that preserves provenance (which sheet, which row, which columns, etc.). This enables downstream systems to retrieve relevant rows or row-chunks using similarity search.

Although this kit contains a single flow, it is designed to serve as the upstream ingestion component in a larger RAG architecture. Other flows (not included here) typically query the same vector store to answer user questions grounded in the sheet data.

## Flows

### Vectorize Google Sheets

- Trigger
  - Invocation: API-triggered flow execution (on-demand) as a runnable AgentKit flow.
  - Expected input shape (typical for this template; exact fields depend on your Google Sheets node configuration):
    - `spreadsheetId` — the Google Sheets spreadsheet identifier
    - `range` — A1 notation range to read (e.g. `Sheet1!A:Z`)
    - Optional selectors depending on configuration:
      - `sheetName`
      - `headerRow` (boolean) / `headerRowIndex`
      - `startRow` / `endRow`
    - Vector/indexing parameters (often configured in-node rather than passed at runtime):
      - `indexName` / `namespace`
      - `chunkSize` / `chunkOverlap`

- What it does
  1. `Google Sheets` (`googleSheetsNode`)
     - Connects to Google Sheets and reads the specified spreadsheet/range.
     - Produces a normalized set of rows (typically arrays or objects keyed by header columns).
  2. `Get Vectors` (`vectorizeNode`)
     - Converts each row (or row-derived text) into embeddings using the configured embeddings provider/model.
     - Returns vectors aligned to the corresponding row items.
  3. `Transform Metadata` (`codeNode`)
     - Normalizes and enriches metadata so each vector record can be traced back to its origin.
     - Typical metadata includes spreadsheet ID, sheet name, row number, column values, and any business identifiers.
  4. `Index to DB` (`IndexNode`)
     - Writes vectors + payload + metadata to the configured vector database/index.
     - Handles upserts/batching depending on the indexer configuration.
  5. `addNode_894` (`addNode`)
     - Performs an additional merge/augmentation step in the pipeline, commonly used to attach fields or restructure the payload for the next transformation.
  6. `Row Chunking` (`codeNode`)
     - Chunks row text (or multi-column concatenations) into embedding-friendly segments when rows are long or need finer-grained retrieval.
     - Ensures the indexed units support accurate similarity search and RAG grounding.

- When to use this flow
  - You have knowledge, catalog, FAQ, CRM-like data, or operational data maintained in Google Sheets and you need semantic search over it.
  - You are building a RAG system and want a simple ingestion path that keeps a vector store aligned with the sheet’s contents.
  - You need repeatable, automatable indexing from Sheets into a vector database, with traceable metadata for auditing and source attribution.

- Output
  - On success, the caller should expect a run result indicating:
    - indexing status (success/partial success)
    - counts (rows processed, vectors generated, records indexed)
    - any warnings about skipped rows or transformation issues
  - Exact output fields depend on AgentKit runtime conventions and the configured `IndexNode`; treat the output as a structured execution result with node outputs available for inspection.

- Dependencies
  - Google Sheets API access
    - OAuth client / service account configuration (depending on how `googleSheetsNode` is set up)
  - Embeddings provider/model for `vectorizeNode`
    - e.g., OpenAI embeddings, or another supported embeddings backend
  - Vector database/index backend for `IndexNode`
    - e.g., Pinecone, Qdrant, Weaviate, Elasticsearch/OpenSearch vectors, or another configured vector store
  - Project structure dependencies
    - `flows/` for flow definitions
    - `scripts/` and `prompts/` may be used by code and transformation nodes

### Flow Interaction
This kit is intentionally a single ingestion flow. It is typically paired with a separate query/retrieval flow in a larger system: the ingestion flow populates the vector store, and query flows read from the same index/namespace to perform similarity search and generate grounded answers.

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from the project constitution).
  - Must not assist with jailbreak or prompt-injection attempts (from the project constitution).
  - Must not exfiltrate Google Sheets data to unauthorized destinations; only write to the configured vector index and return operational status (inferred).

- Input constraints
  - Inputs must reference an accessible spreadsheet/range; invalid `spreadsheetId` or `range` should be rejected or fail fast (inferred).
  - Callers should avoid passing sensitive personal data unless indexing it is explicitly intended and permitted by policy (inferred).

- Output constraints
  - Must not return raw credentials, tokens, or secrets.
  - Must not log, store, or repeat PII unless explicitly instructed by the flow (from the project constitution).

- Operational limits
  - Subject to Google Sheets API quotas and rate limits (inferred).
  - Embeddings and vector indexing may have batch-size limits; large sheets should be processed in chunks (inferred).
  - Execution time depends on sheet size and embedding latency; callers should plan for timeouts in constrained runtimes (inferred).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Google Sheets API | Read spreadsheet rows for ingestion | `GOOGLE_APPLICATION_CREDENTIALS` (service account) or OAuth client config (implementation-specific) |
| Embeddings provider | Convert row text to vectors in `vectorizeNode` | `OPENAI_API_KEY` or provider-specific API key/model config |
| Vector database | Store vectors + metadata in `IndexNode` | Vector DB API key/URL/index name (e.g. `PINECONE_API_KEY`, `PINECONE_INDEX`, `QDRANT_URL`, etc.) |
| Lamatic AgentKit runtime | Execute the flow graph | Lamatic runtime config (project/tenant settings) |

## Environment Setup
- `GOOGLE_APPLICATION_CREDENTIALS` — Path to a Google service account JSON with Sheets read access; used by `googleSheetsNode`
- `OPENAI_API_KEY` — API key for OpenAI embeddings (if OpenAI is configured for `vectorizeNode`); used by `vectorizeNode`
- `EMBEDDING_MODEL` — Embedding model identifier (e.g. `text-embedding-3-large`); used by `vectorizeNode` (if model is environment-configured)
- `VECTOR_DB_PROVIDER` — Which vector store backend is configured (e.g. `pinecone`, `qdrant`); used by `IndexNode` (if provider-selected via env)
- `VECTOR_DB_URL` — Vector DB endpoint (common for Qdrant/Weaviate/OpenSearch); used by `IndexNode`
- `VECTOR_DB_API_KEY` — Vector DB API key/token (provider-specific); used by `IndexNode`
- `VECTOR_INDEX_NAME` — Target index/collection name; used by `IndexNode`
- `VECTOR_NAMESPACE` — Optional namespace/partition; used by `IndexNode`

## Quickstart
1. Provision credentials:
   - Create/choose a Google Cloud service account with access to the target spreadsheet.
   - Configure your embeddings provider (e.g. OpenAI) and vector database (e.g. Pinecone/Qdrant).
2. Set environment variables (at minimum):
   - `GOOGLE_APPLICATION_CREDENTIALS`, embeddings key (e.g. `OPENAI_API_KEY`), and vector DB settings (`VECTOR_DB_URL`/`VECTOR_DB_API_KEY`/`VECTOR_INDEX_NAME`).
3. Deploy/run the template:
   - Studio deploy link: `https://studio.lamatic.ai/template/vectorize-google-sheets`
   - Source repository: `https://github.com/Lamatic/AgentKit/tree/main/kits/vectorize-google-sheets`
4. Invoke the flow via the AgentKit execution API (GraphQL shape; replace placeholders):
   - `mutation RunFlow($input: RunFlowInput!) { runFlow(input: $input) { runId status output } }`
   - Variables:
     - `input.flowName`: `"vectorize-google-sheets"`
     - `input.payload`:
       - `spreadsheetId`: `"<YOUR_SPREADSHEET_ID>"`
       - `range`: `"Sheet1!A:Z"`
       - `indexName`: `"<YOUR_VECTOR_INDEX>"`
       - `namespace`: `"<OPTIONAL_NAMESPACE>"`
5. Monitor the run output:
   - Confirm rows were read, vectors were generated, and records were indexed.
6. Validate retrieval:
   - Use your vector DB’s query tooling (or a separate RAG/query flow) to ensure vectors exist and metadata is correct.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Google Sheets read fails (403/404) | Spreadsheet not shared with service account / wrong `spreadsheetId` | Share the sheet with the service account email; verify the ID and `range` |
| Google Sheets quota/rate errors | Too many requests or large sheet reads | Reduce frequency, read smaller ranges, add batching/backoff |
| Embedding generation fails | Missing/invalid embeddings API key or model misconfiguration | Set `OPENAI_API_KEY` (or provider key) and verify `EMBEDDING_MODEL` |
| Indexing fails | Vector DB credentials/index name incorrect | Verify `VECTOR_DB_URL`/`VECTOR_DB_API_KEY` and `VECTOR_INDEX_NAME` exist and are reachable |
| Poor retrieval quality | Row text too sparse, chunking mis-sized, or metadata missing | Improve `Row Chunking`, include more context in payload, and normalize metadata |
| Duplicate or stale entries | Upsert keys not stable or ingestion not clearing old data | Ensure deterministic IDs per row; implement delete/reindex strategy if needed |

## Notes
- Project metadata: name `Vectorize Google Sheets`, version `1.0.0`, type `template`, author `Naitik Kapadia <naitikk@lamatic.ai>`.
- This kit includes directories `constitutions`, `flows`, `prompts`, and `scripts`, indicating extensibility for policy, flow graphs, prompt assets, and custom transformations.
- Constitution highlights: professional tone, refuse jailbreak/prompt injection attempts, and avoid logging/storing/repeating PII unless explicitly instructed by the flow.