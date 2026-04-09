# GDrive
A Google Drive indexation flow that ingests documents from a selected Drive folder, chunks and vectorizes their content, and writes the results into the shared vector store used by the wider Knowledge Chatbot system.

## Purpose
This flow is responsible for turning files stored in Google Drive into retrieval-ready vector records. It solves the ingestion side of the problem for teams whose source of truth lives in Drive folders: authenticate to Google Drive, read document content, split it into manageable chunks, create embeddings for those chunks, attach normalized metadata, and index the resulting records into a vector database.

The outcome is a searchable knowledge base segment derived from one chosen Google Drive folder. That matters because the downstream chatbot flow can only retrieve grounded context from content that has already been indexed. Without this flow, Google Drive content remains unavailable to retrieval and cannot contribute to answer generation.

Within the broader Knowledge Chatbot bundle, this is an entry-point indexation flow in the ingestion stage of the pipeline. It sits before retrieval and synthesis: first this flow prepares the source material for semantic search, then the separate chatbot flow queries the vector index at runtime, retrieves the most relevant chunks, and uses them to synthesize answers. It is one of several sibling indexation flows, so it should be selected specifically when Google Drive is the source system.

## When To Use
- Use when the knowledge source you want to ingest is stored in a Google Drive folder.
- Use when you need to build or refresh vector index entries from Google Drive documents for the Knowledge Chatbot.
- Use when a scheduled or operator-triggered ingestion job should pull Drive content incrementally rather than requiring a manual export.
- Use when you already have valid Google Drive credentials configured in Lamatic and a target vector database selected.
- Use when the chatbot must answer questions grounded in internal documents maintained in Drive.

## When Not To Use
- Do not use when the source content lives in another system such as OneDrive, SharePoint, S3, Postgres, Google Sheets, or web pages; use the matching sibling indexation flow instead.
- Do not use when no Google Drive credentials have been configured or the selected account cannot access the target folder.
- Do not use when you do not yet know which vector database should receive the indexed records.
- Do not use when the input is an arbitrary file upload or raw text payload rather than a Google Drive folder reference.
- Do not use when you need live question answering; this flow prepares the index only and does not perform retrieval or answer generation.
- Do not use when the folder is empty and there is nothing to index.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Google Drive credentials used by the trigger to authenticate against the Google Drive API. |
| `folderUrl` | `resourceLocator` | Yes | The Google Drive folder to ingest. It can be selected from a list or supplied as a URL, depending on the configured mode. |
| `mapping.source` | `string` | Yes | Source value provided through the `Variables` node mapping. In this flow it represents the source URL attached to output metadata. |
| `vectorDB` | `select` | Yes | Target vector database where generated embeddings and metadata are indexed. |
| `embeddingModelName` | `model` | Yes | Embedding model used to convert extracted chunk text into vectors. |

