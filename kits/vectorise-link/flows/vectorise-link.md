# Vectorise Link
This flow ingests a public webpage URL, converts its content into vector embeddings, and stores them for downstream retrieval and question-answering in the wider Lamatic knowledge pipeline.

## Purpose
`Vectorise Link` is the ingestion flow responsible for turning raw webpage content into indexed semantic knowledge. It solves the specific sub-task of fetching a public page, extracting its main readable content, splitting that content into embedding-sized chunks, generating vectors, and writing those vectors plus metadata into a context store. Without this step, downstream retrieval systems have no grounded knowledge base to search.

The outcome of a successful run is an indexed set of records representing the target webpage in chunked, embedded form. That matters because later systems can use semantic search over those records instead of repeatedly scraping or parsing the original page at query time. This improves latency, consistency, and reuse, and it makes the webpage available as durable context for chat, Q&A, and retrieval-augmented generation workflows.

In the broader agent architecture, this flow sits firmly in the ingest stage of an ingest → retrieve → synthesize chain. It is an entry-point flow exposed through an API trigger, typically called by a developer, backend service, or automation that wants to prepare a URL for later retrieval. Any downstream “chat with this webpage” or semantic lookup flow depends on this flow having already populated the target vector store.

## When To Use
- Use when you need to ingest a public webpage into a vector or context store before enabling retrieval over that page.
- Use when a backend service receives a URL and must prepare it for later semantic search or grounded chat.
- Use when a downstream Q&A or chatbot system needs reusable knowledge from a webpage rather than one-off live scraping.
- Use when you want the page’s main content extracted, chunked, embedded, and indexed in a single API call.
- Use when your orchestration layer is building or refreshing a knowledge base from public web sources.

## When Not To Use
- Do not use when the source content is not a public webpage URL or is unavailable to the scraper.
- Do not use when you need a real-time answer directly from a webpage without storing embeddings; a fetch-and-answer flow would be more appropriate.
- Do not use when the required scraping credential is not configured, because the flow depends on external page extraction.
- Do not use when the target vector store configuration has not been completed in the deployment, since indexing cannot succeed without a configured destination.
- Do not use when another ingestion flow is responsible for a different source type such as files, internal documents, or databases.
- Do not use when a downstream retrieval/chat flow is expected to answer questions immediately but this ingestion step has not yet completed.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | The public webpage URL to scrape and ingest. It is read from `triggerNode_1.output.url` and passed directly to the scraper node. |
| `metadata` | `object` | No | Optional caller-provided metadata expected by the metadata transformation stage for attachment to indexed records. The exact accepted keys depend on the script and deployment conventions. |
| `index` / `namespace` | `string` | No | Optional logical destination hint for where records should be written in the context store, if the deployed index configuration supports caller-directed routing. |

The only field explicitly referenced in the flow graph is `url`, and it must be a valid, reachable webpage address. The parent agent documentation indicates that optional metadata may be supplied and attached during indexing, but the exact schema is deployment-specific because the transformation logic lives in a referenced script. This flow assumes text-oriented page content and is configured to extract main content rather than arbitrary full-browser state.

## Outputs
| Field | Type | Description |
|---|---|---|
| `message` | `string` | Status message returned by the indexing node, exposed through the API response. |
| `records` | `number` | Count of records successfully indexed, mapped from `IndexNode_824.output.recordsIndexed`. |

The API response is a small structured object with two top-level fields: a human-readable status message and a numeric record count. It does not return the scraped content, generated chunks, embeddings, or stored metadata directly. Completeness is therefore operational rather than informational: a successful response tells you whether indexing happened and how many records were written, but not the full details of each indexed item.

## Dependencies
### Upstream Flows
- This is a standalone entry-point flow and does not require another Lamatic flow to run before it.
- The only practical upstream dependency is the caller that invokes the API trigger with a valid `url` and, if needed by the deployment, supplemental metadata or routing information.

### Downstream Flows
- Downstream retrieval or chat flows may depend on this flow having run successfully so that the indexed webpage content exists in the target vector store.
- Those downstream systems typically rely on the side effect of this flow — stored vectors and metadata in the context store — rather than on the API response fields themselves.
- If another orchestration layer tracks ingestion status, it may use `message` and `records` to confirm success before enabling retrieval against the newly indexed source.

### External Services
- Firecrawl or equivalent scraper backend — used to fetch and extract main webpage content as markdown — required credential: `FIRECRAWL_API_KEY`
- Embedding model provider — used by the vectorization node to convert chunk text into embeddings — required credential: deployment-specific model/provider configuration
- Vector database or context store — used by the index node to persist vectors and metadata for retrieval — required credential: deployment-specific vector store configuration

### Environment Variables
- `FIRECRAWL_API_KEY` — authenticates webpage scraping and content extraction — used by `Scraper`

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the incoming request and exposes trigger fields to the rest of the flow. In practice, the key input is `url`, which becomes the source address for webpage ingestion. The trigger is configured for realtime request/response behavior.

