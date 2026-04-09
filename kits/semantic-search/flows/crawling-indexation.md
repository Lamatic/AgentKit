# Crawling Indexation
A flow that crawls public web pages, chunks and vectorizes their content, and writes the resulting records into a vector database as one of the indexation entry points in the broader semantic search system.

## Purpose
This flow is responsible for turning website content into searchable vector records. It accepts one or more seed URLs through an API request, invokes a web crawler to fetch page content, then processes each crawled page independently into retrieval-friendly chunks. Those chunks are embedded and indexed with page-level metadata so that downstream search can retrieve relevant passages semantically rather than relying on exact keyword matching.

The outcome of the flow is an updated vector index containing chunk embeddings and metadata derived from crawled pages. This matters because the wider semantic search kit depends on a populated vector store before any retrieval flow can answer user questions over documentation or site content. Without this ingestion step, the semantic search layer has nothing to search.

Within the larger bundle, this is an indexation flow rather than a retrieval or synthesis flow. It sits in the ingestion stage of the pipeline: source acquisition via crawling, normalization into text chunks, embedding generation, and persistence into the shared vector database. Other sibling indexation flows perform the same broad role for different source types such as drives, databases, or object storage, while the retrieval flow consumes the indexed data later.

## When To Use
- Use when the content to index lives on publicly reachable web pages or documentation sites.
- Use when you want to build or refresh a semantic index from one or more website URLs.
- Use when a developer or operator needs to ingest documentation, help center pages, marketing pages, or other crawlable HTML content into the shared search corpus.
- Use when the source material is best discovered by following links from seed URLs rather than uploading files or querying a database directly.
- Use when the semantic retrieval flow is expected to answer questions over website content and the vector database has not yet been populated from that site.

