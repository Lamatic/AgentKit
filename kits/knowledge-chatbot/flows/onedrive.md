# Onedrive
A scheduled ingestion flow that syncs supported files from Microsoft OneDrive, turns their contents into vector embeddings, and writes them into the shared knowledge index used by the wider RAG system.

## Purpose
This flow is responsible for the OneDrive-specific ingestion path in the Knowledge Chatbot bundle. Its job is to connect to a Microsoft OneDrive Business source, discover supported files within the configured drive and folder scope, extract each document’s textual content and file metadata, split that content into retrieval-friendly chunks, generate embeddings for those chunks, and index the resulting vectors into the selected vector database.

The outcome is a searchable semantic representation of OneDrive documents. That matters because the broader agent pipeline depends on a populated vector index before the chatbot can retrieve grounded context. Without this step, documents stored in OneDrive remain invisible to downstream retrieval and cannot inform answers produced by the RAG chatbot.

Within the broader retrieval-augmented generation architecture, this flow sits firmly in the knowledge preparation stage rather than the answer generation stage. It is one of the ingestion/indexation flows described by the parent agent, alongside sibling flows for other sources such as Google Drive, SharePoint, S3, Postgres, and web crawling. Its output is not an end-user answer; it is indexed knowledge that downstream retrieval and synthesis flows query at runtime.

## When To Use
- Use this flow when your source content lives in Microsoft OneDrive and you want that content available to the shared knowledge base.
- Use this flow during initial knowledge base setup to ingest existing documents from a OneDrive drive or folder.
- Use this flow when you need recurring synchronization of changed OneDrive files into the vector index; the trigger is configured for incremental sync on a schedule.
- Use this flow when your relevant source files are in one of the supported formats: `pdf`, `docx`, `txt`, `pptx`, or `md`.
- Use this flow when the downstream `Knowledge Chatbot` or another retrieval consumer should be able to answer questions grounded in OneDrive-hosted internal documents.

## When Not To Use
- Do not use this flow for ad hoc question answering; it prepares indexed knowledge but does not retrieve or synthesize answers.
- Do not use this flow when the source data is not in OneDrive; a sibling ingestion flow is more appropriate for Google Drive, SharePoint, S3, Postgres, crawling, or other supported sources.
- Do not use this flow if no vector database has been configured, because the flow’s main purpose is to write vectors and metadata into an index.
- Do not use this flow if valid OneDrive credentials are not available, because the trigger cannot authenticate to the Microsoft source.
- Do not use this flow for unsupported file types outside the configured glob set, as those files will not be included in ingestion.
- Do not use this flow when you need full historical backfill outside the configured incremental sync behavior unless you first verify or adjust the source sync settings.
- Do not use this flow if the desired content lives only in shared items with path assumptions that depend on normal folder scoping; the configured `folder_path` notes explicitly say folder path behavior does not apply to shared items.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | OneDrive authentication credentials used by the trigger to connect to Microsoft OneDrive Business. |
| `drive_name` | `text` | Yes | Name of the OneDrive drive to sync from. For most accounts this is `OneDrive`. |
| `folder_path` | `text` | Yes | Folder path to search within the selected drive. Use `.` to search broadly, or an absolute-style path such as `./FolderName/SubfolderName`. |
| `embeddingModelName` | `model` | Yes | Embedding model used to convert extracted text chunks into vectors. Must be a text embedding model. |
| `vectorDB` | `select` | Yes | Target vector database where generated embeddings and metadata will be indexed. |

Below the table, describe any notable input constraints or validation assumptions.

- `drive_name` is expected to match the actual Microsoft drive name exposed by the connector; the default is `OneDrive`.
- `folder_path` is required even when searching broadly; the intended broad-search value is `.`.
- `folder_path` should use the documented path pattern such as `./FolderName/SubfolderName` when targeting a specific folder.
- The source trigger is configured to look only for files matching these globs: `**/*.pdf`, `**/*.docx`, `**/*.txt`, `**/*.pptx`, and `**/*.md`.
- The embedding model must support `embedder/text`; chat or completion-only models are not suitable.
- The selected vector database must be compatible with Lamatic’s `Index` node and available to the workspace.

