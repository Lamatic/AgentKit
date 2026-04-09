# Crawling Indexation
A flow that crawls one or more public web URLs, converts the retrieved page content into vector embeddings, and indexes those records into the shared knowledge store used by the wider internal assistant system.

## Purpose
This flow is responsible for ingesting web content into the assistant’s retrieval layer. It solves the specific sub-task of taking one or more starting URLs, crawling the reachable pages through Firecrawl, extracting the main textual content, breaking that content into retrieval-friendly chunks, embedding those chunks, and writing the resulting vectors plus metadata into a configured vector database. In practice, this is the web-source ingestion path for the kit when knowledge lives on a website rather than in cloud storage, a database, or a document repository.

The outcome of the flow is a set of indexed vector records representing crawled web pages, along with normalized metadata such as page title, description, and source URL. That outcome matters because the assistant flows in this kit depend on a populated vector store to retrieve relevant context at question time. Without this ingestion step, downstream RAG assistants cannot ground their answers in the crawled website content.

In the broader agent architecture, this is an entry-point indexation flow in the ingestion half of the pipeline. It sits before retrieval and generation: first content is discovered and indexed here, then one of the assistant flows retrieves from the vector store, and finally the assistant synthesizes a user-facing answer aligned with the project constitution. It does not answer questions itself; it prepares website knowledge so the downstream assistant layer can answer them accurately.

## When To Use
- Use when you want to ingest documentation sites, help centers, public knowledge bases, or other web content into the internal assistant’s shared vector index.
- Use when the source material is reachable via HTTP(S) URLs and should be crawled rather than uploaded manually.
- Use when you need an API-triggered indexing workflow that can start from one or more seed URLs.
- Use when the assistant should later answer questions using website content as grounded retrieval context.
- Use when a site’s main page content is more important than navigation chrome, since the crawler is configured to prefer main content extraction.

## When Not To Use
- Do not use when the source content lives in Google Drive, SharePoint, OneDrive, S3, Postgres, or another supported system with its own dedicated indexation flow in the kit.
- Do not use when you need the system to answer a user question immediately; this flow only ingests data and returns an indexing status message.
- Do not use when crawler credentials for the `Firecrawl` node have not been configured.
- Do not use when no vector database connection has been configured for the `Index` node.
- Do not use when no embedding model has been selected for the `Vectorize` node.
- Do not use when the trigger payload does not contain crawlable web URLs in `urls`; the flow assumes URL-based input.
- Do not use when you need broad external-link crawling across domains, because the crawler is configured to disallow external links and subdomain expansion by default.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `urls` | `string[]` | Yes | List of seed URLs to crawl and index. The test input shows a typical value such as `https://lamatic.ai/docs`. |
| `url` | `string` | No | Optional single URL field referenced by the crawler node. In practice, the flow is primarily configured around `urls`, but the node also maps `triggerNode_1.output.url` if present. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The trigger expects valid, fully qualified HTTP or HTTPS URLs. The flow is designed for web pages that Firecrawl can fetch and convert into markdown-like main-content output. Although both `url` and `urls` are referenced by configuration, callers should prefer `urls` as the canonical input because that is the flow’s declared test input and the crawler is set to list mode for webhook handling. There is no explicit language restriction in the flow, but chunking and embedding quality will depend on the selected embedding model’s language support. Crawl breadth is bounded by node configuration rather than user input in this flow: crawl depth is set to `5`, crawl limit to `10`, max discovery depth to `10`, and the per-node processing loop is configured with an end value of `10`.

## Outputs
| Field | Type | Description |
|---|---|---|
| `output` | `string` | Fixed success message: `Records indexed successfully`. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

The API response is a small structured object containing a single status string. It does not return the crawled pages, chunk count, embedding count, indexed record identifiers, or partial-failure details. A success response therefore indicates that the flow reached its response node, not that every requested URL necessarily produced rich crawl content. Operators should use execution logs and the connected services to inspect page-level results if they need detailed indexing diagnostics.

## Dependencies
### Upstream Flows
This is a standalone entry-point flow for the ingestion side of the kit. No other flow must run before it.

The only prerequisite data comes directly from the caller at trigger time:
- `urls` from the `API Request` trigger payload, consumed by `Firecrawl`
- optionally `url` from the same trigger payload, also mapped into `Firecrawl`

### Downstream Flows
The primary downstream consumers are the assistant flows in the parent agent bundle, including the web chat assistant and the Slack or Microsoft Teams assistant variants described in the parent agent documentation.

Those downstream flows do not call this flow directly at runtime. Instead, they rely on the vector-store state created by this flow. The useful artifacts produced here are:
- indexed vectors written by `Index`
- associated metadata records written by `Index`, including normalized fields derived from page `title`, `description`, and `source`

Because this flow’s API response only exposes a success string, downstream orchestration should treat the vector database as the true output surface.

### External Services
- Firecrawl — crawls and extracts web page content from the supplied URLs — requires a configured credential selected in the `Firecrawl` node
- Embedding model provider — converts chunk text into vector embeddings — requires the model selected in `embeddingModelName` for the `Vectorize` node
- Vector database — stores vectors and metadata for later retrieval — requires the private `vectorDB` connection used by the `Index` node

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Any provider-specific secrets are abstracted behind Lamatic private inputs and credentials rather than named environment variables in this flow definition.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the incoming API payload. This is the flow’s entry point and is expected to contain at least `urls`, with optional `url`, which are then exposed as `triggerNode_1.output` fields for downstream mapping.