## When Not To Use
- Do not use when the source content is stored in systems with dedicated sibling indexation flows, such as Google Drive, SharePoint, OneDrive, S3, Postgres, or spreadsheet sources.
- Do not use when the input is raw file content, database rows, or manually supplied text rather than URLs.
- Do not use when no crawler credentials have been configured for the `Firecrawl` node.
- Do not use when the target vector database or embedding model has not been configured.
- Do not use when you need live answer generation or semantic retrieval from an already indexed corpus; in that case, the bundle's retrieval/search flow is the correct choice.
- Do not use when the site is private or inaccessible to the configured crawler credentials and network path.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` | Yes | A list of seed URLs to crawl and index. The flow test input shows this as the primary trigger payload. |
| `url` | `string` | No | A single URL field is referenced by the crawler node and may be accepted by the trigger in some invocations, though the configured test input uses `urls`. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The flow assumes each URL is a valid, fully qualified web URL that the crawler can access. The trigger schema is not explicitly enforced in the source, so callers should send `urls` as an array of strings to match the configured crawler input. Crawling behavior is internally constrained by node settings: the crawler runs synchronously, uses a timeout of `30000` ms, waits `2000` ms for page rendering, limits crawl results to `10` items, and is configured with `crawlDepth` `5`, `crawlLimit` `10`, `onlyMainContent` enabled, `ignoreQueryParameters` enabled, and both `includeSubdomains` and `allowExternalLinks` disabled.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | A fixed success message: `Records indexed successfully`. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

The API response is a small structured object containing a single string field. It does not return the indexed records, crawl report, chunk count, or vector IDs. A successful response indicates that the flow reached the response node, but it does not expose per-page indexing details to the caller. If the crawler returns no pages, the response behavior depends on whether upstream nodes fail or simply complete with empty iteration; the response shape itself remains minimal.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow invoked directly through an API request handled by `API Request`.
- No other Lamatic flow must run before it.
- Operationally, it does depend on prior configuration rather than prior execution: a vector database must be selected for `Index`, crawler credentials must be selected for `Firecrawl`, and an embedding model must be selected for `Vectorize`.

### Downstream Flows
- The bundle's semantic retrieval/search flow depends indirectly on this flow having populated the shared vector database.
- That downstream retrieval flow does not consume this flow's API response field `output`; instead, it relies on the persisted vectors and metadata written by `Index`.
- Any orchestration that chains this flow with retrieval should treat successful completion as a signal that the target index is ready or has been refreshed, subject to the vector database's write visibility and consistency behavior.

### External Services
- Firecrawl — crawls the supplied URLs and returns page content plus metadata — requires the private credential selected in `firecrawlNode_785`.
- Embedding model provider — converts chunk text into vector embeddings — requires the private model selection `embeddingModelName` used by `vectorizeNode_314` and any provider-specific credentials configured in the Lamatic workspace.
- Vector database — stores vectors and metadata generated by the flow — requires the private vector DB selection `vectorDB` used by `vectorNode_157`.

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Provider-specific secrets may still be required by the selected crawler, embedding model, or vector database connection, but those are configured as Lamatic private inputs rather than named environment variables in this flow definition.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the invocation. It serves as the entry point for the flow and is configured for a realtime API-style response pattern. In practice, callers provide crawl seeds here, typically through the `urls` field.
2. `Firecrawl` (`dynamicNode`) takes the incoming `urls` from `triggerNode_1.output.urls` and also references a possible single `url` value from `triggerNode_1.output.url`. It performs a synchronous crawl with a maximum of `10` results, `crawlDepth` `5`, `crawlLimit` `10`, `onlyMainContent` enabled, query parameters ignored, and no external-link or subdomain expansion. Its output is a list of crawled page objects in `output.data`.
3. `Loop` (`forLoopNode`) iterates over `firecrawlNode_785.output.data`, processing each crawled page independently. Although the node is configured with an `endValue` of `10`, the meaningful behavior here is list iteration over the crawler results.
4. `Variables` (`dynamicNode`) extracts normalized page-level metadata from the current crawled item. It maps `title` from `currentValue.metadata.title`, `description` from `currentValue.metadata.description`, and `source` from `currentValue.metadata.url`. These variables are prepared for downstream metadata assembly.
5. `Chunking` (`dynamicNode`) splits the current page's markdown content from `forLoopNode_370.output.currentValue.markdown` into recursive character-based chunks. It uses a chunk size of `500` characters with `50` characters of overlap and separators of paragraph break, line break, and space. This creates chunk boundaries suitable for embedding and retrieval.
6. `Extract Chunks` (`dynamicNode`) runs the referenced script `@scripts/crawling-indexation_extract-chunks.ts`. Its role is to transform the raw chunking output into the exact text array or structure expected by the embedding node. This is the handoff from chunk objects to embed-ready payload.
7. `Vectorize` (`dynamicNode`) submits the extracted chunk text from `codeNode_794.output` to the selected embedding model. The node generates embeddings for each chunk using the configured `embeddingModelName`.
8. `Transform Metadata` (`dynamicNode`) runs the referenced script `@scripts/crawling-indexation_transform-metadata.ts`. It combines the embeddings from `Vectorize` with the page-level variables prepared earlier so the next node receives both `vectors` and aligned `metadata` collections.
9. `Index` (`dynamicNode`) writes the transformed vectors and metadata into the selected vector database. It performs the `index` action, uses `codeNode_305.output.vectors` as the vector payload and `codeNode_305.output.metadata` as the metadata payload, sets `primaryKeys` to `title`, applies `duplicateOperation` `overwrite`, and limits the operation to `20` records per call.
10. `Loop End` (`forLoopEndNode`) closes the per-page processing cycle and routes execution back to `Loop` until all crawled items have been processed.
11. `API Response` (`dynamicNode`) returns the fixed response object `{ output: "Records indexed successfully" }` once loop processing has completed.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow fails before crawling starts | No credential selected for `Firecrawl` or the credential is invalid | Configure a valid crawler credential in `firecrawlNode_785` and verify it can access the target URLs |
| The flow fails during embedding | No embedding model selected or the model provider is unavailable | Select a valid `embeddingModelName` for `Vectorize` and confirm provider access and quota |
| The flow fails during indexing | No vector database selected, the target index is unavailable, or write permissions are missing | Configure `vectorDB` for `Index`, verify connectivity, and confirm the destination accepts index writes |
| The response says success but expected pages are missing from search | The crawler returned fewer pages than expected, crawl limits were too low, or pages were excluded by configuration | Increase crawl scope if needed, verify site structure, and review crawler settings such as `crawlDepth`, `crawlLimit`, and subdomain/external-link restrictions |
| No records are indexed | `urls` was missing, malformed, empty, or inaccessible | Send a non-empty `urls` array of valid absolute URLs and test each seed URL independently |
| Some indexed records overwrite others unexpectedly | `Index` uses `title` as the sole `primaryKeys` field and duplicate handling is set to `overwrite` | Use titles that are unique across crawled pages or modify the indexing strategy to use a more stable unique key such as URL |
| Content quality in search is poor | Page chunking or extracted text did not preserve useful context | Review the chunk extraction and metadata transform scripts and consider adjusting chunk size, overlap, or content cleaning |
| The flow returns little or no content for a JavaScript-heavy site | The crawler's render timing is insufficient or the site blocks crawling | Increase rendering wait where possible, confirm crawler compatibility, and verify the site permits automated access |
| A downstream retrieval flow finds nothing | This flow has not run successfully yet, wrote to a different vector database, or indexed different metadata than expected | Run this flow to completion, confirm the retrieval flow points to the same vector store, and validate that the index contains records |

## Notes
- The trigger node does not declare a strict schema, but the tested and intended request shape is an object containing `urls` as a list of seed URLs.
- Although `Firecrawl` references both `url` and `urls`, the flow metadata only provides a test case for `urls`. For predictable behavior, prefer `urls`.
- The crawler is intentionally conservative: it does not include subdomains, does not follow external links, ignores query parameters, and focuses on main content only. This is useful for indexing documentation cleanly but may omit pages some operators expect.
- The response is intentionally terse. If you need observability such as indexed page counts, failed URLs, chunk totals, or vector IDs, the flow would need to be extended to surface those details.
- The `Extract Chunks` and `Transform Metadata` scripts are critical to payload shaping. Any change to chunk structure, metadata schema, or vector DB expectations should be coordinated with those scripts.
- The indexing node uses `title` as the primary key with overwrite semantics. This is convenient for re-indexing but risky when different pages share the same title.
- Because processing happens inside a loop over crawled pages, overall runtime scales with crawl result size, chunk count, embedding latency, and vector DB write performance.