## Outputs
| Field | Type | Description |
|---|---|---|
| `vectors` | `array` | Vector embeddings generated from the extracted OneDrive document chunks and passed into the indexing step. |
| `metadata` | `array` | Metadata records aligned to the generated chunks, including transformed document attributes used during indexing. |
| `indexing_result` | `object` | The practical terminal outcome of the flow: vectors and metadata written to the configured vector database with duplicate handling set to overwrite by `file_name`. |

Below the table, describe the output format in plain English.

This flow is an ingestion pipeline, so its meaningful output is operational rather than conversational. Internally it produces a sequence of chunk texts, embeddings, and metadata objects, then commits them to the selected vector index. The final state is a structured indexed corpus in the vector database rather than a prose response.

Because the exported flow definition does not expose a dedicated response-mapping node after `Index`, API-level response details may depend on Lamatic runtime behavior. Developers should treat successful completion and persisted index records as the canonical output. If no files match, no usable text is extracted, or indexing is skipped, the resulting indexed corpus may be empty or partially updated.

## Dependencies
### Upstream Flows
- This is a standalone ingestion entry-point flow for the OneDrive source. No other Lamatic flow must run before it.
- Its true prerequisites are configuration prerequisites rather than flow prerequisites: valid OneDrive credentials, a selected embedding model, and a selected vector database.
- In the broader agent architecture, operators typically run this flow before invoking the downstream retrieval chatbot so that the shared knowledge index contains OneDrive-derived documents.

### Downstream Flows
- `Knowledge Chatbot` — consumes the indexed corpus produced by this flow through the shared vector database. It does not read a direct payload from this flow; instead it depends on the embeddings and metadata having been persisted successfully.
- Any other retrieval or orchestration flow that queries the same vector database can indirectly consume this flow’s indexed output, especially metadata such as document source, title, and modification timestamp.

### External Services
- Microsoft OneDrive Business connector — used to authenticate, enumerate, and sync supported files from the configured drive and folder — required credential: `credentials`
- Embedding model provider — used to convert chunked text into vector embeddings — required configuration: `embeddingModelName`
- Vector database — used to persist vectors and chunk metadata for later semantic retrieval — required configuration: `vectorDB`
- Lamatic script runtime — used to execute `@scripts/onedrive_get-chunks.ts` and `@scripts/onedrive_transform-metadata.ts` during chunk preparation and metadata shaping — required within the Lamatic flow runtime

### Environment Variables
- No explicit environment variables are declared in the exported flow definition.
- Any secret material is supplied through Lamatic-managed private inputs such as `credentials`, `embeddingModelName`, and `vectorDB` rather than named environment variables visible in this flow.

