# Scraping Indexation
A flow that scrapes website content, converts it into vector embeddings, and indexes it into a vector database so the wider deep research system can retrieve internal web-derived knowledge during downstream answer generation.

## Purpose
This flow is responsible for turning one or more public website URLs into searchable internal knowledge. It solves the ingestion side of the system: fetching page content, extracting the main markdown body and page metadata, splitting that content into chunks, generating embeddings for those chunks, and writing the resulting vectors plus metadata into a configured vector database. Without this step, the broader research agent cannot reliably search organization-specific or curated web content as part of grounded retrieval.

The outcome is a populated or updated vector index containing chunk-level representations of scraped pages. That matters because downstream retrieval flows depend on a consistent, queryable knowledge store rather than raw webpages. By indexing content ahead of time, the system can answer research questions against those sources with lower latency and more repeatable relevance than scraping at answer time.

Within the broader Deep Research architecture, this flow sits before the retrieval and synthesis stages. The parent agent uses separate flows to plan research steps, search the public web, search indexed data sources, and synthesize a final answer. This flow supports that pipeline indirectly by maintaining one of those indexed data sources. It is an ingestion and maintenance flow, not a user-facing reasoning flow.

## When To Use
- Use when you need to ingest one or more websites into the system’s vector database so they can be searched later by internal retrieval flows.
- Use when an operator wants to seed a knowledge base from a known list of URLs before running deep research queries.
- Use when website content has changed and the indexed representation should be refreshed using overwrite semantics.
- Use when the broader agent pipeline needs a curated internal corpus derived from public or semi-public webpages rather than live web search at query time.
- Use when a vector database has already been configured and an embedding model has been selected for this content domain.

