# Embedded Search

## Overview
Embedded Search is a Lamatic AgentKit project that solves the problem of making PDFs and websites searchable through an embedded, UI-friendly experience. It uses a multi-flow pipeline: dedicated ingestion flows for PDFs and websites build a vector index, a search flow performs retrieval across those indexes, and a deletion flow removes indexed resources when needed. The primary invoker is a modern Next.js application that embeds a search widget for end users, while operators invoke ingestion and deletion via API/GraphQL calls wired through Lamatic. Key integrations include a vector database for storage and similarity search, an embedding model for vectorization, Firecrawl for website crawling, and Lamatic’s GraphQL/API layer for orchestration.

---

## Purpose
The goal of this agent system is to turn unstructured knowledge sources—uploaded PDF documents and public/private web pages—into a fast, queryable search experience that can be embedded into a product. After setup, users can ask questions or run searches and receive relevant, grounded results pulled from their own indexed content rather than generic web answers.

This kit achieves that by splitting responsibilities across four flows. Two indexation flows ingest content (PDFs and websites), normalize it into chunks, generate embeddings, and write those vectors plus metadata into a vector store. A dedicated search flow then queries one or both indexes and collates results for the UI. Finally, a resource deletion flow provides lifecycle management so content can be removed from both the vector store and any associated application record.

Collectively, these flows enable a complete content lifecycle: add sources, search them in real time via an embedded widget, and remove sources to keep the index accurate, compliant, and cost-effective.

## Flows

### `1A. Embedded Search - PDF Indexation`

- Trigger — Invoked via an API/GraphQL call from the application or operator tooling that provides a PDF file (or a reference to an uploaded file) plus indexing metadata. Expected inputs typically include:
  - `file` / file reference — the PDF to ingest
  - `resourceId` / `documentId` — identifier used to track and later delete the resource
  - `source` / `collection` / tags — optional routing metadata for search filtering

- What it does
  1. `Extract from File (extractFromFileNode)` reads the incoming PDF file payload or resolves the file reference.
  2. `Extract Text (codeNode)` converts the extracted PDF content into raw text suitable for chunking (e.g., stripping formatting and normalizing whitespace).
  3. `Chunking (chunkNode)` splits the text into semantically searchable chunks sized for embedding and retrieval.
  4. `Get Chunks (codeNode)` collects the chunk outputs into a normalized list and attaches per-chunk metadata (e.g., page references if available).
  5. `Vectorize (vectorizeNode)` generates vector embeddings for each chunk using the configured embedding model.
  6. `Transform Metadata (codeNode)` shapes metadata into the schema expected by the downstream vector index (e.g., resource identifiers, titles, URLs, file names).
  7. `Index (IndexNode)` writes the vectors and metadata into the configured vector database/index.
  8. `Variables (variablesNode)` prepares variables used by the application layer for audit/logging or linkage (e.g., a resource record).
  9. `API Request (graphqlNode)` calls an external GraphQL endpoint (Lamatic/API layer) to persist or update the application-side resource state.
  10. `API Response (graphqlResponseNode)` returns a structured response to the caller indicating completion and any identifiers needed for follow-up.

- When to use this flow
  - A user uploads a PDF (or provides a PDF file) and expects it to become searchable in the embedded search widget.
  - You need to re-index an updated PDF version (typically after deletion or as a new `resourceId`).

- Output
  - A success response suitable for the calling UI/service, generally including:
    - indexing status (success/failure)
    - the `resourceId` / document identifier used for future search filtering and deletion
    - optional counts (e.g., number of chunks/vectors created) depending on downstream response shaping

