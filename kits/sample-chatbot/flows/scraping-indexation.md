# Scraping Indexation
A flow that scrapes public webpages, converts their content into embeddings, and indexes them into the shared vector store used by the wider Knowledge Chatbot system.

## Purpose
This flow is responsible for turning one or more public website URLs into searchable knowledge. It accepts a list of URLs, uses Firecrawl to scrape page content, splits each page into chunk-sized units, vectorizes those chunks with a configured embedding model, and writes the resulting vectors plus metadata into a selected vector database. Its job is ingestion and index-building, not retrieval or answer generation.

The outcome is a populated or refreshed vector index containing page-level content from the supplied websites. That matters because the downstream chatbot depends on this indexed corpus to retrieve relevant passages at query time. Without this ingestion step, the RAG layer has no grounded web-derived knowledge to search over.

Within the broader bundle, this flow sits in the ingestion stage of the plan-retrieve-synthesize chain. It is an entry-point indexing flow alongside other source-specific indexers such as Google Drive, S3, Postgres, or SharePoint variants. After it runs, the `Knowledge Chatbot` flow can query the same vector store to retrieve these indexed chunks and synthesize answers grounded in scraped site content.

## When To Use
- Use when you need to ingest content from public webpages into the knowledge base.
- Use when the source of truth is a website rather than files, cloud storage, spreadsheets, or databases.
- Use when you have one or more known URLs that should be scraped and indexed for later RAG retrieval.
- Use when building or refreshing the website-backed portion of a vector database consumed by the chatbot.
- Use when an operator or automation wants to trigger indexation programmatically through an API request.

