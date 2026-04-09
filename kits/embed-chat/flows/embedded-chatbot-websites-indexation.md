# 1B. Embedded Chatbot - Websites Indexation
This flow crawls website URLs, converts their page content into vector embeddings, and stores them in the shared vector index that powers the wider Embedded Chat retrieval pipeline.

## Purpose
This flow is responsible for ingesting website content into the Embedded Chat knowledge base. Given one or more URLs, it scrapes page content through Firecrawl, iterates over each returned page, extracts the relevant metadata and markdown body, splits the content into retrieval-sized chunks, generates embeddings for those chunks, and writes the resulting vectors plus metadata into the configured vector database. Its core job is to turn raw web pages into searchable retrieval units.

The outcome is an indexed website corpus that can be queried later by the chat flow. That matters because the overall system depends on high-quality, chunked, embedded source material before it can answer user questions grounded in website content. Without this ingestion step, the downstream chat experience has no website knowledge to retrieve from, and operators cannot make public or owned web documentation available to the assistant.

In the broader agent pipeline, this flow sits in the ingestion and indexing stage of the document lifecycle described by the parent agent: ingest, answer, maintain. It is a sibling to the PDF indexation flow, but specialized for website URLs instead of uploaded documents. Its output is not an end-user answer; it prepares data for the retrieval layer that the chatbot flow uses later during question answering.

## When To Use
- Use when an operator wants to add one or more website pages to the Embedded Chat knowledge base.
- Use when the source material is accessible by URL and should become searchable by the chatbot.
- Use when onboarding product docs, help center content, marketing pages, or other web-hosted text into the vector store.
- Use when refreshing or expanding the website portion of the corpus before running chatbot queries against it.
- Use when a backend or UI has collected a list of URLs and needs them processed into embeddings.