2. `Scraper` (`scraperNode`) reads `{{triggerNode_1.output.url}}` and fetches the webpage content using the configured scraping credential. It is set to extract only the main content, waits briefly before capture, and returns the page as markdown. This means navigation chrome and non-essential page elements are intentionally minimized when possible.

3. `Chunking` (`chunkNode`) takes `{{scraperNode_823.output.markdown}}` and splits the extracted page text into chunks suitable for embedding. It uses recursive character splitting with a target chunk size of `500` characters, `50` characters of overlap, and separators prioritized as paragraph breaks, line breaks, then spaces. This preserves local context between chunks while keeping payloads small enough for embedding.

4. `Extract Chunks` (`codeNode`) runs the referenced script `@scripts/vectorise-link_extract-chunks.ts`. Its role is to reshape or extract the chunk payload produced by the previous node into the exact text array or structure expected by the vectorization step. This is the bridge between Lamatic’s chunk node output format and the embedding node input contract.

5. `Vectorize` (`vectorizeNode`) receives `{{codeNode_158.output}}` as `inputText` and generates embeddings for the prepared chunks. The embedding model itself is deployment-configured rather than hard-coded here, so the flow depends on a valid embedding provider setup in the runtime environment.

6. `Transform MetaData` (`codeNode`) runs `@scripts/vectorise-link_transform-metadata.ts` after vector generation. It prepares the final indexing payload by assembling `vectors` and `metadata` fields in the exact structure expected by the index node. This is also the most likely place where source URL and any caller-supplied metadata are merged into record-level metadata.

7. `Index` (`IndexNode`) writes the transformed vectors and metadata into the configured vector database or context store. It consumes `{{codeNode_512.output.vectors}}` and `{{codeNode_512.output.metadata}}`, and it is configured to use `overwrite` as the duplicate handling strategy. That means repeated ingestion of the same logical records is intended to replace existing entries rather than create uncontrolled duplication, subject to the actual primary key and vector store configuration.

8. `API Response` (`graphqlResponseNode`) returns a compact response object to the caller. It maps the indexing result into `message` and `records`, allowing the invoker to confirm whether the ingestion completed and how many records were indexed.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request fails during scraping or returns a credential-related error | `FIRECRAWL_API_KEY` is missing, invalid, or not available to the deployment | Configure a valid `FIRECRAWL_API_KEY` in the environment used by `Scraper` and redeploy or retest. |
| Response indicates zero records indexed | The scraped page returned little or no main content, chunk extraction produced no usable chunks, or indexing filtered everything out | Verify the `url` is reachable, inspect the page for scraper-friendly content, and review the chunk extraction and metadata transformation scripts. |
| Scraper returns empty or poor content | The URL is malformed, blocked, requires authentication, is heavily client-rendered, or the main-content extraction removed most text | Provide a valid public URL, confirm the page is accessible without login, and test whether the source page is compatible with the scraper configuration. |
| Vectorization step fails | No embedding model/provider has been configured for `Vectorize`, or the input payload shape is wrong after `Extract Chunks` | Ensure the deployment has a working embedding model configuration and verify the script output matches the vectorization node’s expected input format. |
| Indexing step fails | The vector store is not configured, required credentials are missing, or the metadata/vectors payload is malformed | Complete the vector database configuration, add any required store credentials, and validate the output of `Transform MetaData`. |
| Duplicate or unexpected overwrite behavior | `Index` is configured with `duplicateOperation` set to `overwrite`, and key selection may cause existing records to be replaced | Review primary key and deduplication strategy in the deployed index configuration before running repeated ingestions. |
| Caller expects downstream Q&A immediately but cannot retrieve anything | A retrieval/chat flow is being invoked before this ingestion flow has populated the index, or it is querying a different namespace/store | Run this flow first, confirm `records` is greater than zero, and verify downstream retrieval targets the same vector store and routing configuration. |
| Optional metadata does not appear in indexed records | The caller supplied metadata fields that the transformation script does not map or the trigger schema does not expose | Align the API trigger schema and `Transform MetaData` script with the metadata fields your application needs to persist. |

## Notes
- Although the flow declares no explicit static inputs in its exported `inputs` object, it is operationally driven by trigger payload fields, most importantly `url`.
- Two critical behaviors are implemented in referenced scripts: chunk extraction and metadata transformation. Developers extending this flow should inspect those scripts before changing downstream expectations.
- The `Index` node shows blank configuration fields for `vectorDB` and `primaryKeys` in the exported source. In practice, these must be completed in the deployed environment or template configuration for indexing to work reliably.
- The scraper is configured with `onlyMainContent` enabled and `mobile` disabled, which biases ingestion toward readable article-style text rather than full-page rendering fidelity.
- The response is intentionally minimal. If your orchestration system needs per-chunk identifiers, stored metadata echoes, or debugging detail, you will need to extend the response mapping or log intermediate node outputs.