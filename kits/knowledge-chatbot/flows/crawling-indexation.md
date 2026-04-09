# Crawling Indexation
A flow that crawls one or more public web URLs, converts discovered page content into embeddings, and indexes that content into a vector database as part of the wider RAG knowledge-ingestion pipeline.

## Purpose
This flow is responsible for turning web content into retrievable knowledge. It accepts one or more seed URLs, uses Firecrawl to fetch page content, extracts the main markdown body from each crawled page, splits that content into chunks, generates embeddings for those chunks, and writes both vectors and metadata into a configured vector database. Its job is not to answer questions directly, but to prepare web content so later retrieval flows can use it.

In the broader system, this flow solves the web-ingestion portion of knowledge preparation. The overall RAG kit supports multiple indexation paths for different source types such as cloud files, databases, and websites. This specific flow covers public web documentation, knowledge bases, and other crawlable content. The outcome is an indexed corpus of web-derived chunks with associated metadata such as title, description, and source URL. That outcome matters because the downstream chatbot can only retrieve and ground its answers in content that has already been embedded and stored.

Within the larger retrieve-and-synthesize chain described by the parent agent, this flow sits firmly in the ingestion stage. It is an entry-point flow used during setup or refresh of the knowledge base. Once it completes successfully, the indexed data becomes available to retrieval-driven flows such as the `Knowledge Chatbot`, which then perform semantic search over the stored vectors and synthesize answers for end users.

## When To Use
- Use when you need to ingest content from public websites, documentation portals, or help centers into the shared vector index.
- Use when the source of truth is a set of URLs rather than files, spreadsheets, object storage, or database rows.
- Use when you are setting up or refreshing the knowledge base for a RAG chatbot that must answer from web-hosted content.
- Use when you want Firecrawl to fetch page content and preserve page-level metadata such as `title`, `description`, and canonical source URL.
- Use when the downstream retrieval flow depends on semantically searchable embeddings derived from website pages.
- Use when you have already chosen and configured a target vector database and embedding model for indexation.

