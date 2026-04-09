# Semantic Search

## Overview
This AgentKit bundle solves the problem of making heterogeneous enterprise content searchable with natural-language queries by building a unified vector index across multiple data sources. It uses a **multi-flow pipeline** architecture: several indexation flows ingest and vectorize content, and a dedicated retrieval flow performs semantic (vector) search over the resulting index. The primary invokers are developers and operators embedding search into internal tools, support portals, or product experiences via an API/widget trigger. Key integrations include cloud content sources (Google Drive/Sheets, OneDrive, SharePoint, S3), relational data (Postgres), web crawling/scraping via Firecrawl, and a vector database/index accessed through AgentKit indexing and search nodes.

---

## Purpose
The goal of this agent system is to turn your organization’s documents, rows, and web content into a searchable knowledge layer that responds to user intent rather than exact keywords. After it runs, your content is chunked, embedded, and stored in a vector index so that end users can ask questions in natural language and get the most relevant source-backed matches.

The system is organized around two cooperating capabilities: (1) indexation flows that ingest content from a chosen source, normalize it into text, create semantic embeddings, and store vectors plus metadata; and (2) a semantic retrieval flow that takes a user query, performs vector search, and returns collated results suitable for a UI widget or API consumer.

Because data sources differ in shape (files vs. spreadsheets vs. database rows vs. web pages), each indexation flow implements source-specific extraction and metadata mapping while keeping the downstream steps consistent (chunking → vectorization → indexing). Collectively, these flows provide a uniform search experience across structured and unstructured information.

---

## Flows

### `Crawling Indexation`
- Trigger
  - Invoked via an API request handled by `graphqlNode` (GraphQL-style request/response pattern).
  - Expected input shape (conceptual):
    - A crawl seed (e.g., one or more starting URLs).
    - Crawl configuration (scope, limits, filters) as supported by the underlying `firecrawlNode`.
    - Indexing configuration (target collection/index name, optional metadata tags).
- What it does
  1. `graphqlNode` receives the crawl/index request and validates/forwards parameters into the flow.
  2. `firecrawlNode` crawls pages starting from the provided seed(s) and returns page content and per-page metadata (URL, title, etc.).
  3. `forLoopNode` iterates over crawled items so each page is processed independently.
  4. `variablesNode` shapes per-item variables (e.g., page text, URL, source identifiers) for consistent downstream use.
  5. `chunkNode` splits page text into retrieval-friendly chunks.
  6. `codeNode` (Extract Chunks) converts the chunking output into the exact list/structure expected by embedding and indexing steps.
  7. `vectorizeNode` generates embeddings for each chunk using the configured embedding model/provider.
  8. `codeNode` (Transform Metadata) maps crawl/page metadata into the index schema (e.g., `source`, `url`, `title`, `chunkId`).
  9. `vectorNode` indexes embeddings and metadata into the configured vector store.
  10. `graphqlResponseNode` returns an API response summarizing what was indexed.
- When to use this flow
  - You want to build a search index from a website or web-accessible documentation where discovery requires link traversal (not just a fixed list of URLs).
  - You need automated coverage of a domain or path over time, subject to crawl limits.
- Output
  - A GraphQL/API response (via `graphqlResponseNode`) typically containing:
    - Status (success/failure).
    - Counts (pages processed, chunks indexed).
    - Optional identifiers (job/run id, target index/collection).
- Dependencies
  - Firecrawl access/config for `firecrawlNode` (API key and endpoint as required by your Firecrawl setup).
  - Embedding provider/model configured for `vectorizeNode`.
  - Vector database/index configured for `vectorNode`.
  - Project-level API access:
    - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `GDrive`