## When Not To Use
- Do not use when the source content is a PDF or uploaded file; use the PDF indexation flow instead.
- Do not use when the intent is to answer a user question immediately; the chatbot flow is the correct runtime path for retrieval and response generation.
- Do not use when content must be removed from the system; the resource deletion flow handles deletion and cleanup.
- Do not use when no vector database has been configured or no embedding model is available.
- Do not use when the provided input is not a valid URL list or is inaccessible to the crawler.
- Do not use when you need deep site crawling across large websites beyond the configured scrape behavior; this flow is configured for batch URL scraping rather than broad recursive discovery.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` or `string` | Yes | Website URLs to scrape and index. The configuration allows either an array of URLs or a comma-separated string of URLs. |

Below the trigger-level input, the flow also depends on internal required configuration fields that must be set at deployment time:

- `credentials` — crawler authentication credentials used by the `Firecrawl` node.
- `embeddingModelName` — embedding model selected for the `Vectorize` node.
- `vectorDB` — target vector database selected for the `Index` node.

Input constraints and assumptions:

- `urls` must resolve to crawlable web pages that the Firecrawl connector can access.
- The flow is tested with an array input such as `[
  "https://lamatic.ai/docs"
]`.
- In this configuration, the crawler runs in `syncBatchScrape` mode.
- The crawler is configured to prefer `onlyMainContent`, ignore query parameters, avoid subdomain expansion, and avoid recursive subpage crawling.
- If multiple URLs are supplied, the crawler may return multiple page records, each of which is processed independently in the loop.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | Static success message returned by the API response node after loop completion: `Records indexed successfully`. |

The API response is a small structured object containing a single success string. It does not return per-page indexing details, chunk counts, vector IDs, or partial failure diagnostics. Completion of the response indicates the flow reached its response node, but operational systems should not assume detailed observability from the payload alone.

## Dependencies
### Upstream Flows
- None. This is an entry-point ingestion flow invoked directly through its API trigger.
- Operationally, it assumes the broader Embedded Chat kit has already been deployed and configured with a crawler credential, embedding model, and vector database.

### Downstream Flows
- `Embedded Chatbot - Chatbot` consumes the vectors written by this flow from the shared vector database during retrieval. It depends on the indexed chunk content and metadata produced indirectly by this flow, not on the API response field.
- `Embedded Chatbot - Resource Deletion` may later target records that were created from website ingestion, depending on how resource lifecycle management is implemented in the kit.

### External Services
- Firecrawl — scrapes the supplied URLs and returns structured page content and metadata — required credential selected via the `credentials` field in `Firecrawl`.
- Embedding model provider — converts text chunks into vector embeddings — required model selection via `embeddingModelName` in `Vectorize`.
- Vector database — stores vectors and associated metadata for later retrieval — required database connection via `vectorDB` in `Index`.
- Lamatic flow runtime / GraphQL-triggered API execution — hosts the trigger and response lifecycle for flow invocation — uses project-level Lamatic deployment configuration.

### Environment Variables
- `EMBEDDED_CHATBOT_WEBSITES_INDEXATION` — flow identifier used by external applications to invoke this flow — used outside the flow by the embedding chat application and orchestration layer.
- `LAMATIC_API_URL` — Lamatic API base URL used by the calling application to trigger deployed flows — used outside this flow at invocation time.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for API access and flow execution — used outside this flow at invocation time.
- `LAMATIC_API_KEY` — authentication key for invoking Lamatic flows — used outside this flow at invocation time.

## Node Walkthrough
1. `API Request` (`graphqlNode` trigger) receives the inbound API call that starts the flow. The practical trigger payload is the `urls` field, supplied by the caller as either a URL array or a comma-separated string.

2. `Firecrawl` (`firecrawlNode`) performs a synchronous batch scrape over the provided `urls`. In this flow it is configured for `syncBatchScrape`, with `onlyMainContent` enabled, query parameters ignored, timeout and wait settings applied, and no recursive subpage crawl. Its output is a list of scraped page records in `firecrawlNode_785.output.data`.

3. `Loop` (`forLoopNode`) iterates over the list of page records returned by `Firecrawl`. Each iteration exposes one page as `currentValue`, allowing the rest of the pipeline to process one scraped page at a time.

4. `Variables` (`variablesNode`) extracts selected metadata from the current scraped page into normalized variables: `title` from `currentValue.metadata.title`, `description` from `currentValue.metadata.description`, and `source` from `currentValue.metadata.url`. These values are carried forward for metadata assembly later in the flow.

5. `Chunking` (`chunkNode`) takes the current page’s markdown content from `currentValue.markdown` and splits it into smaller pieces. It uses recursive character splitting with a target chunk size of `500` characters, `50` characters of overlap, and separators of paragraph break, newline, then space. This prepares the text for embedding and retrieval.

6. `Extract Chunks` (`codeNode`) runs the referenced script `embedded-chatbot-websites-indexation_extract-chunks.ts`. Based on its placement and downstream bindings, this script reshapes the chunking output into the text list expected by the embedding stage.

7. `Vectorize` (`vectorizeNode`) sends the extracted chunk text to the selected embedding model using `codeNode_794.output` as `inputText`. It generates vector embeddings for the chunk set associated with the current page.

8. `Transform Metadata` (`codeNode`) runs the referenced script `embedded-chatbot-websites-indexation_transform-metadata.ts`. This script combines the embeddings from `Vectorize` with the page-level metadata prepared earlier, producing two coordinated outputs: `vectors` for indexing and `metadata` for storage alongside those vectors.

9. `Index` (`vectorNode`) writes the transformed vectors and metadata into the configured vector database. It runs with action `index`, uses `codeNode_305.output.vectors` and `codeNode_305.output.metadata`, treats `title` as the configured primary key, and applies `overwrite` behavior when duplicates are encountered.

10. `Loop End` (`forLoopEndNode`) closes the current iteration and returns control to `Loop` until all scraped pages have been processed.

11. `API Response` (`graphqlResponseNode`) returns a fixed success payload with `output` set to `Records indexed successfully` once the loop has completed.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails at `Firecrawl` before any pages are processed | Missing or invalid crawler `credentials` | Reconfigure the `Firecrawl` node with valid credentials and confirm the connector has permission to access the target URLs. |
| Flow completes but no useful content is indexed | `urls` were malformed, inaccessible, blocked, or returned little/no main content | Validate the URLs, test them manually, confirm they are publicly reachable, and check whether the site structure is compatible with `onlyMainContent` extraction. |
| Flow errors at `Vectorize` | No `embeddingModelName` selected, model access is unavailable, or model/provider limits were hit | Select a valid embedding model, verify provider access, and retry with smaller batches if provider limits are involved. |
| Flow errors at `Index` | No `vectorDB` configured, database connection failed, or schema/index expectations do not match the payload | Configure a valid vector database, verify the connection, and ensure the target store accepts the vectors and metadata shape produced by the transform script. |
| Flow returns success but chatbot cannot answer from the website content | Indexing wrote incomplete records, retrieval is pointed at a different store, or the chat flow has not been configured against the same vector database | Confirm this flow and the chatbot flow share the same vector database and namespace setup, then inspect indexed records for expected chunk text and metadata. |
| Some pages are overwritten unexpectedly | `Index` uses `title` as the primary key and duplicate handling is set to `overwrite` | Use a more stable unique identifier in metadata if titles can repeat, or adjust duplicate handling strategy in the vector indexing configuration. |
| Pages with query-string variants collapse into one scrape result or are skipped | `ignoreQueryParameters` is enabled in the crawler configuration | Disable that behavior if query parameters are meaningful for the target content, or supply canonical URLs that uniquely identify the intended pages. |
| Large site ingestion is incomplete | The flow is not configured for broad recursive crawling; `crawlSubPages` is disabled and scrape limits are modest | Supply an explicit URL list for all required pages, or redesign the flow for crawl-oriented ingestion with higher limits and recursive settings. |
| Upstream application cannot invoke the flow | The application has not been configured with the deployed flow ID or Lamatic API credentials | Set `EMBEDDED_CHATBOT_WEBSITES_INDEXATION`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` correctly in the calling environment. |

## Notes
- This flow is intentionally ingestion-only. It prepares website content for retrieval but does not register conversational state, perform search, or generate answers.
- The success response is coarse-grained. If operators need per-URL indexing status, chunk counts, or vector IDs, the flow would need enhanced response mapping or external logging.
- Because duplicate handling is set to `overwrite` and the primary key is `title`, pages with identical titles may collide even if their URLs differ.
- Retrieval quality depends heavily on the two referenced scripts. The chunk extraction script determines what text is embedded, and the metadata transform script determines what context is preserved in the vector store.
- Chunk size and overlap are fixed in this configuration at `500` and `50`. These settings are reasonable defaults for many documentation pages, but they may need tuning for dense technical content or very short pages.