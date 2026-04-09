# Vectorise S3
This flow ingests documents from Amazon S3, converts them into vector embeddings, and writes them to a vector database so downstream retrieval and RAG systems can search your content efficiently.

## Purpose
This flow is responsible for the ingestion and indexing stage of an S3-backed knowledge pipeline. Its job is to take files discovered in an S3 bucket, extract usable text from them, split that text into retrieval-friendly chunks, generate embeddings for those chunks, and persist both vectors and metadata into a configured vector database. That solves the core problem of turning raw, unstructured file storage into a searchable semantic index.

The outcome of a successful run is a populated or updated vector index containing chunk-level embeddings plus metadata derived from the source files. That outcome matters because retrieval systems, semantic search endpoints, and RAG applications depend on this indexed layer rather than querying S3 objects directly. Without this flow, downstream systems would have no efficient way to ground answers in your S3-hosted documents.

In the broader system, this flow sits firmly in the ingest-and-index portion of the pipeline rather than the query or synthesis portion. The parent agent context makes clear that this kit is a single-flow indexing template: operators, backend jobs, or orchestration systems invoke it to keep the vector store synchronized with S3. Retrieval-time ranking, prompt assembly, and answer generation are expected to happen in separate flows or services that consume the resulting vector index.

## When To Use
- Use when you need to create an initial semantic index from documents already stored in an S3 bucket.
- Use when new or updated S3 objects should be incrementally appended to an existing vector database.
- Use when a scheduled ingestion job is needed to keep a retrieval corpus current without manual reindexing.
- Use when downstream RAG or semantic search systems require embeddings and metadata for S3-hosted documents.
- Use when your deployment already has S3 access, an embedding model, and a vector database configured, and the goal is indexing rather than query-time retrieval.
- Use when files are available through S3 object URLs that can be passed through Lamatic's file extraction pipeline.

## When Not To Use
- Do not use when the primary task is answering a user query; this flow builds the retrieval layer but does not retrieve or synthesize responses.
- Do not use when source content is not stored in Amazon S3 or cannot be reached by the configured S3 trigger.
- Do not use when the S3 bucket, credentials, embedding model, or vector database target have not yet been configured.
- Do not use when you need strict one-off document parsing logic for unsupported file types beyond what the extraction and code steps can handle.
- Do not use when you want to delete or fully reconcile removed documents from the index; this configuration is set to `incremental_append`, not a full sync or purge workflow.
- Do not use when another ingestion flow is responsible for a different source system such as web pages, local uploads, or a database export.
- Do not use when the input is already clean text chunks ready for embedding; in that case a simpler embedding/indexing flow would be more appropriate.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `bucket` | `string` | Yes | The Amazon S3 bucket the trigger monitors for files to ingest. In this exported template it is blank and must be configured before use. |
| `globs` | `string[]` | No | File selection patterns used by the S3 trigger. This flow is configured with `"**"`, meaning all matching objects in scope are eligible. |
| `strategy` | `"auto" | string` | No | S3 discovery strategy for how files are detected. This flow uses `auto`. |
| `syncMode` | `"incremental_append" | string` | No | Synchronization mode controlling how new content is processed. This flow is configured for incremental append behaviour. |
| `start_date` | `string` | No | Optional lower bound for historical sync. It is currently empty, so effective behaviour depends on runtime connector settings. |
| `credentials` | `string` | Yes | Reference to the S3 credential configuration used by the `S3` trigger node. It is blank in the template and must be supplied in deployment. |
| `cronExpression` | `string` | No | Schedule expression for automated runs. This flow uses `0 0 */3 ? * * UTC`, meaning it is intended to run every 3 hours in UTC. |
| `days_to_sync_if_history_is_full` | `string` | No | Operational backfill window used by the S3 sync mechanism. This flow is configured with `3`. |
| `document_url` | `string` | Yes, runtime-derived | Per-file URL emitted by the S3 trigger and consumed by downstream extraction. This is not user-entered directly in most deployments but is the effective trigger payload for each file execution. |

Below the table, the most important constraint is that this flow does not expose a rich custom request schema in `inputs`; instead, it relies on trigger-node configuration and runtime records produced by the S3 connector. In practice, deployments must provide a valid S3 bucket and credentials, and each triggered item must resolve to a readable `document_url`.

