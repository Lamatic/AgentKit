# Scraping Indexation
A flow that scrapes public web pages from supplied URLs, chunks and embeds their content, and indexes the resulting records into a vector database for the wider RAG knowledge pipeline.

## Purpose
This flow is responsible for turning website content into retrievable knowledge. It accepts one or more public URLs, uses Firecrawl to scrape the pages, extracts the main markdown content and page metadata, splits that content into retrieval-sized chunks, generates embeddings for those chunks, and writes both vectors and metadata into a configured vector database. In practice, it solves the web-ingestion part of knowledge preparation for sites that should become part of the chatbot’s searchable corpus.

The outcome is an indexed set of page chunks, each associated with metadata such as page title, description, and source URL. That matters because downstream retrieval depends on semantically searchable, chunked records rather than raw HTML or full-page text. Without this step, the broader system would have no structured representation of website content to retrieve at question time.

In the broader agent architecture, this flow sits on the ingestion side of the RAG pipeline. It is an entry-point flow used during knowledge base setup or refresh, before the `Knowledge Chatbot` flow is invoked. Its role is in the prepare-and-index stage: collect source material, normalize it, vectorize it, and store it so later flows can retrieve relevant context and synthesize grounded answers.

## When To Use
- Use when you need to ingest content from one or more public web pages into the shared vector knowledge base.
- Use when the source material is best accessed by URL rather than through a native connector such as Google Drive, SharePoint, S3, Postgres, or spreadsheets.
- Use when you want website content to become available to the downstream RAG chatbot for semantic retrieval.
- Use when operators are setting up or refreshing a knowledge base built from external web content.
- Use when the input is a list of concrete page URLs and synchronous scraping is acceptable.

## When Not To Use
- Do not use when the source data lives in a different system with a dedicated sibling indexation flow, such as cloud storage, office suites, databases, or document repositories.
- Do not use when no vector database has been configured; this flow cannot complete without a target index.
- Do not use when Firecrawl credentials are missing or invalid.
- Do not use when the input is not a URL list, such as raw document text, file uploads, database rows, or user questions.
- Do not use when you need live answer generation; this flow only prepares indexed knowledge and does not return retrieved passages or chatbot responses.
- Do not use for deep multi-level site discovery or broad crawling campaigns; this flow is configured for batch scraping of the provided URLs rather than aggressive recursive crawling.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | array of strings or comma-separated string | Yes | One or more URLs to scrape and index. The trigger receives this payload and passes it to Firecrawl batch scraping. |

Below the trigger-level payload, the flow also depends on private runtime configuration supplied to internal nodes:

- `credentials` — required Firecrawl credential selection used by `Firecrawl` for crawler authentication.
- `vectorDB` — required vector database selection used by `Index` as the storage target.
- `embeddingModelName` — required embedding model used by `Vectorize` to convert text chunks into vectors.

Notable input constraints and assumptions:

- `urls` is expected to contain valid, fully qualified URLs such as `https://example.com`.
- The flow is configured to pass `urls` directly into Firecrawl `syncBatchScrape`, so malformed entries may cause scrape failures or partial results.
- The sample input shows `urls` as an array, but the Firecrawl input description indicates a comma-separated string may also be accepted by the underlying node.
- This flow is optimized for page content extraction, not arbitrary binary files or authenticated app pages unless the selected Firecrawl credentials support access.
- Firecrawl is configured with a `limit` of `10`, so very large input sets may require batching across multiple invocations.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | string | Fixed success message: `Records indexed successfully`. |

The API response is a small structured object containing a single human-readable status field. It does not return the scraped page data, generated chunks, embedding vectors, or per-record indexing results. Success indicates the flow reached its response node, but it does not provide a detailed count of indexed items in the response payload.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point ingestion flow invoked directly through `API Request`.
- In the broader bundle, it is part of the ingestion/indexation layer that prepares data for retrieval, but it does not require another flow to run first.

### Downstream Flows
- `Knowledge Chatbot` or any retrieval flow backed by the same vector database — consumes the indexed vectors and metadata written by this flow rather than this flow’s API response.
- Operationally, downstream consumers rely on the records stored by `Index`, especially the embedded chunk vectors and associated metadata fields, to perform semantic search and grounded response generation.
- No downstream flow meaningfully depends on the response field `output`; that field is primarily for operator confirmation.

### External Services
- Firecrawl — scrapes and extracts page content from the supplied URLs — required credential: selected `credentials` input on `Firecrawl`.
- Embedding model provider — generates vector embeddings for text chunks — required configuration: selected `embeddingModelName` on `Vectorize`.
- Vector database — stores vectors and metadata for later retrieval — required configuration: selected `vectorDB` on `Index`.
- Lamatic API trigger/runtime — receives the request and returns the final response — no explicit user-supplied credential shown in this flow.

### Environment Variables
- No explicit environment variables are referenced in the flow source.
- Credential and model selections are configured as private node inputs rather than named environment variables.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the incoming API payload in realtime mode. For this flow, the important trigger field is `urls`, which is forwarded into the scraping stage.