- Trigger
  - Invoked by the `googleDriveNode` integration (operator-initiated run or API invocation depending on deployment).
  - Expected input shape (conceptual):
    - Drive scope (folder id(s), file id(s), or query).
    - Optional include/exclude patterns and mime-type filters.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `googleDriveNode` lists and fetches eligible Google Drive files and their metadata.
  2. `chunkNode` performs chunking of extracted document text.
  3. `codeNode` (Extract Chunked Text) normalizes chunk outputs into plain text segments.
  4. `vectorizeNode` generates embeddings for each chunk.
  5. `codeNode` (Transform Metadata) maps Drive metadata (file id, name, path, modified time, link) into the index schema.
  6. `IndexNode` writes vectors + metadata into the vector store.
  7. `addNode` aggregates/combines intermediate results (e.g., totals, arrays) for reporting.
  8. `variablesNode` finalizes variables returned or used by subsequent steps.
- When to use this flow
  - You need semantic search over Google Drive documents (docs, PDFs, text files) for support, internal knowledge, or product documentation.
  - Your content is primarily file-based and organized in Drive folders.
- Output
  - A run summary (implementation-specific), typically including:
    - Number of files processed.
    - Number of chunks indexed.
    - Target index/collection identifiers.
- Dependencies
  - Google Drive OAuth/service credentials for `googleDriveNode`.
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `IndexNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `GSheet`
- Trigger
  - Invoked by the `googleSheetsNode` integration.
  - Expected input shape (conceptual):
    - Spreadsheet id and sheet/tab selection.
    - Row range or selection criteria.
    - Which columns to include in the text representation.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `googleSheetsNode` reads rows and associated metadata from Google Sheets.
  2. `vectorizeNode` generates embeddings for row-level textual representations.
  3. `codeNode` (Transform Metadata) maps spreadsheet metadata (spreadsheet id, sheet name, row id) into the index schema.
  4. `IndexNode` indexes vectors + metadata.
  5. `addNode` aggregates results for reporting.
  6. `codeNode` (Row Chunking) converts rows into chunkable/searchable text units (for long rows or combined fields).
  7. `variablesNode` finalizes output variables.
- When to use this flow
  - Your knowledge base is stored as structured rows (FAQs, product catalogs, support macros) in Google Sheets.
  - You want row-accurate retrieval with metadata that points back to a row/cell context.
- Output
  - A run summary including counts of rows processed and vectors indexed, plus target index information.
- Dependencies
  - Google Sheets credentials for `googleSheetsNode`.
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `IndexNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `Onedrive`
- Trigger
  - Invoked by the `onedriveNode` integration.
  - Expected input shape (conceptual):
    - OneDrive/tenant scope (drive id, folder id, file ids).
    - Filters for file types and recursion.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `onedriveNode` fetches files and metadata from OneDrive Business.
  2. `chunkNode` chunks extracted document text.
  3. `codeNode` (Get Chunks) normalizes chunk output.
  4. `vectorizeNode` computes embeddings.
  5. `codeNode` (Transform Metadata) maps OneDrive metadata (drive/file ids, names, links) into index fields.
  6. `IndexNode` indexes vectors + metadata.
  7. `addNode` aggregates run totals.
  8. `variablesNode` finalizes output variables.
- When to use this flow
  - Your enterprise documents live in Microsoft 365 OneDrive and must be searchable with the same semantics as other sources.
- Output
  - A run summary with counts (files/chunks indexed) and target index identifiers.