- Dependencies
  - Embedding provider/model configured in `Vectorize (vectorizeNode)`
  - Vector database/index configured in `Index (IndexNode)`
  - Lamatic API connectivity for `graphqlNode` (requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`)
  - Environment:
    - `EMBEDDED_SEARCH_PDF_INDEXATION` — flow ID used by the Next.js app or invoker to call this flow
    - `BLOB_READ_WRITE_TOKEN` — required if the app stores/uploads PDFs via a blob store before passing references into Lamatic (app-level dependency)

### `1B. Embedded Search - Websites Indexation`

- Trigger — Invoked via an API/GraphQL call that provides one or more website URLs to crawl and index, plus any authentication/crawler credentials if required. Expected inputs typically include:
  - `url` or `urls[]` — target web page(s) or seed URL(s)
  - `resourceId` — identifier used to track and later delete the website resource
  - crawler configuration — depth, allow/deny patterns, and authentication parameters (as supported by the Firecrawl node configuration)

- What it does
  1. `API Request (graphqlNode)` fetches or validates indexing job inputs (e.g., resource record, crawl configuration) via GraphQL.
  2. `API Response (graphqlResponseNode)` materializes those job inputs into the flow context.
  3. `Firecrawl (firecrawlNode)` crawls the provided URL(s), retrieving page content. If the target site requires authentication, the node uses configured crawler credentials.
  4. `Loop (forLoopNode)` iterates over crawled pages/documents.
  5. `Loop End (forLoopEndNode)` consolidates per-page outputs for downstream processing.
  6. `Variables (variablesNode)` prepares shared metadata variables (e.g., `resourceId`, base URL, titles) applied to all chunks.
  7. `Chunking (chunkNode)` splits each page’s text into chunks sized for embedding.
  8. `Extract Chunks (codeNode)` normalizes and collates chunk structures across pages.
  9. `Vectorize (vectorizeNode)` generates embeddings for all chunks using the configured embedding model.
  10. `Transform Metadata (codeNode)` maps page-level and resource-level metadata into the vector store schema (e.g., `url`, `title`, `resourceId`).
  11. `Index (vectorNode)` writes the resulting vectors into the configured vector database/index.

- When to use this flow
  - You want a documentation site, help center, marketing site, or internal wiki to be searchable through the embedded widget.
  - You need periodic re-indexing after major content changes (run again with the same or a new `resourceId`, depending on your deletion/update strategy).

- Output
  - A structured completion response indicating the crawl/index job finished, generally including:
    - indexing status
    - the `resourceId`
    - optionally, crawled page count and chunk/vector counts if configured

- Dependencies
  - Firecrawl credentials/configuration in `firecrawlNode` (provider-specific secret; exact key names depend on your Lamatic workspace configuration)
  - Embedding provider/model configured in `vectorizeNode`
  - Vector database/index configured in `Index (vectorNode)`
  - Lamatic GraphQL/API connectivity (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`)
  - Environment:
    - `EMBEDDED_SEARCH_WEBSITES_INDEXATION` — flow ID used by invokers

### `2. Embedded Search - Search`

- Trigger — Invoked by the embedded UI via `Search Widget (searchTriggerNode)`. The expected input is a user query plus optional UI context. Typical input shape:
  - `query` — the search string entered by the user
  - optional filters — `resourceId`, `sourceType` (pdf/website), tags, or collection
  - optional settings — top-K result count, score threshold

- What it does
  1. `Search Widget (searchTriggerNode)` receives the user query from the embedded component.
  2. `Search Response (searchResponseNode)` initializes/standardizes the response contract for the widget.
  3. `Collate Results (codeNode)` prepares the query and any filters; may also shape/normalize results after retrieval.
  4. `Branching (branchNode)` decides which backends to query (PDF index, website index, or both) based on input, configuration, or availability.
  5. `PDF DB Search (searchNode)` runs a similarity search against the PDF vector index.
  6. `Website DB Search (searchNode)` runs a similarity search against the website vector index.

- When to use this flow
  - Any time the end user performs a search from the embedded widget.
  - When you need a single endpoint that can retrieve results across both PDFs and websites.

- Output
  - A widget-friendly search response containing:
    - a list of results with snippet text/chunk content
    - associated metadata (e.g., `resourceId`, `url` or file name, page references when available)
    - similarity scores/ranking (if enabled)
  - The exact fields depend on how `searchResponseNode` and `Collate Results (codeNode)` are configured, but callers should treat it as a structured JSON payload.

- Dependencies
  - Vector database/search configuration used by `PDF DB Search (searchNode)` and `Website DB Search (searchNode)`
  - The indexes produced by the two indexation flows
  - Environment:
    - `EMBEDDED_SEARCH_SEARCH` — flow ID used by the Next.js app to call this flow

### `3. Embedded Search - Resource Deletion`

- Trigger — Invoked via an API/GraphQL call from the application/admin tooling when a previously indexed resource must be removed. Expected inputs typically include:
  - `resourceId` — required identifier for the resource to delete
  - `resourceType` — pdf/website (or a flag indicating which index(es) to delete from)