## Node Walkthrough
1. `Onedrive Business` (`triggerNode`) starts the flow by connecting to Microsoft OneDrive Business with the selected `credentials`. It is configured for `incremental` sync, uses `auto` strategy, searches the configured `drive_name` and `folder_path`, and limits ingestion to files matching the supported document globs. The trigger also carries source metadata fields such as `document_key`, `_ab_source_file_last_modified`, `_ab_source_file_url`, and the extracted file `content`.
2. `Variables` (`variablesNode`) maps selected trigger output fields into a simpler metadata shape for downstream use. It creates `title` from `{{triggerNode_1.output.document_key}}`, `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`, and `source` from `{{triggerNode_1.output._ab_source_file_url}}`.
3. `Chunking` (`chunkNode`) splits `{{triggerNode_1.output.content}}` into smaller retrieval-friendly chunks using a recursive character text splitter. It targets chunk sizes of `500` characters with `50` characters of overlap and uses `\n\n`, `\n`, and space as separator priorities.
4. `Get Chunks` (`codeNode`) runs the `@scripts/onedrive_get-chunks.ts` script. In this flow, that script sits immediately after chunking and prepares the chunk output into the form expected by the embedding node. Practically, this is the handoff point where chunk data becomes the text list supplied to vectorization.
5. `Vectorize` (`vectorizeNode`) sends the prepared chunk text from `{{codeNode_254.output}}` to the selected `embeddingModelName`. It returns vector embeddings aligned to the OneDrive document chunks.
6. `Transform Metadata` (`codeNode`) runs the `@scripts/onedrive_transform-metadata.ts` script after embeddings are generated. This step shapes metadata into the structure expected by the index node, combining source-derived values with any chunk-level or file-level attributes required for indexing.
7. `Index` (`IndexNode`) writes the generated vectors from `{{vectorizeNode_639.output.vectors}}` and transformed metadata from `{{codeNode_507.output.metadata}}` into the selected `vectorDB`. The node uses `file_name` as the primary key and sets `duplicateOperation` to `overwrite`, so re-ingested documents with the same key replace prior indexed records.
8. `addNode` (`addNode`) is an empty terminal placeholder in the exported graph. It does not add documented business logic and simply marks the current end of the flow path.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Authentication failure at start of run | The selected `credentials` are missing, expired, revoked, or tied to the wrong Microsoft tenant/account | Reconnect or replace the OneDrive credentials in Lamatic and verify the account can access the target drive |
| Flow completes but no documents are indexed | `drive_name` or `folder_path` points to the wrong location, or no files match the configured glob patterns | Verify the drive name, confirm the folder path exists, and ensure the target files are in supported formats: `pdf`, `docx`, `txt`, `pptx`, `md` |
| Empty or sparse chunk output | Source files contain little extractable text, are scanned/image-heavy, or content extraction produced empty `content` | Validate the source files contain machine-readable text and test with a known text-rich document |
| Embedding step fails | `embeddingModelName` is not configured, unavailable, or not a valid text embedding model | Select a supported `embedder/text` model and confirm workspace access to that model provider |
| Indexing step fails | `vectorDB` is not configured, unreachable, incompatible, or missing required permissions/schema | Reconfigure the vector database connection and confirm the selected index backend is available in the workspace |
| Duplicate documents overwrite prior records unexpectedly | The index node uses `file_name` as `primaryKeys` with `duplicateOperation` set to `overwrite` | If overwrite behavior is undesirable, change the primary key strategy or duplicate policy before production use |
| Expected historical files do not appear after sync | The trigger is configured for `incremental` sync and may only capture changes according to connector state and history settings | Review connector sync state, backfill settings, and whether a fresh sync or reset is needed for full reindexing |
| Metadata fields are missing or malformed in the index | The source connector did not emit expected fields such as `document_key` or the metadata transform script did not shape them as expected | Inspect trigger output and validate the behavior of `@scripts/onedrive_transform-metadata.ts` against real sample records |
| Chatbot cannot answer from OneDrive content even after a successful run | This flow has not been run against the correct vector database, or the chatbot is pointed at a different index | Ensure this flow and the retrieval chatbot share the same vector database and collection/index configuration |
| Upstream flow not having run | The downstream retrieval flow is being tested before this ingestion flow has populated the shared vector index | Run this flow first, verify vectors are present in the configured `vectorDB`, then test the retrieval chatbot |

## Notes
- The trigger is scheduled with cron expression `0 0 00 ? * 1 * UTC`, indicating a weekly run in UTC. Operators should confirm the intended schedule semantics in their Lamatic environment before relying on it for production synchronization.
- The source sync mode is `incremental`, which is efficient for ongoing updates but can obscure expectations during first-time setup or backfills.
- Chunking is tuned for relatively small segments with overlap. This is generally good for retrieval quality, but the right chunk size may vary depending on document style, embedding model, and vector store limits.
- The metadata mapping creates `title`, `last_modified`, and `source` early in the flow, but the final indexed metadata shape depends on the `Transform Metadata` script. Review that script if strict metadata contracts are required by downstream retrieval or UI layers.
- Since `file_name` is the only declared primary key at index time, documents with identical file names in different folders may collide unless the metadata transform or index backend introduces additional uniqueness.