- Dependencies
  - Microsoft Graph/OneDrive credentials for `onedriveNode`.
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `IndexNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `Postgres`
- Trigger
  - Invoked by the `postgresNode` integration.
  - Expected input shape (conceptual):
    - Connection configuration (host, db, user) managed by the integration.
    - Query or table selection.
    - Column mapping for text fields and identifier fields.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `postgresNode` reads records from Postgres.
  2. `vectorizeNode` generates embeddings from record text representations.
  3. `codeNode` (Transform Metadata) maps relational metadata (table, primary key, timestamps) into index fields.
  4. `IndexNode` indexes vectors + metadata.
  5. `addNode` aggregates results.
  6. `codeNode` (Row Chunking) chunks/normalizes long text fields or multi-column concatenations.
  7. `variablesNode` finalizes output variables.
- When to use this flow
  - Your searchable knowledge is in structured database tables (tickets, articles, product data) and you want semantic retrieval without building a custom ETL pipeline.
- Output
  - A run summary including records processed and vectors indexed, plus target index info.
- Dependencies
  - Postgres credentials/connection settings for `postgresNode`.
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `IndexNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `S3`
- Trigger
  - Invoked by the `s3Node` integration.
  - Expected input shape (conceptual):
    - Bucket and prefix selection.
    - Object filters (suffix/mime-type) and recursion.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `s3Node` enumerates objects in S3 and fetches object metadata.
  2. `addNode` aggregates object listings or builds a processing list.
  3. `extractFromFileNode` retrieves and extracts content from binary files (e.g., PDF, DOCX) as supported.
  4. `codeNode` (Extract Text) normalizes extracted content into plain text.
  5. `chunkNode` splits text into chunks.
  6. `codeNode` (Get Chunks) shapes chunks into embedding inputs.
  7. `vectorizeNode` computes embeddings.
  8. `codeNode` (Transform Metadata) maps S3 object metadata (bucket, key, version, etag) into index fields.
  9. `IndexNode` indexes vectors + metadata.
  10. `variablesNode` finalizes output variables.
- When to use this flow
  - Your documents are stored in S3 (data lake exports, knowledge dumps, manuals) and need semantic search without building a separate document processing stack.
- Output
  - A run summary with objects processed, chunks indexed, and target index identifiers.
- Dependencies
  - AWS credentials/permissions for `s3Node` (read access to the target bucket/prefix).
  - File extraction support for `extractFromFileNode` (runtime must include required parsers where applicable).
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `IndexNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `Scraping Indexation`
- Trigger
  - Invoked via `graphqlNode` (GraphQL-style API request), similar to `Crawling Indexation`.
  - Expected input shape (conceptual):
    - One or more explicit URLs to scrape.
    - Scrape options (rendering, extraction rules) as supported by `firecrawlNode`.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `graphqlNode` receives the scrape/index request.
  2. `firecrawlNode` scrapes the provided URLs and returns extracted page content.
  3. `forLoopNode` iterates over scraped pages.
  4. `variablesNode` prepares per-page variables.
  5. `chunkNode` chunks page text.
  6. `codeNode` (Extract Chunks) shapes chunk output.
  7. `vectorizeNode` creates embeddings for each chunk.
  8. `codeNode` (Transform Metadata) maps URL/page metadata into index fields.
  9. `vectorNode` indexes embeddings and metadata into the vector store.
  10. `graphqlResponseNode` returns a GraphQL/API response summarizing indexing results.
- When to use this flow
  - You already know the exact URLs to ingest and do not need link traversal.
  - You want deterministic, curated scraping (specific docs pages, changelogs, policy pages).
- Output
  - A GraphQL/API response including success status and indexing counts.
- Dependencies
  - Firecrawl access/config for `firecrawlNode`.
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `vectorNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `Semantic Search`
- Trigger
  - Invoked by `searchTriggerNode` labeled “Search Widget”.
  - Expected input shape (conceptual):
    - `query`: the natural-language search query string.
    - Optional retrieval parameters: `topK`/limit, filters (by `source`, tags), and a target index/collection selector.
- What it does
  1. `searchTriggerNode` receives a search request (typically from an embedded widget or a UI-integrated call).
  2. `searchNode` performs vector search over the indexed content using the query embedding and configured vector store.
  3. `codeNode` (Collate Results) post-processes raw matches into a stable response shape (ranking, deduping, field selection).
  4. `searchResponseNode` returns the final response payload to the caller.
- When to use this flow
  - You have already run one or more indexation flows and want to serve end-user semantic retrieval.
  - You want a simple, UI-friendly response for a search bar or support widget.
- Output
  - A search response (via `searchResponseNode`) typically containing:
    - The original `query`.
    - A list of results with `score`/similarity and `metadata` (e.g., title, URL/file link, source identifiers).
    - Snippets or chunk text where configured.
