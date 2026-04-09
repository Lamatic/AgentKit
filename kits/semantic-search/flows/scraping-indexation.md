# Scraping Indexation
A flow that scrapes public web pages from supplied URLs, chunks and vectorizes their content, and stores the resulting embeddings in a vector database as one of the indexation entry points in the broader semantic search system.

## Purpose
This flow is responsible for turning website content into searchable vector records. It accepts one or more URLs, uses Firecrawl to synchronously scrape page content, extracts page-level metadata such as title, description, and source URL, splits the page markdown into retrieval-friendly chunks, generates embeddings for those chunks, and writes both vectors and metadata into a configured vector database.

In the wider system, this solves the web-content ingestion part of the semantic search pipeline. Many organizations need public sites, documentation hubs, landing pages, or knowledge pages represented in the same search index as files, database rows, and cloud content. This flow provides that web-specific ingestion path so scraped pages become part of a unified semantic index.

Within the broader agent architecture, this is an indexation flow, not a retrieval flow. It sits on the ingestion side of the pipeline: source acquisition → normalization → chunking → embedding → indexing. Its output is not end-user search content but a successful indexing operation that prepares data for downstream semantic retrieval flows to query later.

## When To Use
- Use when you need to ingest publicly accessible web pages into the shared semantic search index.
- Use when the source content is best represented by one or more direct page URLs rather than cloud files, database rows, or object storage items.
- Use when you want a fast, synchronous scrape-and-index operation over a bounded set of URLs.
- Use when a developer or operator is bootstrapping a semantic search corpus from a company website, product docs site, marketing pages, or other crawlable web assets.
- Use when the retrieval layer depends on website content already being embedded and present in the vector database.