2. `Firecrawl` (`dynamicNode` using `firecrawlNode`) takes the trigger’s URL input and performs a synchronous crawl. It is configured to use `urls` from `triggerNode_1.output.urls`, to prefer `onlyMainContent`, to ignore query parameters, and to avoid subdomains and external links. Its crawl settings cap the breadth and depth of discovery, helping keep indexing bounded.

3. `Loop` (`forLoopNode`) iterates over `firecrawlNode_785.output.data`, treating each crawled page item as the current record to process. The loop is list-based, so each pass handles one crawled page returned by Firecrawl.

4. `Variables` (`dynamicNode` using `variablesNode`) normalizes selected metadata from the current crawled page into three fields: `title`, `description`, and `source`. These values are drawn from `forLoopNode_370.output.currentValue.metadata` and prepared for later metadata packaging.

5. `Chunking` (`dynamicNode` using `chunkNode`) splits the current page’s markdown content from `forLoopNode_370.output.currentValue.markdown` into chunks of roughly `500` characters with `50` characters of overlap. It uses recursive character splitting with paragraph, newline, and space separators so retrieval chunks remain reasonably coherent.

6. `Extract Chunks` (`dynamicNode` using `codeNode`) runs the referenced script `@scripts/crawling-indexation_extract-chunks.ts`. Its job is to reshape the chunking output into the exact text list expected by the embedding step. This is an internal format-conversion step between Lamatic chunk output and the vectorization node’s input contract.

7. `Vectorize` (`dynamicNode` using `vectorizeNode`) sends the extracted chunk texts from `codeNode_794.output` to the selected embedding model. The node returns vector representations for the chunk list so they can be stored in the vector database.

8. `Transform Metadata` (`dynamicNode` using `codeNode`) runs the referenced script `@scripts/crawling-indexation_transform-metadata.ts`. It combines the vectors from `Vectorize` with the normalized page metadata from earlier steps into the final indexing payload, producing `vectors` and `metadata` outputs in the shapes expected by the vector database node.

9. `Index` (`dynamicNode` using `vectorNode`) writes the prepared vectors and metadata into the configured vector database. It performs the `index` action, uses `title` as the configured primary key, and is set to `overwrite` on duplicates. This means repeated indexing of records with the same primary key can replace prior entries rather than creating separate duplicates.

10. `Loop End` (`forLoopEndNode`) closes the per-page iteration and routes control back to `Loop` until all crawled items have been processed. Once iteration is complete, execution continues to the response stage.

11. `API Response` (`dynamicNode` using `graphqlResponseNode`) returns a fixed response object with `output` set to `Records indexed successfully`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails when `Firecrawl` starts | Missing or invalid crawler credential in the private `credentials` input for `firecrawlNode_785` | Configure a valid Firecrawl credential in the flow’s private inputs and retest with a known reachable URL. |
| Flow fails at `Vectorize` | No embedding model selected, selected model unavailable, or provider access is not configured correctly | Set `embeddingModelName` to a supported embedding model and verify the associated provider access in the workspace. |
| Flow fails at `Index` | No vector database selected, connection failure, or target index/schema unavailable | Configure `vectorDB`, confirm the database is reachable, and ensure the target collection/index is correctly provisioned. |
| Response says success but expected pages are missing from retrieval later | Crawl returned fewer pages than expected, pages had little extractable main content, or duplicate overwrite replaced prior entries | Review Firecrawl results and execution logs, verify site structure and crawl settings, and confirm that `title` is an appropriate primary key for your content. |
| No useful data indexed | Input `urls` was empty, malformed, blocked, or pointed to pages Firecrawl could not access | Send valid public URLs, verify robots/auth/access constraints, and test with a small known-good documentation page first. |
| Flow errors during per-page processing | Some crawled items are missing `metadata` fields or `markdown` content expected by downstream nodes/scripts | Inspect the crawl payload shape, harden or update the transformation scripts if needed, and validate that the target site produces extractable markdown. |
| Indexed records overwrite each other unexpectedly | `Index` uses `title` as the primary key, and different pages share the same title | Change the primary key strategy if possible, or update the metadata transformation so a more unique field such as source URL is used for deduplication. |
| User expects this flow to answer questions | This is an ingestion flow, not an assistant flow | Run one of the downstream assistant flows after indexing is complete. |
| Caller attempts to pass non-URL content such as raw documents or database rows | The trigger contract for this flow is URL-based crawling, not arbitrary document ingestion | Route the request to the appropriate sibling indexation flow for the actual source type. |
| Operator assumes another flow must have run first | Misunderstanding of the agent architecture | Treat this as a standalone ingestion entry point; only the private service configurations are prerequisites. |

## Notes
- The flow is intentionally opinionated for bounded crawling. It disables external links and subdomain expansion, sets a crawl limit of `10`, and uses synchronous crawling with a `30000` ms timeout.
- Main-content extraction is enabled through `onlyMainContent`, which improves signal for knowledge indexing but may omit navigation or secondary page elements some teams care about.
- Query parameters are ignored during crawling, which helps reduce duplicate pages but may collapse distinct views on some sites.
- The loop and the crawler are both effectively capped around `10` items in configuration, so this flow is better suited to small-to-medium documentation sections than to very large websites unless the configuration is expanded.
- Metadata normalization in the visible flow only captures `title`, `description`, and `source`. Any richer metadata depends on the behavior of the referenced transformation scripts.
- Because the success response is fixed and minimal, operational monitoring should rely on Lamatic run logs plus the downstream vector store state rather than the API payload alone.