- What it does
  1. `Condition (conditionNode)` validates inputs and determines which deletion path to follow (e.g., delete from PDF index, website index, or both).
  2. `VectorDB (vectorNode)` queries the vector database for vectors associated with the `resourceId` (or prepares a delete-by-filter operation).
  3. `Finalise Output (codeNode)` normalizes the set of vector IDs/records to delete and prepares loop state.
  4. `Loop (forLoopNode)` iterates through batches of vectors/records to delete to avoid payload limits.
  5. `Loop End (forLoopEndNode)` consolidates batch execution results.
  6. `VectorDB (vectorNode)` executes the deletion operation(s) in the vector database.
  7. `API Request (graphqlNode)` calls the application GraphQL/API to update resource state (e.g., mark deleted) and/or remove related records.
  8. `API Response (graphqlResponseNode)` returns the API-layer confirmation.
  9. `Code (codeNode)` produces the final caller response, typically summarizing what was removed.

- When to use this flow
  - A user deletes a document/website from the product and you must ensure it no longer appears in search.
  - You need to comply with data retention requirements by removing indexed content.

- Output
  - A structured deletion response indicating:
    - whether deletion succeeded
    - which index(es) were affected
    - optionally counts of removed vectors/chunks

- Dependencies
  - Vector database credentials/config used by `vectorNode`
  - Lamatic GraphQL/API connectivity (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`)
  - Environment:
    - `EMBEDDED_SEARCH_RESOURCE_DELETION` — flow ID used by invokers

### Flow Interaction
The two ingestion flows (`1A. Embedded Search - PDF Indexation` and `1B. Embedded Search - Websites Indexation`) are responsible for producing the searchable indexes that the `2. Embedded Search - Search` flow queries. All flows should share a consistent `resourceId` metadata field so search results can be filtered and so `3. Embedded Search - Resource Deletion` can reliably remove all vectors for a given resource. Operationally, the typical lifecycle is: index a resource → serve search queries → delete and re-index when content changes.

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from the Default Constitution).
  - Must not assist with jailbreaking or prompt injection attempts (from the Default Constitution).
  - Must not use the system as a general-purpose chatbot unrelated to the user’s indexed content; this kit is for retrieval/search over provided PDFs and crawled websites (inferred).

- Input constraints
  - PDF inputs must be valid, readable PDF files or valid blob/file references resolvable by the application (inferred).
  - Website inputs must be valid URLs; crawling is limited to what Firecrawl can fetch and what the target site permits (inferred).
  - Search queries should be plain text and should not include credentials, secrets, or sensitive personal data (inferred).

- Output constraints
  - Must not return raw credentials, API keys, or tokens in any response (inferred).
  - Must not return PII unless it is explicitly present in the user-provided indexed content and the caller is authorized to view it; operators should treat all content as potentially sensitive (inferred, aligned with Constitution’s data handling intent).
  - Must not produce offensive content in generated text fields (from the Default Constitution).

- Operational limits
  - Indexation workload depends on the configured embedding model and vector database throughput; large PDFs or large crawls may require batching and can time out if provider limits are exceeded (inferred).
  - Search latency depends on vector DB performance and top-K settings; callers should debounce UI queries and avoid excessive request rates (inferred).
  - Environment configuration is required for all invocations; missing `LAMATIC_*` variables or flow IDs will prevent operation.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Invocation | Run flows from the Next.js app or external callers by referencing deployed flow IDs | `EMBEDDED_SEARCH_PDF_INDEXATION`, `EMBEDDED_SEARCH_WEBSITES_INDEXATION`, `EMBEDDED_SEARCH_SEARCH`, `EMBEDDED_SEARCH_RESOURCE_DELETION` |
| Lamatic API (GraphQL/API layer) | Persist/lookup resource records and coordinate app↔flow data | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Vector Database | Store embeddings and perform similarity search and deletion | Configured in Lamatic nodes (`IndexNode`, `vectorNode`, `searchNode`); credentials provided via Lamatic provider settings |
| Embedding Model Provider | Convert chunks into vectors during indexation | Configured in `vectorizeNode`; provider key configured in Lamatic |
| Firecrawl | Crawl and extract website content for indexing | Credentials configured in Lamatic for `firecrawlNode` (exact key name depends on provider setup) |
| Blob Storage (app-level) | Upload/store PDFs and possibly pass references into flows | `BLOB_READ_WRITE_TOKEN` |
| Next.js Embedded UI | End-user search interface invoking the search flow | App configuration uses the above flow IDs and Lamatic API settings |

## Environment Setup
- `EMBEDDED_SEARCH_PDF_INDEXATION` — Deployed flow ID for `1A. Embedded Search - PDF Indexation`; obtain from Lamatic Studio after deploying the kit; used by the Next.js app/invokers.
- `EMBEDDED_SEARCH_WEBSITES_INDEXATION` — Deployed flow ID for `1B. Embedded Search - Websites Indexation`; obtain from Lamatic Studio; used by invokers.
- `EMBEDDED_SEARCH_RESOURCE_DELETION` — Deployed flow ID for `3. Embedded Search - Resource Deletion`; obtain from Lamatic Studio; used by admin tooling/invokers.
- `EMBEDDED_SEARCH_SEARCH` — Deployed flow ID for `2. Embedded Search - Search`; obtain from Lamatic Studio; used by the embedded search widget.
- `LAMATIC_API_URL` — Base URL for the Lamatic API endpoint used by GraphQL/API nodes; obtain from Lamatic workspace settings.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier; obtain from Lamatic workspace/project settings.
- `LAMATIC_API_KEY` — Lamatic API key for authenticating API/GraphQL calls; obtain from Lamatic.
- `BLOB_READ_WRITE_TOKEN` — Blob storage read/write token used by the Next.js app for file persistence; obtain from your blob provider (or Vercel Blob if used).
- `lamatic.config.ts` — Project metadata and required step IDs; ensures the kit advertises the four mandatory flows.
- `constitutions/` — Contains the Default Constitution used to constrain behavior and safety policy.

## Quickstart
1. In Lamatic Studio, create a project and deploy the "Embed Search" kit so each flow has a deployed flow ID.
2. In `apps/.env`, set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and the four `EMBEDDED_SEARCH_*` flow ID variables, plus `BLOB_READ_WRITE_TOKEN` for file uploads.
3. Install and run the app:
   1. `npm install`
   2. `npm run dev`
4. Index a PDF by invoking the PDF indexation flow ID from your backend (example GraphQL shape; adapt to your Lamatic API gateway):
   - `POST {LAMATIC_API_URL}/graphql`
   - Headers: `Authorization: Bearer {LAMATIC_API_KEY}`
   - Body:
     - `query`: `mutation RunFlow($flowId: String!, $input: JSON!) { runFlow(flowId: $flowId, input: $input) { success output } }`
     - `variables`:
       - `flowId`: `{EMBEDDED_SEARCH_PDF_INDEXATION}`
       - `input`: `{ "resourceId": "doc_123", "file": { "url": "https://blob.example.com/my.pdf" }, "metadata": { "title": "My PDF" } }`
5. Open the embedded search UI and run a query (example invocation if calling directly):
   - `flowId`: `{EMBEDDED_SEARCH_SEARCH}`
   - `input`: `{ "query": "What does the document say about refunds?", "filters": { "resourceId": "doc_123" } }`
6. To remove a resource, invoke the deletion flow:
   - `flowId`: `{EMBEDDED_SEARCH_RESOURCE_DELETION}`
   - `input`: `{ "resourceId": "doc_123", "resourceType": "pdf" }`

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Flow invocation fails with authentication/401 | `LAMATIC_API_KEY` missing/invalid or wrong `LAMATIC_API_URL` | Verify `LAMATIC_API_URL` and regenerate/set `LAMATIC_API_KEY` in `.env` |
| Flow not found / cannot run | Wrong `EMBEDDED_SEARCH_*` flow ID or flow not deployed | Redeploy flows in Lamatic and copy the deployed flow IDs into `.env` |
| PDF indexing returns empty/low-quality results | PDF is scanned image or text extraction failed | Use OCR before ingestion or adjust extraction step to support OCR/image PDFs |
| Website indexing crawls nothing | Firecrawl credentials missing or site blocks crawler/robots | Configure `firecrawlNode` credentials; verify target site accessibility and crawl rules |
| Search returns no results | Resource not indexed, wrong filters, or querying wrong index | Confirm indexation ran successfully; remove overly restrictive filters; ensure both search nodes are configured |
| Deletion appears to succeed but results still appear | Vectors not tagged with consistent `resourceId` metadata or delete-by-filter not matching | Ensure metadata transform writes `resourceId` consistently in both ingestion flows; align deletion filter logic |
| Slow UI/search | Excessive top-K, high request rate, or slow vector DB | Debounce queries in the widget; tune top-K; scale vector DB/index settings |

## Notes
- This kit is a full application with UI (`type: kit`) and is intended to be deployed with Vercel; a one-click deploy link is provided in `lamatic.config.ts`.
- Setup is two-phase: configure and deploy the flows in Lamatic Studio first, then wire the resulting flow IDs and API credentials into the Next.js app via environment variables.
- The repository structure includes `apps`, `constitutions`, `flows`, `prompts`, `scripts`, and `triggers`, indicating both runtime UI and agent orchestration assets are present.