## When Not To Use
- Do not use when the goal is to answer a user question directly; this flow only ingests content and returns a success message.
- Do not use when no `vectorDB` target has been configured, because indexing cannot complete without a destination database.
- Do not use when Firecrawl credentials are unavailable or invalid, because the flow depends on authenticated scraping.
- Do not use when the input is not a list of scrapeable URLs or a comma-separated URL string acceptable to the configured scraping node.
- Do not use when you need live public-web retrieval for a single research run; a web-search flow is the better fit for current-answer retrieval.
- Do not use when a sibling indexation flow for another source type such as cloud storage, databases, or enterprise content connectors is the correct ingestion path.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` or `string` | Yes | One or more URLs to scrape. The configured scraper accepts either an array of URLs or a comma-separated string of URLs. |
| `credentials` | `select` | Yes | Firecrawl authentication credentials used by the `Firecrawl` node to access the scraping service. |
| `vectorDB` | `select` | Yes | The target vector database where chunk embeddings and metadata will be indexed. |
| `embeddingModelName` | `model` | Yes | The embedding model used to convert extracted text chunks into vector representations. |

Below the table, several constraints are implied by the flow configuration. The trigger-level business input is `urls`, and the flow’s test input shows it as an array of URL strings. The scraper configuration also allows a comma-delimited string, but callers should prefer a proper array for predictability. URLs must be valid and reachable by Firecrawl. The flow uses synchronous batch scraping with `limit` set to `10`, so very large batches may require splitting into multiple invocations. Scraped content is chunked from markdown body text, so pages with little or no main content may index poorly or produce no useful chunks.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | A fixed success message: `Records indexed successfully`. |

The API response is a simple object containing a single human-readable status string rather than structured indexing statistics. It does not expose per-URL success, chunk counts, vector counts, or partial failure details. A successful response therefore indicates that the flow reached its response node, not necessarily that every requested URL produced meaningful indexed content.

## Dependencies
### Upstream Flows
- This is effectively a standalone ingestion flow and entry point for website indexation. It is invoked directly through an API/GraphQL request.
- No other flow must run immediately before it for execution to begin.
- In the broader agent architecture, operators typically run this flow before any internal vector-search retrieval flow that expects website-derived content to already exist in the vector database.

### Downstream Flows
- Internal data-source retrieval flows in the wider Deep Research kit may depend on the records this flow writes into the vector database, even though they do not consume this flow’s API response directly.
- Those downstream retrieval flows rely on the indexed vectors and metadata stored by the `Index` node, not on the returned `output` message.
- Final synthesis flows may then consume evidence surfaced by those retrieval flows after this indexed content becomes searchable.

### External Services
- Firecrawl — scrapes the provided URLs and returns page content plus metadata — requires the selected `credentials` input on the `Firecrawl` node
- Embedding model provider — converts text chunks into embeddings — requires the selected `embeddingModelName` on the `Vectorize` node
- Vector database — stores vectors and metadata for later retrieval — requires the selected `vectorDB` input on the `Index` node
- Lamatic GraphQL/API runtime — receives the invocation and returns the response — used by `API Request` and `API Response`

### Environment Variables
- `LAMATIC_API_URL` — Lamatic API endpoint used by the deployed flow runtime — used by the overall deployed flow invocation path, including `API Request` and `API Response`
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for the deployed kit — used by the deployed flow runtime rather than a specific business node
- `LAMATIC_API_KEY` — authentication for Lamatic-hosted flow execution — used by the deployed flow runtime rather than a specific business node

## Node Walkthrough
1. `API Request` (`triggerNode`) starts the flow through Lamatic’s GraphQL/API trigger. It expects the caller to provide `urls`, which become available to downstream nodes as `triggerNode_1.output.urls`.
2. `Firecrawl` (`dynamicNode`) performs a synchronous batch scrape using the incoming `urls`. It is configured for `syncBatchScrape`, with `onlyMainContent` enabled, a timeout of `30000` ms, a `waitFor` delay of `2000` ms, and query parameters ignored. The result is a list of scraped page records exposed under `firecrawlNode_785.output.data`.
3. `Loop` (`forLoopNode`) iterates over each scraped page record returned by `Firecrawl`. The loop is configured to iterate over the scraped list rather than numeric values, making each page available as `forLoopNode_370.output.currentValue`.
4. `Variables` (`dynamicNode`) extracts key page-level metadata from the current scraped item. It maps `title` from `currentValue.metadata.title`, `description` from `currentValue.metadata.description`, and `source` from `currentValue.metadata.url`. These values are prepared for later attachment to every chunk from the page.
5. `Chunking` (`dynamicNode`) splits the current page’s markdown body from `currentValue.markdown` into overlapping text chunks. It uses recursive character splitting with `500` characters per chunk, `50` characters of overlap, and separators of paragraph break, newline, then space.
6. `Extract Chunks` (`dynamicNode`, code node) runs the referenced script `@scripts/scraping-indexation_extract-chunks.ts`. Its role is to reshape or extract the chunk payload from the chunking output into the exact text array expected by the embedding step.
7. `Vectorize` (`dynamicNode`) sends the extracted chunk texts to the configured embedding model. It reads its `inputText` from `codeNode_794.output` and produces vector embeddings for each chunk.
8. `Transform Metadata` (`dynamicNode`, code node) runs the referenced script `@scripts/scraping-indexation_transform-metadata.ts`. This step combines the generated vectors with the prepared page metadata so the indexer receives a `vectors` payload and a matching `metadata` payload in the required structure.
9. `Index` (`dynamicNode`) writes the transformed vectors and metadata into the selected vector database. It performs the `index` action, uses `title` as the configured primary key, and applies `duplicateOperation` as `overwrite`, so existing records keyed the same way are replaced rather than duplicated.
10. `Loop End` (`forLoopEndNode`) closes the per-page processing cycle and routes execution back to `Loop` until all scraped records have been processed.
11. `API Response` (`dynamicNode`) returns a fixed response object with `output` set to `Records indexed successfully` after the loop completes.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails at or soon after `Firecrawl` | Missing, invalid, or expired `credentials` for Firecrawl | Reconfigure the `credentials` input with a valid Firecrawl credential and retry the flow. |
| Flow returns success but expected pages are not searchable later | The scrape produced little usable main content, the page markdown was empty, or indexing wrote fewer records than expected | Inspect the target URLs manually, verify they expose meaningful content, and test with a smaller batch to confirm chunk creation and indexing behavior. |
| Flow fails before indexing begins | `urls` input is missing, malformed, or not accepted by the scraper configuration | Pass `urls` as a valid array of fully qualified URLs, or as a comma-separated string only if your caller cannot send arrays. |
| Flow fails at `Vectorize` | `embeddingModelName` was not selected or points to an unavailable embedding model | Select a valid text embedding model supported in the environment and redeploy or rerun. |
| Flow fails at `Index` | `vectorDB` is not configured, is unreachable, or rejects the payload format | Verify the selected vector database connection, ensure the database exists and is accessible, and confirm the index schema matches the generated vectors and metadata. |
| Some URLs seem missing from the indexed corpus | The batch scrape hit practical limits, certain pages timed out, or scraping restrictions blocked extraction | Reduce batch size, verify site accessibility, increase operational tolerance outside this flow if supported, or retry with a narrower URL list. |
| Records are unexpectedly overwritten | The `Index` node uses `duplicateOperation` set to `overwrite` with `title` as the primary key | Use unique page titles where possible, or adjust the indexing design if title collisions are likely in your deployment. |
| Downstream retrieval flow finds no internal results | This flow has not been run yet, failed silently for the target URLs, or indexed into a different vector database than the retriever uses | Run or rerun this flow successfully, confirm the same vector database is used downstream, and validate that records exist after indexing. |

## Notes
- The flow uses synchronous batch scraping rather than an asynchronous crawl pipeline. That keeps invocation simple but makes large ingest jobs more sensitive to request duration and scraper limits.
- Scraping is configured with `onlyMainContent` enabled, which improves signal quality for retrieval but may omit navigation, structured sidebars, or other peripheral page elements that some use cases might care about.
- Chunking is fixed at `500` characters with `50` characters overlap. This is a reasonable general-purpose setting, but retrieval quality may vary by content style, page structure, and embedding model.
- The configured scraper batch `limit` is `10`, and the loop end value is also `10`, though the actual loop iterates over the scraped list. Operationally, callers should treat this as a small-batch ingestion flow.
- The response does not include indexing metrics. If you need auditability, per-page status, or exact record counts, add explicit reporting nodes or enhance the referenced scripts and response mapping.