# Vectorize Google Drive

## Overview
This AgentKit template solves the problem of turning unstructured Google Drive files into searchable, retrieval-ready knowledge by converting them into vector embeddings and storing them in a vector database. It uses a single-flow, ingestion-style pipeline that extracts content, chunks it, embeds it with a vectorization model, and indexes the results for downstream semantic search and RAG. The primary invoker is a developer or operator who wants to bootstrap a private knowledge base from Google Drive, or an application backend that needs a repeatable ingestion job. Key integrations include the Google Drive API for source content and a vector database for indexing; an embeddings model/service is used to generate vectors.

---

## Purpose
The goal of this agent system is to continuously or on-demand transform the contents of a Google Drive workspace into a high-quality vector index that can be searched semantically. After it runs, your organization’s Drive documents become discoverable by meaning (not just keywords), enabling faster internal search and more accurate retrieval-augmented generation (RAG) grounded in your own data.

Operationally, the flow acts as an ingestion and normalization pipeline: it fetches files, breaks them into manageable chunks, extracts clean text, generates embeddings, and writes both vectors and normalized metadata into your vector store. This creates a stable, query-optimized representation of your Drive corpus that downstream chatbots, assistants, and search endpoints can rely on.

Because this kit is a template with a single mandatory flow, its purpose is intentionally narrow: do the indexing correctly and predictably. You typically pair it with separate RAG/query flows (not included here) that read from the same vector store to answer user questions.

---

## Flows

### Vectorize Google Drive

- Trigger
  - Invocation: Manual or API-invoked AgentKit flow run (template provides a runnable pipeline; no explicit schedule/webhook trigger is defined in the provided materials).
  - Expected input shape (inferred):
    - A configuration payload identifying what to ingest from Google Drive (e.g., folder IDs, file IDs, query constraints) and how to index (e.g., target index/namespace/collection).
    - Credentials/config are supplied via environment/config to the Google Drive connector and the vector store node.

- What it does
  1. `Google Drive` (`googleDriveNode`)
     - Connects to Google Drive and retrieves file content and basic metadata for the configured scope (e.g., selected folders/files).
     - Outputs document-like items containing text/content (or exports where needed) plus source identifiers (file ID, name, path, timestamps).
  2. `chunking` (`chunkNode`)
     - Splits each document’s text into smaller chunks suitable for embedding and indexing.
     - Preserves per-chunk linkage back to the original file and any relevant structural boundaries.
  3. `Extract Chunked Text` (`codeNode`)
     - Normalizes the chunked payload into a clean text field that will be embedded.
     - Typically removes wrapper structure and ensures the embedding model receives plain text per chunk.
  4. `Get Vectors` (`vectorizeNode`)
     - Calls an embeddings model/service to convert each text chunk into a numeric vector.
     - Produces embeddings aligned with the chosen model’s dimensionality and tokenization constraints.
  5. `Transform Metadata` (`codeNode`)
     - Shapes and standardizes metadata fields that will be stored alongside each vector (e.g., source URL, file identifiers, chunk index, timestamps).
     - Ensures the metadata schema matches what the vector store indexer expects.
  6. `Index to DB` (`IndexNode`)
     - Writes vectors and associated metadata into the configured vector database.
     - May upsert by document/chunk identifiers to support re-runs without uncontrolled duplication (exact behavior depends on indexer configuration).
  7. `addNode_545` (`addNode`)
     - Final aggregation/termination node that completes the flow run and returns a summary/result payload.

- When to use this flow
  - You want to bootstrap a semantic index from Google Drive for internal search or RAG.
  - You need to re-index after Drive content changes (new files, updates, permissions) and want a repeatable ingestion pipeline.
  - You are setting up downstream RAG flows and need a dependable, normalized vector store populated with your Drive corpus.

- Output
  - Success response (inferred): a run result object summarizing what was processed and indexed, such as:
    - counts of files fetched
    - counts of chunks created
    - counts of vectors indexed / upserted
    - any skipped items and reasons
    - index/namespace/collection identifiers used
  - Note: the exact response fields depend on the configured AgentKit runtime and the `addNode`/index node return shape.

- Dependencies
  - External services:
    - Google Drive API (read access to the targeted Drive scope)
    - An embeddings provider/model used by `vectorizeNode`
    - A vector database reachable by `IndexNode`
  - Credentials/config:
    - Google API credentials (OAuth client or service account + scopes) for `googleDriveNode`
    - Embeddings API key/model configuration for `vectorizeNode`
    - Vector DB endpoint and access credentials for `IndexNode`
  - Runtime assumptions (inferred): network egress to Google APIs, embeddings endpoint, and vector DB; sufficient memory/timeout for large Drive exports.

---

## Guardrails

- Prohibited tasks
  - Must not write back to Google Drive (delete, modify, or create files) unless explicitly added to the flow (inferred).
  - Must not attempt to bypass Google Drive permissions or access content outside the granted OAuth/service-account scope (inferred).
  - Must not index raw secrets (API keys, tokens) into the vector database if such data appears in documents; callers should filter sensitive sources or add redaction (inferred).

- Input constraints
  - Only Google Drive-accessible content within the authorized scope is valid input.
  - Very large files or binary/unsupported formats may fail conversion/export; ingestion should be limited to supported Drive exportable types or preprocessed (inferred).
  - Chunking and embedding are bounded by the embedding model’s token limits; excessively long text must be chunked appropriately (enforced by `chunkNode`, inferred).