## When Not To Use
- Do not use when the content source is Google Drive, Google Sheets, OneDrive, SharePoint, S3, Postgres, or another structured connector with its own dedicated indexation flow.
- Do not use when you need live search results directly from the web at query time; this flow builds an index and does not answer search queries itself.
- Do not use when no vector database has been configured or selected for `vectorDB`.
- Do not use when Firecrawl credentials are missing or the target pages require unsupported authentication not covered by the configured crawler credentials.
- Do not use when the input is free text, uploaded files, or database identifiers rather than URLs.
- Do not use when you need broad recursive crawling behavior across a site; this specific flow is configured for `syncBatchScrape` over provided URLs, not a deep site-wide crawl strategy.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` or comma-separated `string` | Yes | One or more URLs to scrape. Passed from the API trigger into the Firecrawl batch scrape step. |

Below the table, this flow also requires private configuration at deploy or run configuration time:

- `credentials` — required Firecrawl credential selection used by the `Firecrawl` node for crawler authentication.
- `vectorDB` — required vector database selection used by the `Index` node as the destination for indexed records.
- `embeddingModelName` — required embedding model selection used by the `Vectorize` node to generate text embeddings.

Notable input constraints and assumptions:

- `urls` is the only trigger-time field explicitly exposed by the API request schema in this flow.
- `urls` may be supplied as an array or as a comma-separated string, but operationally it is expected to resolve into a list of valid URLs consumable by Firecrawl.
- The configured scrape mode is `syncBatchScrape`, so the request should contain a bounded set of pages suitable for synchronous processing.
- Scraping behavior is constrained by the node configuration: `limit` is `10`, `timeout` is `30000` ms, `waitFor` is `2000` ms, `onlyMainContent` is enabled, and query parameters are ignored.
- Pages should be publicly reachable and return content that Firecrawl can extract into markdown and metadata.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | Fixed success message: `Records indexed successfully`. |

The API response is a simple structured object containing a single status-like string field. It does not return per-URL indexing details, scraped content, chunk counts, or inserted record identifiers. Successful completion means the looped scrape, vectorization, and indexing steps finished without surfacing an error, but it does not provide a completeness report for each individual page.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow invoked directly through an API request handled by `API Request`.
- In the broader agent system, operators typically run this flow before any semantic retrieval flow that expects website content to already exist in the vector index.

### Downstream Flows
- The bundle’s semantic retrieval flow consumes the indexed data produced by this flow indirectly through the shared vector database.
- That downstream retrieval flow depends on the embeddings and metadata written by `Index`, not on this flow’s API response field `output`.
- Specifically, downstream search relies on the vector records derived from page chunks and their associated metadata such as `title`, `description`, and `source`.

### External Services
- Firecrawl — scrapes the supplied web pages and returns markdown plus page metadata — required `credentials` selection on the `Firecrawl` node.
- Embedding model provider — converts text chunks into vector embeddings — required `embeddingModelName` selection on the `Vectorize` node.
- Vector database — stores vectors and metadata for later semantic retrieval — required `vectorDB` selection on the `Index` node.

### Environment Variables
- No environment variables are explicitly referenced in the flow source.
- Credentialed services are supplied through Lamatic private inputs rather than named environment variables in this flow.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the incoming API call in realtime mode. For this flow, its meaningful trigger payload is `urls`, which becomes available to downstream nodes as `triggerNode_1.output.urls`.

2. `Firecrawl` (`dynamicNode` using `firecrawlNode`) performs a synchronous batch scrape using the incoming `urls`. It is configured with `syncBatchScrape`, `onlyMainContent: true`, `limit: 10`, `timeout: 30000`, `waitFor: 2000`, and `ignoreQueryParameters: true`. The node returns a `data` collection of scraped page results, each expected to include markdown content and metadata such as title, description, and URL.

3. `Loop` (`forLoopNode`) iterates over `firecrawlNode_785.output.data`, processing one scraped page at a time. Although the loop has numeric fields like `initialValue`, `increment`, and `endValue`, it is explicitly configured to iterate over a `list`, so the operative input is the scraped result list.

4. `Variables` (`dynamicNode` using `variablesNode`) extracts and normalizes page-level metadata from the current loop item. It maps `title` from `currentValue.metadata.title`, `description` from `currentValue.metadata.description`, and `source` from `currentValue.metadata.url`. This creates a consistent metadata shape for later indexing.

5. `Chunking` (`dynamicNode` using `chunkNode`) splits the current page’s markdown, taken from `forLoopNode_370.output.currentValue.markdown`, into smaller text chunks. It uses a recursive character splitter with `500` characters per chunk, `50` characters of overlap, and separators of paragraph breaks, line breaks, and spaces. This prepares the text for embedding and improves retrieval granularity.

6. `Extract Chunks` (`dynamicNode` using `codeNode`) runs the referenced script `@scripts/scraping-indexation_extract-chunks.ts`. Its role is to reshape the chunking output into the exact text list or structure expected by the embedding step. This is a source-specific transformation layer between chunking and vectorization.

7. `Vectorize` (`dynamicNode` using `vectorizeNode`) generates embeddings from the output of `Extract Chunks` using the configured `embeddingModelName`. The node receives the prepared chunk text as `inputText` and returns vector representations for those chunked page segments.

8. `Transform Metadata` (`dynamicNode` using `codeNode`) runs the referenced script `@scripts/scraping-indexation_transform-metadata.ts`. This script combines the generated vectors with the normalized metadata so they match the schema expected by the vector indexing step. Its outputs are exposed as `vectors` and `metadata`.

9. `Index` (`dynamicNode` using `vectorNode`) writes the transformed vectors and metadata into the selected vector database. It performs the `index` action, uses `codeNode_305.output.vectors` as `vectorsField`, uses `codeNode_305.output.metadata` as `metadataField`, treats `title` as the primary key, and applies `duplicateOperation: overwrite`. This means later records with the same primary key value can replace earlier ones.

10. `Loop End` (`forLoopEndNode`) closes the per-page processing cycle and routes control back to `Loop` until all scraped items have been processed. Once iteration is complete, execution continues to the response node.

11. `API Response` (`dynamicNode` using `graphqlResponseNode`) returns a fixed response object with `output` set to `Records indexed successfully`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails before scraping starts | `credentials` for Firecrawl were not configured or are invalid | Select valid Firecrawl credentials in the flow inputs and verify the credential has permission to call the scraping API. |
| Flow fails at indexing step | `vectorDB` was not selected or the destination index is unavailable | Configure a valid vector database connection and confirm the target collection or index is reachable. |
| Flow fails at vectorization step | `embeddingModelName` was not configured or the model is inaccessible | Select a supported embedding model and verify the workspace has access to the underlying model provider. |
| Scrape returns no pages or an empty loop | `urls` is empty, malformed, unreachable, or blocked | Pass valid publicly accessible URLs, ensure proper formatting, and verify the target pages can be fetched by Firecrawl. |
| Response says indexing succeeded but expected pages are missing in search | Some URLs may have produced empty markdown, duplicate keys may have overwritten prior records, or downstream retrieval is pointing at a different vector store | Check Firecrawl results for extracted content, review the `title` primary key strategy for collisions, and verify retrieval uses the same vector database and namespace. |
| Multiple pages overwrite each other | `title` is used as the primary key and different pages share the same title | Change the primary key strategy if possible, or ensure metadata includes a more unique identifier such as source URL in the indexed key schema. |
| Individual pages time out during scraping | Target pages are slow, render-heavy, or unavailable within the configured `timeout` | Reduce the URL set per request, retry later, or adjust scraping strategy in the flow configuration if synchronous limits are too strict. |
| Flow is routed here for non-URL content | Upstream orchestration selected the wrong indexation flow | Route structured data, files, or cloud content to the corresponding source-specific indexation flow instead of this web scraping flow. |
| Downstream semantic search returns nothing after this flow ran | The retrieval flow has not been configured against the same vector database, or indexing produced no usable vectors | Verify index destination alignment, confirm vectors were inserted, and ensure the retrieval flow is querying the same collection or namespace. |
| Script-driven transformation fails | The referenced chunk extraction or metadata transformation script returned an unexpected shape | Validate the script resources `scraping-indexation_extract-chunks` and `scraping-indexation_transform-metadata` against the actual scrape and vectorize outputs. |

## Notes
- This flow is configured for direct URL scraping with `syncBatchScrape`, not full recursive crawling. If you need broader site traversal, use the crawl-oriented sibling flow instead of this one.
- The scrape configuration favors content cleanliness over page fidelity: `onlyMainContent` is enabled, subdomains are excluded, sitemap usage is disabled, and query parameters are ignored.
- The final API response is intentionally minimal. Operators who need observability into per-page failures, chunk counts, or indexed record IDs will need to extend the response mapping or inspect node-level execution logs.
- Using `title` as the only primary key can cause collisions across pages with similar or repeated titles. For production-scale indexing, a source-derived unique key is usually safer.
- Because indexing happens inside a loop, throughput scales with the number of scraped pages and the number of chunks each page generates. Large batches may be better handled by splitting requests into smaller URL sets.