Below the table, several constraints are worth noting. The `folderUrl` input must refer to a Google Drive folder accessible to the selected `credentials`; although the node supports list and URL modes, the exported configuration defaults to `list`. The `mapping.source` field is exposed as a use-case input, but the current node configuration hardcodes a Google Drive folder URL into the mapping value, so implementers should verify whether they intend this field to remain fixed or be overridden at runtime. The flow assumes the trigger can extract textual `content` and a stable `document_key` from Drive items. Content quality, file support, and extraction success depend on the Google Drive connector and the accessible file types within the folder.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` | High-level indexing outcome returned by the terminal indexing operation, typically indicating success or failure. |
| `indexedCount` | `number` | Number of vector records or chunks written to the selected vector database, if exposed by the index node response. |
| `metadata` | `array<object>` | Metadata objects derived from the transformed records that were sent for indexing. |
| `vectors` | `array` | Embedding vectors produced for the chunked text and forwarded to the indexer. |
| `title` | `string` | Primary document identifier derived from `triggerNode_1.output.document_key` and used as the configured primary key field. |
| `source` | `string` | Source URL associated with the indexed records, supplied through the variables mapping. |

Below the table, the practical output shape is a structured object centered on the final `Index to DB` operation. The exact response contract is not fully declared in the flow source, so fields such as `status` and `indexedCount` reflect the expected indexing result rather than a guaranteed public schema. Internally, the flow definitely produces chunk text, vectors, and metadata arrays before indexing, but the canonical external response is whatever the index node emits after writing to the vector store. Consumers should therefore treat the indexing result as authoritative and not assume raw chunk-level artifacts are always returned unless they explicitly expose them.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point ingestion flow for the Knowledge Chatbot bundle.
- It does not require another Lamatic flow to run before it, but it does require that the selected Google Drive folder already contain accessible documents and that the target vector database be available.
- In the broader bundle lifecycle, operators typically run this flow before using the separate chatbot flow, because the chatbot depends on the vector index populated here.

### Downstream Flows
- `Knowledge Chatbot` flow — consumes the vector index populated by this flow during retrieval. It does not usually ingest a direct API payload from this flow; instead it relies on the indexed chunk vectors and metadata now present in the shared vector database.
- Any orchestration or operational workflow that monitors ingestion jobs may also consume the final indexing status returned by this flow.

### External Services
- Google Drive — source content system used to list and read files from the selected folder — requires configured Google Drive `credentials` on `triggerNode_1`.
- Embedding model provider — converts extracted chunk text into vector representations — requires the selected `embeddingModelName` on `vectorizeNode_623`.
- Vector database — stores vectors and metadata for later semantic retrieval — requires the selected `vectorDB` on `IndexNode_343`.
- Webhook endpoint — a configured URL present on the indexing node, likely for callback or operational integration during indexing — used by `IndexNode_343`.

### Environment Variables
- No explicit environment variables are declared in the exported flow source.
- If the selected embedding model or vector database connector requires provider-level secrets, those are managed through Lamatic model, credential, or database configuration rather than as flow-defined environment variables.

## Node Walkthrough
1. `Google Drive` (`triggerNode`) starts the flow by authenticating with the selected Google Drive account and reading content from the specified Drive folder. It is configured as the trigger node, uses `incremental_append` sync mode, and includes a weekly cron expression. For each retrieved document, it exposes at least `content` and `document_key`, which the downstream nodes use.

2. `Variables` (`variablesNode`) creates normalized working variables for the rest of the pipeline. In this flow, it maps `title` from `{{triggerNode_1.output.document_key}}` and sets `source` to a Google Drive folder URL. This is where the flow defines the human-readable or source-tracking metadata that will later be attached to indexed records.

3. `chunking` (`chunkNode`) splits `{{triggerNode_1.output.content}}` into smaller retrieval-friendly segments. It uses recursive character splitting with a target chunk size of `500` characters, `50` characters of overlap, and separators of paragraph break, line break, and space. The goal is to preserve semantic continuity while keeping chunks short enough for embedding and retrieval.

4. `Extract Chunked Text` (`codeNode`) runs the referenced script `@scripts/gdrive_extract-chunked-text.ts`. Based on its placement and input/output wiring, this step reshapes the chunker output into the exact text array or text payload expected by the embedding node. It effectively extracts the clean chunk text from the richer chunk structure.

5. `Get Vectors` (`vectorizeNode`) sends the extracted chunk text from `{{codeNode_539.output}}` to the selected embedding model. This node produces vector embeddings for each text chunk so the content can be searched semantically later.

6. `Transform Metadata` (`codeNode`) runs `@scripts/gdrive_transform-metadata.ts`. This step combines the vectorization output with the earlier variables such as `title` and `source`, then packages the results into two fields expected by the indexer: `vectors` and `metadata`. It is the normalization step that ensures the final records match the vector database schema.

7. `Index to DB` (`IndexNode`) writes the transformed `vectors` and `metadata` into the chosen vector database. It uses `title` as the configured primary key and is set to `overwrite` on duplicates, meaning later runs can replace existing records with the same primary key rather than creating parallel duplicates.

8. `addNode` (`addNode`) is only a trailing placeholder from the studio canvas and does not contribute functional runtime behavior.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Google Drive trigger fails before any records are processed | Missing, invalid, or expired `credentials` for Google Drive | Reconfigure the Google Drive credential in Lamatic, ensure OAuth scopes are valid, and verify the selected account can access the folder. |
| Flow starts but no documents are indexed | The selected `folderUrl` points to an empty folder, an inaccessible folder, or a folder containing unsupported file types | Confirm the folder URL or selected folder is correct, verify sharing permissions, and test with known text-bearing files. |
| Trigger cannot resolve the folder | `folderUrl` is malformed or supplied in the wrong mode | Use the list selector where possible, or provide a valid Google Drive folder URL in URL mode. |
| Chunking produces little or no usable text | `triggerNode_1.output.content` is empty because source files could not be extracted | Check file formats in Drive, verify the connector supports them, and inspect the trigger output for missing `content`. |
| Embedding step fails | `embeddingModelName` is not configured, unavailable, or lacks provider access | Select a valid embedding model in Lamatic and verify the underlying provider credentials and quotas. |
| Indexing step fails to write records | `vectorDB` is not configured, unreachable, or schema expectations do not match transformed payloads | Select a valid vector database, verify connectivity, and inspect the metadata transformation script assumptions around fields like `title`, `vectors`, and `metadata`. |
| Existing records are unexpectedly replaced | Duplicate handling is configured as `overwrite` and `title` is reused as the primary key | Change the primary key strategy if needed or ensure `document_key` is unique enough for your indexing semantics. |
| Source metadata is incorrect for all indexed records | The `Variables` node hardcodes `source` to a fixed folder URL rather than deriving it dynamically per document | Update the `mapping.source` value or the metadata transformation logic to reflect the actual desired per-document source. |
| Downstream chatbot returns no relevant answers after this flow ran | The chatbot flow was run against a different vector database or the indexing job produced no usable chunks | Ensure this flow and the chatbot share the same vector store, confirm records were indexed successfully, and validate chunk/vector counts. |
| Automation expects a rich response but only sees indexing status | The flow’s public response comes from the final index node rather than exposing intermediate chunk or vector payloads | Update the flow contract or downstream automation to consume the index result, or add an explicit response-shaping node if richer output is required. |

## Notes
- The trigger node is configured with `incremental_append`, which suggests repeated runs are intended to add new or updated content rather than rebuild the index from scratch.
- The configured cron expression indicates a scheduled execution pattern, nominally weekly. Operators should validate the exact schedule semantics in their Lamatic runtime and timezone handling.
- The indexing node uses `title` as the sole primary key. This is simple, but it may be too coarse if multiple files or chunks can share the same effective title; review this choice for large or heterogeneous Drive corpora.
- Two important transformation steps are implemented in external scripts: `@scripts/gdrive_extract-chunked-text.ts` and `@scripts/gdrive_transform-metadata.ts`. Their behavior determines the final chunk text payload and metadata schema, so changes there can materially alter indexing outcomes even if the flow graph remains unchanged.
- The flow metadata name in source includes a trailing space as `GDrive `. Documentation and automation should normalize this to `GDrive` when displaying or referencing the flow.
- The `Index to DB` node contains a webhook URL in its configuration. If this is active in your environment, review whether it is a placeholder, audit endpoint, or production callback before deployment.