- Output constraints
  - Must not return raw OAuth tokens, service account keys, vector DB credentials, or other secrets in flow outputs/logs (inferred).
  - Must not expose private document contents to unauthorized callers; treat outputs as operational summaries, not full-text export (inferred).

- Operational limits
  - Subject to Google Drive API quotas and rate limits; large Drive corpora may require batching and backoff (inferred).
  - Subject to embeddings provider throughput limits and per-request token limits (inferred).
  - Vector DB write throughput and payload size limits apply during indexing (inferred).
  - Timeouts may occur for large ingestion runs; prefer incremental runs or scoped ingestion (inferred).

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Google Drive API | Fetch documents and metadata for ingestion via `googleDriveNode` | Google OAuth credentials (e.g., `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`) or service account JSON (e.g., `GOOGLE_APPLICATION_CREDENTIALS`) and required scopes |
| Embeddings Model / API | Generate vector embeddings in `vectorizeNode` | Embeddings provider API key and model identifier (e.g., `OPENAI_API_KEY`/`OPENAI_EMBEDDING_MODEL` or equivalent) |
| Vector Database | Store vectors + metadata via `IndexNode` | Vector DB URL/host, API key/token, and index/collection/namespace configuration (vendor-specific) |

---

## Environment Setup

- `GOOGLE_APPLICATION_CREDENTIALS` — Path to a Google service account JSON file with Drive access; used by `googleDriveNode` (alternative to OAuth client flow).
- `GOOGLE_CLIENT_ID` — OAuth client ID for Google Drive access; used by `googleDriveNode` (if using OAuth).
- `GOOGLE_CLIENT_SECRET` — OAuth client secret for Google Drive access; used by `googleDriveNode` (if using OAuth).
- `GOOGLE_REFRESH_TOKEN` — OAuth refresh token with Drive scopes; used by `googleDriveNode` (if using OAuth).
- `GOOGLE_DRIVE_SCOPES` — Scopes required for reading Drive content (e.g., read-only); used by `googleDriveNode` (inferred).
- `EMBEDDINGS_API_KEY` — API key for the configured embeddings provider; used by `vectorizeNode` (inferred).
- `EMBEDDINGS_MODEL` — Embedding model name/version; used by `vectorizeNode` (inferred).
- `VECTOR_DB_URL` — Vector database endpoint/host; used by `IndexNode` (inferred).
- `VECTOR_DB_API_KEY` — Vector database credential; used by `IndexNode` (inferred).
- `VECTOR_DB_INDEX` — Target index/collection name; used by `IndexNode` (inferred).
- `VECTOR_DB_NAMESPACE` — Optional namespace/tenant partition for indexed vectors; used by `IndexNode` (inferred).
- `lamatic.config.ts` — Template metadata and step registration; identifies the mandatory flow `vectorize-google-drive`.

---

## Quickstart

1. Deploy or open the template in Lamatic Studio: `https://studio.lamatic.ai/template/vectorize-google-drive`.
2. Configure Google Drive access for the project runtime (OAuth or service account) and ensure read permissions to the target files/folders.
3. Configure the embeddings provider used by `vectorizeNode` (API key and model).
4. Configure the vector database connection and target index/namespace for `IndexNode`.
5. Invoke the flow run via your AgentKit/Lamatic runtime API (GraphQL shape; placeholders shown):

   - GraphQL
     - Mutation: `runFlow`
     - Variables (example payload; adjust to your runtime’s exact schema):
       - `flow: "vectorize-google-drive"`
       - `input:`
         - `drive:`
           - `folderIds: ["<FOLDER_ID>"]`
           - `fileIds: ["<FILE_ID>"]`
           - `query: "mimeType='application/vnd.google-apps.document'"`
         - `index:`
           - `indexName: "<VECTOR_INDEX>"`
           - `namespace: "<NAMESPACE>"`

6. Verify the run result and confirm vectors are present in your vector DB (spot-check by querying for a known phrase from a Drive document).

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Flow fails at `googleDriveNode` with auth/permission error | Missing/invalid OAuth token, wrong scopes, or service account lacks access to the folder/files | Recreate credentials, ensure Drive read scopes, share the folder with the service account or authorize the correct user |
| Many files skipped or exported content is empty | Unsupported file types or export configuration doesn’t cover the Drive MIME types present | Limit ingestion to supported types, add conversion/export handling, or preprocess files |
| Embedding step errors (rate limit / token limit) at `vectorizeNode` | Provider quota exceeded or chunks too large for the model | Add batching/backoff, reduce chunk size, switch to a higher-quota plan/model |
| Indexing fails at `IndexNode` (payload too large / unauthorized) | Vector DB credentials wrong, index misconfigured, or request size exceeds limits | Validate API key/URL, create the target index, reduce batch size, confirm dimensionality matches the embeddings model |
| Duplicate or inconsistent results after re-running | Upsert keys not stable or metadata transformation doesn’t preserve deterministic IDs | Ensure chunk IDs are derived from stable file ID + chunk index; configure indexer to upsert instead of insert-only |

---

## Notes

- Project type: template (`1.0.0`) with a single mandatory step: `vectorize-google-drive`.
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/vectorize-google-drive`.
- This kit focuses on ingestion/indexing; querying/RAG flows are expected to be built separately against the same vector database.