## When Not To Use
- Do not use when the source content lives in Google Drive, OneDrive, SharePoint, S3, Postgres, or Sheets; use the sibling indexation flow built for that source instead.
- Do not use when you need to answer a user question directly; this flow prepares data for retrieval but does not perform chat, search response composition, or final answer generation.
- Do not use when no vector database has been configured, because the flow’s final indexing step requires a selected `vectorDB` connection.
- Do not use when Firecrawl credentials are unavailable or invalid, because the crawl step cannot run without them.
- Do not use when the input is not a URL list or when the supplied URLs are malformed, inaccessible, or outside the intended crawl scope.
- Do not use when you need highly customized crawl behavior beyond this flow’s built-in settings, such as broad subdomain crawling or external-link traversal, without modifying the flow.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` | Yes | One or more seed URLs to crawl and index. These are supplied at the trigger and passed into Firecrawl. |

Below the trigger level, the flow also requires the following private configuration inputs to run successfully:

| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Firecrawl credential selection used by the `Firecrawl` node for crawler authentication and API access. |
| `embeddingModelName` | `model` | Yes | Embedding model used by the `Vectorize` node to convert text chunks into vector representations. |
| `vectorDB` | `select` | Yes | Target vector database selected by the `Index` node for storing vectors and metadata. |

The trigger expects a list of URL strings. The flow metadata shows a sample payload with `urls: ["https://lamatic.ai/docs"]`. The implementation also maps `triggerNode_1.output.url` into the crawl node, but the primary expected shape is a `urls` array. URLs should be crawlable over the network and should point to content that Firecrawl can fetch within the configured timeout and crawl limits.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | A fixed success message: `Records indexed successfully`. |

The API response is a simple structured object containing a single human-readable status string. It does not return the crawled pages, chunk list, embedding payload, or index record identifiers. A successful response indicates that the flow completed its indexing path without surfacing an execution error, not that every possible page under the input URLs was exhaustively crawled.

## Dependencies
### Upstream Flows
- None. This is an entry-point ingestion flow invoked directly via `API Request`.
- In the broader RAG kit, operators typically run this flow during knowledge-base setup or refresh before any retrieval or chatbot flow is expected to use the indexed website content.

### Downstream Flows
- `Knowledge Chatbot` consumes the data this flow writes to the shared vector database, though not through this flow’s API response.
- The practical downstream dependency is the indexed vector corpus created by the `Index` node. Retrieval-oriented flows query that vector store using the embeddings and metadata produced here.
- No downstream flow depends on the response field `output`; that field is only a completion acknowledgement for the caller.

### External Services
- Firecrawl — crawls and fetches web page content from the supplied URLs — requires selected `credentials` in the `Firecrawl` node.
- Embedding model provider — generates vector embeddings for chunked page text — requires selected `embeddingModelName` in the `Vectorize` node.
- Vector database — stores embeddings and metadata for later semantic retrieval — requires selected `vectorDB` in the `Index` node.

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Any provider-specific secrets are abstracted behind Lamatic private inputs such as `credentials`, `embeddingModelName`, and `vectorDB` rather than referenced as named environment variables in this flow.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the invocation payload. In practice this flow expects one or more seed URLs at `urls`, and the trigger exposes those values for downstream node interpolation.

2. `Firecrawl` (`dynamicNode`) starts a synchronous crawl using the incoming URL data. It is configured to read `{{triggerNode_1.output.urls}}`, fetch main content only, ignore query parameters, avoid subdomain and external-link expansion, and operate within limits such as `crawlDepth` `5`, `crawlLimit` `10`, and request timeout `30000` milliseconds. Its output is a list of crawled page objects under `data`.

3. `Loop` (`forLoopNode`) iterates over `{{firecrawlNode_785.output.data}}`, processing one crawled page at a time. The loop is list-driven, so each pass exposes the current page object as `currentValue` for the downstream steps.

4. `Variables` (`dynamicNode`) extracts page-level metadata from the current crawled item and normalizes it into three fields: `title`, `description`, and `source`. These are taken from `currentValue.metadata.title`, `currentValue.metadata.description`, and `currentValue.metadata.url` respectively, creating a clean metadata object for later indexing.

5. `Chunking` (`dynamicNode`) splits the current page’s markdown body from `{{forLoopNode_370.output.currentValue.markdown}}` into smaller text segments. It uses recursive character splitting with a target chunk size of `500` characters, `50` characters of overlap, and separators of paragraph break, newline, and space. This prepares the page content for embedding and retrieval.

6. `Extract Chunks` (`dynamicNode`) runs the referenced script `@scripts/crawling-indexation_extract-chunks.ts`. Based on its placement and the next node’s wiring, this script converts the chunking node output into the text array or text payload expected by the embedding step.

7. `Vectorize` (`dynamicNode`) sends the extracted chunk text from `{{codeNode_794.output}}` to the selected embedding model. The node produces vector representations for the current page’s chunks.

8. `Transform Metadata` (`dynamicNode`) runs the referenced script `@scripts/crawling-indexation_transform-metadata.ts`. This step combines the page metadata prepared earlier with the vectors produced by `Vectorize`, shaping them into the `vectors` and `metadata` structures expected by the vector index operation.

9. `Index` (`dynamicNode`) writes the transformed vectors and metadata into the selected vector database. It performs the `index` action, reads vectors from `{{codeNode_305.output.vectors}}` and metadata from `{{codeNode_305.output.metadata}}`, uses `title` as the configured primary key, and applies `overwrite` behavior when duplicates are encountered.

10. `Loop End` (`forLoopEndNode`) closes the per-page processing cycle and feeds control back to the `Loop` node until all crawled items have been processed. Once iteration is complete, execution exits the loop and continues to the response stage.

11. `API Response` (`dynamicNode`) returns a fixed response object mapping `output` to `Records indexed successfully`, signaling successful completion to the caller.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails at `Firecrawl` before any pages are processed | Missing, expired, or incorrect Firecrawl `credentials` | Reconfigure the private `credentials` input with a valid Firecrawl account or API key and retest the crawl step. |
| Flow completes but nothing useful is indexed | The input `urls` array is empty, malformed, or points to pages Firecrawl cannot access | Validate that `urls` contains well-formed, reachable HTTP or HTTPS URLs and that the target site permits crawling. |
| Flow returns success but expected pages are missing from the index | Crawl settings restrict discovery, such as `crawlSubPages: false`, no subdomains, no external links, and finite crawl depth and limit | Provide the specific pages as seed URLs or modify the flow’s crawl settings if broader discovery is required. |
| Flow fails during vectorization | `embeddingModelName` was not configured, is unavailable, or the provider/model quota was exceeded | Select a valid embedding model, verify provider access, and check quota or rate-limit status. |
| Flow fails during indexing | `vectorDB` is not configured, the target index is unavailable, or the vector/metadata shape is incompatible with the selected store | Reconfigure the vector database connection, verify the destination index exists and is reachable, and confirm the metadata schema expected by the store. |
| Duplicate pages overwrite prior records unexpectedly | The `Index` node uses `title` as a primary key with `duplicateOperation` set to `overwrite` | Use a more stable unique identifier such as source URL in a customized version of the flow if page titles are not unique. |
| Some pages produce poor retrieval quality later | Source markdown is noisy, chunk boundaries are suboptimal, or important page structure was lost during extraction | Review the chunking configuration and the two transformation scripts, then adjust chunk size, overlap, or metadata shaping as needed. |
| The flow cannot be chained into the chatbot as expected | The downstream retrieval flow depends on the vector store contents, but this flow has not been run successfully yet | Run this flow first, confirm records exist in the vector database, then invoke the retrieval/chat flow against the same store. |
| The caller expects detailed indexing results in the API response | The flow is designed to return only a fixed success string, not per-record diagnostics | Inspect Lamatic run logs, node outputs, or the target vector database directly if you need page-level indexing verification. |

## Notes
- This flow is intentionally optimized for ingestion, not reporting. Operational validation should be done through execution logs and the target vector database rather than the response payload.
- Firecrawl runs in `sync` mode here, which is convenient for direct API invocation but may be less suitable for very large crawls.
- The crawler is configured with `onlyMainContent` enabled, which generally improves retrieval quality by reducing navigational noise, but it may omit useful sidebar or auxiliary content on some sites.
- Query parameters are ignored during crawling. This reduces duplicate indexing for parameterized URLs, but it can also collapse distinct pages if the site uses query strings to serve meaningful content.
- Because `title` is used as the primary key, pages sharing the same title can overwrite each other. For documentation sites with repeated page titles like `Introduction` or `Overview`, consider changing the key strategy.
- The two referenced scripts are central to the exact shape of chunk extraction and metadata transformation. Any customization of chunk payloads, record IDs, or metadata enrichment will likely happen there rather than in the visible node wiring.