2. `Firecrawl` (`dynamicNode`) runs in `syncBatchScrape` mode against `{{triggerNode_1.output.urls}}`. It attempts to fetch the supplied pages, extracting main content only, with `onlyMainContent` enabled, `ignoreQueryParameters` enabled, a `timeout` of `30000`, and a scrape `limit` of `10`. Its output is a list of scraped page records under `data`.

3. `Loop` (`forLoopNode`) iterates over `{{firecrawlNode_785.output.data}}`, processing one scraped page record at a time. This is the core fan-out mechanism that ensures each page becomes its own chunking, embedding, and indexing sequence.

4. `Variables` (`dynamicNode`) maps selected page metadata from the current loop item into normalized local fields. Specifically, it captures `title` from `currentValue.metadata.title`, `description` from `currentValue.metadata.description`, and `source` from `currentValue.metadata.url`. These values are later used to build the metadata stored alongside vectors.

5. `Chunking` (`dynamicNode`) splits the current page’s markdown content from `{{forLoopNode_370.output.currentValue.markdown}}` into smaller overlapping text segments. It uses recursive character splitting with `500` characters per chunk, `50` characters of overlap, and separators of paragraph, newline, then space. This creates chunk boundaries suitable for semantic retrieval while preserving continuity.

6. `Extract Chunks` (`dynamicNode`) runs the referenced script `@scripts/scraping-indexation_extract-chunks.ts`. In context, this script reshapes the `Chunking` output into the text list expected by the embedding step. Its output is passed directly into `Vectorize`.

7. `Vectorize` (`dynamicNode`) takes the extracted chunk text from `{{codeNode_794.output}}` and sends it to the selected embedding model. The result is a set of vector representations aligned to the page chunks.

8. `Transform Metadata` (`dynamicNode`) runs the referenced script `@scripts/scraping-indexation_transform-metadata.ts`. In context, this script combines the vectors produced by `Vectorize` with the normalized metadata from earlier steps so the indexing node receives two coordinated payloads: `vectors` and `metadata`.

9. `Index` (`dynamicNode`) writes the transformed vectors and metadata into the selected vector database using the `index` action. It reads vectors from `{{codeNode_305.output.vectors}}` and metadata from `{{codeNode_305.output.metadata}}`, uses `title` as the configured primary key, and applies `overwrite` as the duplicate handling strategy. This means records with the same primary key can replace existing records.

10. `Loop End` (`forLoopEndNode`) closes the iteration for the current page and either returns control to `Loop` for the next scraped result or exits the loop once all items have been processed.

11. `API Response` (`dynamicNode`) returns a fixed response object containing `output: Records indexed successfully`. This is the flow’s final acknowledgement to the caller after loop completion.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails at scraping stage | `credentials` for Firecrawl are missing, invalid, or do not permit the requested access | Configure a valid Firecrawl credential in the `Firecrawl` node input and confirm the target URLs are accessible with that credential |
| Flow returns success message but expected pages are not searchable later | Firecrawl returned empty or low-quality content, indexing wrote fewer records than expected, or retrieval is pointed at a different vector database | Inspect Firecrawl results, confirm the selected `vectorDB`, and verify the downstream retrieval flow uses the same index |
| Scraping produces no items | `urls` is empty, malformed, blocked, unreachable, or outside what Firecrawl can fetch successfully | Provide valid public URLs, test them individually, and batch problematic sites separately |
| Flow fails before indexing | `embeddingModelName` is not configured or the selected embedding model is unavailable | Select a valid embedding model supported by the workspace and retry |
| Flow fails at indexing stage | `vectorDB` is not configured, unavailable, or rejects the payload shape | Select a valid vector database connection and verify it supports indexing with the provided vectors and metadata |
| Existing records appear to be replaced unexpectedly | Duplicate handling is set to `overwrite` and `title` is used as the primary key | Use unique page titles where possible or adjust the indexing design if title collisions are likely |
| Some content is missing from indexed results | `onlyMainContent` strips non-main sections, or chunking omits content that was not present in the scraped markdown | Review whether the site’s important content is present in Firecrawl output; if not, adjust the scraping approach or use a different ingestion method |
| Very large batches fail or behave inconsistently | Firecrawl `limit` is `10` and synchronous scraping may time out or stress upstream sites | Split the input URL set into smaller batches and run the flow multiple times |
| Upstream dependency error reported by operators | This flow was assumed to need another ingestion flow first | Invoke this flow directly; it is an entry-point flow and does not require a prior flow run |

## Notes
- The flow name and README position it as part of a multi-flow knowledge ingestion bundle, but this specific implementation is narrowly scoped to website scraping and vector indexation.
- The scraping node is configured for `syncBatchScrape`, not asynchronous webhook-driven scraping. This keeps invocation simple but may be less suitable for long-running or very large jobs.
- Page metadata is normalized to `title`, `description`, and `source`. Additional metadata present in the scrape result is not explicitly preserved unless the transformation script includes it.
- The configured primary key is `title`, which may not be globally unique across a site or across multiple sites. Developers should be aware of possible overwrite collisions.
- The final API response is intentionally minimal. If operators need per-page counts, skipped URLs, or indexing diagnostics, the flow would need an expanded response contract or external observability.
- Although several crawl-related fields exist on the Firecrawl node, this flow is effectively using batch scraping of provided URLs rather than a true recursive website crawl.