The file extraction node is explicitly configured with `format` set to `pdf`, so PDF documents are the clearest supported path in this exported configuration. Although the S3 trigger glob is broad, successful processing depends on the extraction and custom code steps being able to interpret the file content emitted for each object.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` | High-level execution result of the flow run, typically derived from whether indexing completed successfully. |
| `indexed_records` | `number` | Count of vector records written or overwritten in the target vector database during the run. |
| `vectors` | `array` | Vector payload prepared by the `Transform Metadata` step and passed into the `Index` node. |
| `metadata` | `array<object>` | Metadata payload paired with the vectors and written into the vector database. |
| `index_result` | `object` | Provider-specific response from the `Index` node indicating success, overwrite behaviour, or write statistics. |

Below the table, the response should be understood as a structured indexing result rather than a user-facing prose answer. The flow's terminal node is `Index`, followed by an empty `addNode`, so the exact API response shape may vary by Lamatic runtime and vector database connector. What is stable from the graph is that the final meaningful artifacts are the vectors and transformed metadata sent to the indexer, plus whatever write acknowledgement the vector store returns.

Because the exported configuration does not define explicit response mapping fields, consumers should treat the index write result as implementation-dependent and validate it in their own environment. If a run processes multiple S3 objects over time, outputs may represent one file execution at a time rather than a consolidated batch summary.

## Dependencies
### Upstream Flows
- This is a standalone entry-point ingestion flow. No upstream Lamatic flow must run before it.
- The operational prerequisite is external rather than flow-based: S3 must already contain the source documents, and the deployment must already have valid connector configuration for S3, embedding generation, and vector indexing.
- If an orchestrator invokes this flow as part of a larger pipeline, it typically supplies infrastructure readiness rather than data produced by another Lamatic flow.

### Downstream Flows
- No downstream flow is defined in this kit export.
- In the broader architecture, retrieval or RAG flows may query the vector database populated by this flow, but they depend on the indexed collection in the vector store rather than on a direct Lamatic flow output contract.
- Any downstream consumer will typically rely on the indexed vectors and associated metadata written by `Index`, using that data for semantic search, retrieval augmentation, ranking, or answer grounding.

### External Services
- Amazon S3 — source document storage and change detection — required S3 connector credentials used by the `S3` node.
- File extraction service within Lamatic — parses the source file referenced by `document_url` into machine-usable content — used by `Extract from File`.
- Embedding model provider — converts chunked text into vector embeddings — configured through the `Vectorize` node and requires the relevant model/provider credentials.
- Vector database — stores embeddings and metadata for similarity search — configured through the `Index` node and requires the target database credentials and collection/index settings.
- Custom Lamatic code runtime — executes the referenced scripts for text extraction, chunk normalization, and metadata transformation — used by `Extract Text`, `Get Chunks`, and `Transform Metadata`.

### Environment Variables
- `S3` connector credentials variable or secret reference — authenticates access to the source bucket — used by `S3`.
- Embedding provider API key such as `OPENAI_API_KEY` or the equivalent for the selected model provider — authorizes embedding generation — used by `Vectorize`.
- Vector database connection variables such as endpoint, API key, namespace, collection, or index name — authorizes writes and selects the target index — used by `Index`.
- Any script-specific runtime secrets required by custom code — only needed if the referenced scripts depend on external libraries or services beyond the node graph — used by `Extract Text`, `Get Chunks`, or `Transform Metadata`.

## Node Walkthrough
1. `S3` (`triggerNode`) starts the flow by monitoring a configured Amazon S3 bucket for objects matching the `globs` filter. It is set to `incremental_append`, so the intended behaviour is to discover new or changed items over time rather than rebuilding the entire corpus each run. For each eligible object, it emits a `document_url` that represents the file to process.

2. `Extract from File` (`extractFromFileNode`) reads the file located at `{{triggerNode_1.output.document_url}}`. In this export it is configured for `pdf` input with `joinPages` enabled, so multi-page PDFs are treated as one continuous text source before downstream chunking.

3. `Extract Text` (`codeNode`) runs the custom script `@scripts/vectorise-s3_extract-text.ts`. Its role is to normalize the extraction output into the text form expected by the chunker. In practice, this is where file-parser output is simplified, cleaned, or reduced to the actual textual payload that should be embedded.

4. `Chunking` (`chunkNode`) splits the extracted text from `{{codeNode_315.output}}` into overlapping chunks. It uses a recursive character splitter with a chunk size of `500` characters and an overlap of `50`, preferring breaks at paragraph boundaries, then line breaks, then spaces. This prepares retrieval-friendly segments that preserve enough context while remaining small enough for embedding and search.

5. `Get Chunks` (`codeNode`) runs `@scripts/vectorise-s3_get-chunks.ts`. This step converts the chunk node's output into the exact structure the embedding node expects, likely flattening or selecting only the chunk texts rather than the richer splitter metadata.

6. `Vectorize` (`vectorizeNode`) generates embeddings from `{{codeNode_254.output}}`. The node's `inputText` is therefore the prepared list of chunk texts. The `embeddingModelName` is not populated in the export, so deployment must supply a concrete embedding model before this step can succeed.

7. `Transform Metadata` (`codeNode`) runs `@scripts/vectorise-s3_transform-metadata.ts`. This script takes the embedding output and reshapes it into two aligned payloads: `vectors` for the numeric embeddings and `metadata` for source-aware fields that should be stored alongside them in the vector database.

8. `Index` (`IndexNode`) writes `{{codeNode_507.output.vectors}}` and `{{codeNode_507.output.metadata}}` to the configured vector database. It is set to `duplicateOperation` = `overwrite`, so if records with the same primary identity already exist, the intended behaviour is replacement rather than duplicate accumulation. The actual target database and primary key configuration are blank in the template and must be configured in deployment.

9. `addNode_290` (`addNode`) is the terminal placeholder node connected after indexing. It has no configured behaviour in this export, so it functions primarily as an end-of-flow sink rather than a meaningful transformation or response formatter.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow never starts on schedule | The S3 trigger is not fully configured, the bucket is blank, credentials are missing, or the cron schedule is disabled in deployment | Configure the `S3` node with a real bucket and valid credentials, then verify scheduling is enabled in the Lamatic environment |
| Trigger fires but no files are processed | The `globs` pattern, sync window, or incremental sync state excludes available objects | Confirm the bucket contains matching objects, review connector sync history, and broaden or correct the file selection settings if needed |
| `Extract from File` fails | `document_url` is invalid, inaccessible, points to a non-PDF file, or the file is corrupted/password-protected | Verify that the S3 object is reachable, use supported file types for the configured extractor, and update the node configuration if non-PDF inputs must be supported |
| Extraction returns empty text | The file contains no machine-readable text, OCR is required, or the custom extraction script filters everything out | Test with a known text-based PDF, add OCR upstream if needed, and inspect the `Extract Text` script behaviour |
| Chunking produces no usable segments | The previous code step returned empty text or an unexpected structure | Validate the output of `Extract Text` and adjust the script so it returns a plain text payload compatible with `Chunking` |
| `Vectorize` fails with model or authentication errors | No embedding model is configured, provider credentials are missing, or the selected provider is unavailable | Set `embeddingModelName`, provide the correct API key or provider secret, and verify model availability in the target environment |
| `Index` fails to write vectors | The vector database target is blank, connection credentials are missing, schema requirements are unmet, or primary key settings are invalid | Configure `vectorDB`, `primaryKeys`, and all required connection secrets, then confirm the target index or collection exists and accepts the payload shape |
| Duplicate or inconsistent records appear | Primary key design is incomplete or overwrite semantics do not align with how document chunks are identified | Define stable primary keys per chunk or source document and verify that `duplicateOperation` = `overwrite` matches the intended lifecycle |
| Upstream flow not having run | An external orchestrator assumes prior Lamatic preprocessing, but this kit is standalone and expects S3 to be the source of truth | Invoke this flow directly for ingestion, or ensure any external preprocessor writes finished files into S3 before this flow runs |
| Run completes but downstream search returns poor results | Chunk size, overlap, metadata design, or embedding model selection is not suitable for the document corpus | Tune chunking parameters, enrich metadata in the transform script, and evaluate a more appropriate embedding model |

## Notes
- Although the trigger glob is broad, the extraction node is explicitly configured for `pdf`, so mixed-content buckets may require filtering or extractor changes.
- The flow relies on three custom scripts referenced by path, and their exact field-level transformations are not visible in the export. If you need strict output contracts, inspect and version those scripts alongside the flow.
- `syncMode` is `incremental_append`, which is well suited to ongoing ingestion but does not imply hard deletion or full reconciliation of removed S3 objects.
- `duplicateOperation` is set to `overwrite`, but the actual overwrite behaviour depends on well-defined primary keys in the `Index` node. Leaving `primaryKeys` blank in deployment can lead to provider-specific failures or poor deduplication behaviour.
- The final `addNode` is unconfigured, so if your platform requires a stable API response schema, add an explicit response-mapping step after `Index`.
- Performance and cost are driven mainly by document count, file size, chunk count, embedding model pricing, and vector database write throughput. Large PDFs can expand into many chunks, which directly increases embedding and indexing cost.