## When Not To Use
- Do not use when the content source is Google Drive, Google Sheets, OneDrive, SharePoint, S3, Postgres, or another sibling source-specific connector flow.
- Do not use when you need live web search at question time rather than pre-indexed website content.
- Do not use when no vector database has been configured or selected.
- Do not use when Firecrawl credentials are unavailable or invalid.
- Do not use when the incoming payload does not provide `urls` in a valid list or comma-separated string form expected by the scrape node.
- Do not use when you need deep crawling behavior beyond the fixed scrape settings in this flow, such as broad recursive site discovery; this flow is configured for batch scraping of supplied URLs rather than expansive crawling.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` or `string` | Yes | One or more target URLs to scrape. The Firecrawl node accepts either an array of URLs or a comma-separated string of URLs. |

Below the trigger-level payload, the flow also requires private runtime configuration on internal nodes:

- `credentials` on `Firecrawl` — required credential selection for authenticating Firecrawl requests.
- `vectorDB` on `Index` — required private selection of the destination vector database.
- `embeddingModelName` on `Vectorize` — required embedding model used to convert chunk text into vectors.

Notable input constraints and assumptions:

- `urls` is expected to be present on `triggerNode_1.output.urls`, which means callers should send it in the API request body using that field name.
- URLs should be publicly reachable by Firecrawl.
- The scrape mode is `syncBatchScrape`, so the flow assumes a bounded list of URLs rather than an unbounded crawl job.
- The configured scrape limit is `10`, so practical throughput is aligned to smaller batches unless the flow is edited.
- Query parameters are ignored during scraping, which may collapse variant URLs onto a canonical page fetch behavior.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | A fixed success message: `Records indexed successfully`. |

The API response is a minimal structured object containing a single human-readable status string. It does not return the indexed records, chunk count, embeddings, or per-URL scrape details. Successful completion indicates the flow reached the response node after processing the loop, but it does not by itself expose how many records were inserted or overwritten.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point ingestion flow invoked directly through an `API Request` trigger.
- In broader bundle terms, an operator or orchestrator chooses this flow as the website ingestion path before using the chatbot flow. No prior Lamatic flow must run to supply its trigger inputs.

### Downstream Flows
- `Knowledge Chatbot` flow — consumes the data written by this flow indirectly through the shared vector database. It does not consume the API response field directly; instead, it relies on the indexed vectors and metadata created by this flow.
- Any operational workflow that tracks ingestion status may consume the response field `output` for simple success confirmation.

### External Services
- Firecrawl — scrapes the supplied URLs and returns page content and metadata — requires the selected `credentials` value on `firecrawlNode_785`.
- Embedding model provider — converts chunk text into vector embeddings — requires the selected `embeddingModelName` on `vectorizeNode_314` and any backing provider credentials associated with that model in the workspace.
- Vector database — stores vectors plus metadata for retrieval — requires the selected `vectorDB` on `vectorNode_157`.
- Custom script `scraping-indexation_extract-chunks` — reshapes chunk output for vectorization — no direct credential declared in the flow.
- Custom script `scraping-indexation_transform-metadata` — combines embeddings and page metadata into index-ready records — no direct credential declared in the flow.

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Provider-level secrets may still be required by the selected Firecrawl credential, embedding model integration, or vector database connection, but they are abstracted behind Lamatic-managed private inputs rather than named directly in this flow.

## Node Walkthrough
1. `API Request` (`triggerNode`) starts the flow. It receives a realtime API invocation and exposes the incoming `urls` payload for downstream nodes.

2. `Firecrawl` (`dynamicNode` with `firecrawlNode`) performs a synchronous batch scrape using `{{triggerNode_1.output.urls}}` as the target list. It is configured for `syncBatchScrape`, uses only main content, waits `2000` milliseconds where needed, sets a timeout of `30000` milliseconds, ignores query parameters, and does not crawl subpages or subdomains. The practical result is a list of scraped page records with markdown content and metadata.

3. `Loop` (`forLoopNode`) iterates over `{{firecrawlNode_785.output.data}}`, processing one scraped page at a time. Although loop counters are configured, the main behavior here is list iteration over the Firecrawl results.

4. `Variables` (`dynamicNode` with `variablesNode`) extracts page-level metadata from the current loop item and normalizes three working fields: `title`, `description`, and `source`. These come respectively from `currentValue.metadata.title`, `currentValue.metadata.description`, and `currentValue.metadata.url`.

5. `Chunking` (`dynamicNode` with `chunkNode`) splits the current page’s markdown body from `{{forLoopNode_370.output.currentValue.markdown}}` into chunks. It uses recursive character splitting with `500` characters per chunk, `50` characters of overlap, and separators of paragraph, line, then space boundaries. This prepares the scraped content for embedding.

6. `Extract Chunks` (`dynamicNode` with `codeNode`) runs the script referenced at `@scripts/scraping-indexation_extract-chunks.ts`. In this flow, its purpose is to transform the chunker output into the text array or structure expected by the embedding step.

7. `Vectorize` (`dynamicNode` with `vectorizeNode`) takes `{{codeNode_794.output}}` as `inputText` and generates embeddings using the configured `embeddingModelName`. The result is vector representations aligned to the chunked text for the current page.

8. `Transform Metadata` (`dynamicNode` with `codeNode`) runs `@scripts/scraping-indexation_transform-metadata.ts`. It prepares two coordinated payloads for indexing: `vectors` and `metadata`. This step is where the flow combines chunk text embeddings with the normalized page metadata from earlier steps so the vector database receives retrieval-ready records.

9. `Index` (`dynamicNode` with `vectorNode`) writes the prepared vectors and metadata into the selected vector database. It performs the `index` action, uses `{{codeNode_305.output.vectors}}` and `{{codeNode_305.output.metadata}}`, sets `primaryKeys` to `title`, and applies `duplicateOperation` as `overwrite`. This means records sharing the same primary key value may replace previous entries rather than creating duplicates.

10. `Loop End` (`forLoopEndNode`) closes the per-page iteration and routes control either back to the next item in the Firecrawl result set or onward once all items are processed.

11. `API Response` (`dynamicNode` with `graphqlResponseNode`) returns a fixed response object with `output` set to `Records indexed successfully` after the loop completes.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails at `Firecrawl` before any indexing occurs | Missing, invalid, or unauthorized `credentials` for Firecrawl | Configure a valid Firecrawl credential on `firecrawlNode_785` and verify the target URLs are reachable from that account. |
| Flow starts but no content is indexed | `urls` was missing, malformed, empty, or not mapped as `triggerNode_1.output.urls` | Send `urls` in the trigger payload as an array or comma-separated string and validate the API request shape before invocation. |
| Response indicates success but expected pages are absent from retrieval results | Firecrawl returned empty `data`, page extraction failed, or pages had insufficient main content | Test the target URLs directly in Firecrawl, confirm the pages are publicly accessible, and inspect whether the content is available in the main body of the page. |
| Flow fails during vectorization | `embeddingModelName` was not configured, is unavailable, or provider credentials are missing in the workspace | Select a supported embedding model on `vectorizeNode_314` and ensure the underlying model provider is correctly configured. |
| Flow fails at indexing | `vectorDB` was not selected, the vector store connection is invalid, or the metadata/vector payloads are malformed | Configure a valid vector database on `vectorNode_157`, verify connectivity, and inspect the outputs of `Transform Metadata` for expected `vectors` and `metadata` fields. |
| Indexed records appear to overwrite one another unexpectedly | `primaryKeys` is set to `title`, and multiple pages or chunks share the same title | Change the indexing key strategy to a more unique field such as URL plus chunk identifier if record uniqueness is required. |
| Some URLs in a batch are not processed as expected | The scrape limit is capped, the batch contains invalid URLs, or pages exceed timeout constraints | Reduce the batch size, validate each URL, and adjust flow limits or timeout settings in the flow definition if larger jobs are required. |
| Downstream chatbot cannot answer from newly scraped content | The chatbot flow is querying a different vector index, the current index job failed silently on content quality, or retrieval metadata is not aligned | Ensure both flows point to the same vector database and collection context, then verify that index records were created with the expected metadata. |
| Loop completes but nothing meaningful is embedded | Scraped pages returned empty or near-empty `markdown` fields, causing chunk extraction to produce little or no text | Inspect the raw Firecrawl output for `markdown` content and adjust scraping strategy or source URLs to pages with indexable text. |
| Caller expects detailed ingestion metrics in the API response | The response node is configured to return only a fixed success string | Extend the response mapping if you need counts, per-URL status, or record identifiers for observability. |

## Notes
- This flow uses `syncBatchScrape`, not asynchronous crawl orchestration, so it is best suited to bounded URL lists and moderate scraping jobs.
- The scrape configuration is conservative: `onlyMainContent` is enabled, `crawlSubPages` is disabled, `includeSubdomains` is disabled, and `ignoreQueryParameters` is enabled. These settings favor clean page extraction over exhaustive site traversal.
- Chunking is character-based rather than semantic. For highly structured or very long pages, retrieval quality may improve if chunk sizing, overlap, or separators are tuned.
- The vector index uses `title` as the primary key with overwrite semantics. **This can cause collisions** when multiple pages share the same title, especially across common landing pages like `Home` or `About`.
- The response contract is intentionally minimal. Operational systems that require auditability should add explicit logging or richer response fields for counts, failed URLs, and indexing diagnostics.
- Two custom scripts are central to the final shape of the indexed records. If retrieval quality or metadata fidelity is poor, inspect `scraping-indexation_extract-chunks` and `scraping-indexation_transform-metadata` first.