- Dependencies
  - Vector store/index access for `searchNode`.
  - Embedding provider/model used for query embeddings (must match the embedding space used at index time).
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### `Sharepoint`
- Trigger
  - Invoked by the `sharepointNode` integration.
  - Expected input shape (conceptual):
    - Tenant/site and library/folder selection.
    - Filters for file types and recursion.
    - Indexing configuration (target index/collection, metadata tags).
- What it does
  1. `sharepointNode` fetches files and metadata from SharePoint Business.
  2. `chunkNode` chunks extracted text.
  3. `codeNode` (Get Chunks) shapes chunk output for embedding.
  4. `vectorizeNode` computes embeddings.
  5. `codeNode` (Transform Metadata) maps SharePoint metadata (site, library, file ids, links) into index fields.
  6. `IndexNode` indexes vectors + metadata.
  7. `addNode` aggregates run totals.
  8. `variablesNode` finalizes output variables.
- When to use this flow
  - Your organization’s content lives in SharePoint and needs to be searchable alongside other sources.
- Output
  - A run summary with counts (files/chunks indexed) and target index identifiers.
- Dependencies
  - Microsoft Graph/SharePoint credentials for `sharepointNode`.
  - Embedding provider/model for `vectorizeNode`.
  - Vector store/index access for `IndexNode`.
  - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

### Flow Interaction
The indexation flows (`Crawling Indexation`, `Scraping Indexation`, `GDrive`, `GSheet`, `Onedrive`, `Sharepoint`, `S3`, `Postgres`) all converge on the same downstream contract: produce chunk-level text plus normalized metadata, generate embeddings via `vectorizeNode`, and write into a shared vector index via `IndexNode`/`vectorNode`. The `Semantic Search` flow depends on that index being populated and on consistent metadata mapping so results can be traced back to their original source (URL, file link, row identifier).

Operationally, the typical chain is:
- Run one or more indexation flows whenever content changes (initial backfill + periodic refresh).
- Route end-user queries to `Semantic Search` for retrieval.

---

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from project constitution).
  - Must not comply with jailbreaking or prompt-injection attempts (from project constitution).
  - Must not attempt to exfiltrate secrets or credentials from connected services (inferred).
  - Must not modify or delete source data in connected systems; flows are intended for read/index operations only (inferred).
- Input constraints
  - Treat all user inputs as potentially adversarial (from project constitution).
  - Search queries should be plain text; extremely long inputs may be truncated or rejected by embedding/model limits (inferred).
  - Crawling/scraping inputs must be valid URL(s) and should respect allowed domains and robots/policy constraints as configured in Firecrawl (inferred).
  - Database indexing inputs must reference allowed tables/queries configured for the Postgres integration; avoid arbitrary user-supplied SQL unless explicitly sandboxed (inferred).
- Output constraints
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from project constitution).
  - Must not return raw credentials, access tokens, or environment variable values (inferred).
  - Search results should avoid returning full sensitive document contents; prefer snippets/chunks necessary for relevance (inferred).
- Operational limits
  - Requires valid Lamatic project configuration and API access; flows will fail without `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY`.
  - Source connectors require their own credentials and permissions; access is constrained to what the credentials allow.
  - Crawling/scraping throughput depends on Firecrawl quotas and remote site rate limits (inferred).
  - Embedding and indexing throughput depends on model/provider rate limits and vector store write limits (inferred).

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic API | Execute flows, authenticate to the project | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Google Drive | Read and index Drive files | Google OAuth/client or service account configured for `googleDriveNode` |
| Google Sheets | Read and index spreadsheet rows | Google OAuth/client or service account configured for `googleSheetsNode` |
| OneDrive Business | Read and index OneDrive files | Microsoft Graph credentials configured for `onedriveNode` |
| SharePoint Business | Read and index SharePoint files | Microsoft Graph credentials configured for `sharepointNode` |
| AWS S3 | Read and index objects from S3 | AWS credentials/role access used by `s3Node` |
| Postgres | Read and index relational records | Postgres connection credentials used by `postgresNode` |
| Firecrawl | Crawl or scrape web content | Firecrawl API key/config used by `firecrawlNode` |
| Embedding model/provider | Generate embeddings for chunks/rows and queries | Provider/model configuration used by `vectorizeNode` and `searchNode` |
| Vector store / index | Store embeddings and execute vector search | Configuration used by `IndexNode`/`vectorNode` and `searchNode` |

---

## Environment Setup
- `LAMATIC_API_URL` — Lamatic API endpoint URL for your deployment; required by all flows.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier containing this bundle; required by all flows.
- `LAMATIC_API_KEY` — Lamatic API key with permission to run flows; required by all flows.
- Google credentials (in integration config) — OAuth/client or service account with Drive/Sheets access; required by `GDrive`, `GSheet`.
- Microsoft credentials (in integration config) — Graph API app registration/secret with OneDrive/SharePoint permissions; required by `Onedrive`, `Sharepoint`.
- AWS credentials (in integration config) — Access key/secret or role-based auth granting `s3:GetObject` and list permissions; required by `S3`.
- Postgres connection details (in integration config) — Host, port, database, user, password/SSL; required by `Postgres`.
- Firecrawl config (in integration config) — API key and any base URL/options; required by `Crawling Indexation`, `Scraping Indexation`.
- Vector store/index config (in integration config) — Collection/index name, endpoint, auth; required by all indexation flows and `Semantic Search`.
- Embedding provider config (in integration config) — Model name and API key/quota settings; required by all indexation flows and `Semantic Search`.

---

## Quickstart
1. Create a Lamatic project and load this bundle (`Semantic Search`), then note your `LAMATIC_PROJECT_ID`.
2. Configure environment variables from `.env.example`:
   - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.
3. Configure at least one data-source connector (for example Google Drive) and ensure it can read the target content.
4. Run an indexation flow to populate the vector index (example: `Scraping Indexation` via GraphQL-style API call):
   - Request shape (placeholders):
     - Operation: `scrapingIndexation`
     - Variables:
       - `urls`: `["https://docs.example.com/page-1", "https://docs.example.com/page-2"]`
       - `index`: `"support-kb"`
       - `metadata`: `{ "source": "docs" }`
5. Invoke the primary retrieval flow `Semantic Search` (widget/API trigger):
   - Request shape (placeholders):
     - `query`: "How do I reset my password?"
     - `topK`: 5
     - `filters`: `{ "source": "docs" }`
     - `index`: "support-kb"
6. Verify results include traceable metadata (URL/file link/row id) and refine chunking/index filters as needed.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Indexation flow returns auth/permission errors | Missing/invalid connector credentials (Google/Microsoft/AWS/Postgres) | Re-authorize the integration; confirm scopes/permissions; re-run the flow |
| Crawl/scrape flow returns empty content | URL blocked, robots/policy restrictions, or Firecrawl extraction config not suited | Test URL fetch in Firecrawl; adjust crawl scope/extraction options; verify target site accessibility |
| Vector indexing fails or times out | Vector store unavailable, misconfigured collection/index, or write rate limits | Validate vector store endpoint/auth; create/verify target index; reduce batch size or retry with backoff |
| Search returns irrelevant results | Poor chunking strategy, mismatched embedding model, or missing filters/metadata | Ensure the same embedding model is used for indexing and querying; tune chunk size/overlap; add metadata filters |
| Search returns no results | Index not populated or wrong index/collection selected | Run an indexation flow; confirm target index name used by both index and search |
| Postgres indexing misses expected records | Query/table selection incorrect or row-to-text mapping incomplete | Validate the integration query; include the right text columns; check row chunking logic |

---

## Notes
- Project type is `bundle` (multi-flow, no UI); flows are intended to be composed by selecting a single data source for indexation and then invoking `Semantic Search` for retrieval.
- The bundle exposes a single mandatory capability step `semantic-search` and a single-choice `data-source` step with options: `gdrive`, `gsheet`, `onedrive`, `postgres`, `s3`, `scraping-indexation`, `sharepoint`, `crawling-indexation`.
- Source material includes a default constitution; its safety and data-handling constraints apply to all flows.