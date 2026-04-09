# Onedrive
A flow that ingests documents from Microsoft OneDrive Business, converts them into vectorized chunks, and populates the shared knowledge index used by the wider Knowledge Chatbot system.

## Purpose
This flow is responsible for pulling supported files from a configured Microsoft OneDrive Business drive and folder path, extracting their textual content, splitting that content into retrieval-friendly chunks, embedding those chunks, and writing the results into a selected vector database. Its job is not to answer questions directly, but to build and refresh the knowledge base that the chatbot depends on.

The outcome is a set of indexed vectors paired with normalized metadata such as document title, source URL, and last modified timestamp. That outcome matters because the downstream retrieval layer can only ground chatbot answers in OneDrive content after this ingestion step has completed successfully. Without this flow, OneDrive documents remain unavailable to semantic search and retrieval-augmented generation.

Within the broader bundle, this is an entry-point indexation flow in the ingestion side of the pipeline. In the larger plan-retrieve-synthesize chain described by the parent agent, it sits squarely in the retrieve preparation stage: it prepares source content for later retrieval by the separate `Knowledge Chatbot` flow, which queries the shared vector index at runtime to synthesize grounded answers.

## When To Use
- Use when your knowledge base should be built or refreshed from files stored in Microsoft OneDrive Business.
- Use when the source material consists of supported document formats such as `PDF`, `DOCX`, `TXT`, `PPTX`, or `MD`.
- Use when you want incremental synchronization rather than reprocessing the entire source from scratch on every run.
- Use when the chatbot should answer questions using internal documents that live in a specific OneDrive drive or folder.
- Use when an operator or scheduled automation needs to keep the vector index aligned with changes in OneDrive.

## When Not To Use
- Do not use when the source content lives in another system such as Google Drive, SharePoint, Amazon S3, Postgres, or a website; use the sibling indexation flow for that source instead.
- Do not use when no valid OneDrive credentials have been configured for the trigger.
- Do not use when you need to ingest unsupported file types outside the configured glob patterns.
- Do not use when you are trying to answer a user question directly; the `Knowledge Chatbot` flow is the correct runtime flow for retrieval and response generation.
- Do not use when the vector database destination has not been selected or provisioned.
- Do not use when the required documents are outside the configured `drive_name` and `folder_path` scope.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | OneDrive authentication credentials used by the trigger to access Microsoft OneDrive Business. |
| `drive_name` | `text` | Yes | Name of the Microsoft OneDrive drive containing the files. For most accounts this is `OneDrive`. |
| `folder_path` | `text` | Yes | Folder path within the drive to search. Use `.` to search broadly, or an absolute-style path such as `./FolderName/SubfolderName`. |

Below the trigger-level inputs, this flow also requires private configuration on downstream nodes:

| Field | Type | Required | Description |
|---|---|---|---|
| `embeddingModelName` | `model` | Yes | Embedding model used by `Vectorize` to convert text chunks into vector representations. |
| `vectorDB` | `select` | Yes | Target vector database used by `Index` to store vectors and metadata. |

The flow assumes the OneDrive connector can authenticate successfully and that `drive_name` and `folder_path` resolve to an accessible location. `folder_path` expects either `.` or a path beginning with `./`. The trigger is configured to scan files matching `**/*.pdf`, `**/*.docx`, `**/*.txt`, `**/*.pptx`, and `**/*.md`. Incremental sync is enabled, so only newly detected or changed files are expected to be processed on subsequent runs.

## Outputs
| Field | Type | Description |
|---|---|---|
| `vectors` | `array` | Vector embeddings produced from the chunked OneDrive document content and passed into the indexing step. |
| `metadata` | `array` | Normalized metadata records produced for the indexed chunks, including source-related fields derived from the OneDrive file. |
| `title` | `string` | Working metadata value derived from `triggerNode_1.output.document_key`. |
| `last_modified` | `string` | Working metadata value derived from `triggerNode_1.output._ab_source_file_last_modified`. |
| `source` | `string` | Working metadata value derived from `triggerNode_1.output._ab_source_file_url`. |

The operational result of this flow is a successful write into the configured vector store rather than a rich end-user response payload. Internally, data moves through structured objects and arrays: raw file content from the trigger, chunk lists from `Chunking`, transformed chunk text from `Get Chunks`, embedding arrays from `Vectorize`, and metadata objects from `Transform Metadata`. Depending on how the flow is invoked in Lamatic, the externally visible response may be minimal, with the authoritative outcome being the indexed state in the vector database.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point ingestion flow.
- It does not require another Lamatic flow to run before it, but it does require accessible content in Microsoft OneDrive Business and valid OneDrive credentials.

### Downstream Flows
- `Knowledge Chatbot` — consumes the indexed knowledge produced by this flow indirectly through the shared vector database.
  - Required downstream data: vectorized document chunks and associated metadata written by `Index`.
  - Specific fields relied on conceptually: stored vectors from `vectorizeNode_639.output.vectors` and stored metadata from `codeNode_507.output.metadata` after they are persisted to the selected vector store.

### External Services
- Microsoft OneDrive Business connector — reads files and file metadata from the configured drive and folder path — requires configured `credentials` on `triggerNode_1`.
- Embedding model provider — converts chunked text into embeddings — requires the selected `embeddingModelName` on `vectorizeNode_639` and whatever provider credentials that model integration needs in the Lamatic workspace.
- Vector database — stores embeddings and metadata for retrieval — requires the selected `vectorDB` connection on `IndexNode_622`.
- Script runtime for `@scripts/onedrive_get-chunks.ts` — reshapes chunk output for embedding — used by `codeNode_254`.
- Script runtime for `@scripts/onedrive_transform-metadata.ts` — reshapes metadata for indexing — used by `codeNode_507`.

### Environment Variables
- No flow-specific environment variables are declared in the exported TypeScript for this flow.
- Provider-specific secrets may still be required by the selected embedding model and vector database integrations, but they are not named in this flow definition.

## Node Walkthrough
1. `Onedrive Business` (`triggerNode`)
   - This is the entry point of the flow. It connects to Microsoft OneDrive Business using the selected `credentials`, scans the configured `drive_name` and `folder_path`, and reads supported files matching the built-in glob patterns for `PDF`, `DOCX`, `TXT`, `PPTX`, and `MD`.
   - The trigger is configured with `strategy` set to `auto` and `syncMode` set to `incremental`, so it is intended to process changes over time rather than always rebuilding from scratch.
   - It also exposes file-level fields used later in metadata mapping, including content, document key, file URL, and last modified timestamp.

2. `Variables` (`variablesNode`)
   - This node maps selected fields from the trigger output into a cleaner working structure.
   - It creates `title` from `triggerNode_1.output.document_key`, `last_modified` from `triggerNode_1.output._ab_source_file_last_modified`, and `source` from `triggerNode_1.output._ab_source_file_url`.
   - These values become the canonical metadata inputs used downstream when metadata is normalized for indexing.

3. `Chunking` (`dynamicNode` with `chunkNode`)
   - This node takes the raw file text from `triggerNode_1.output.content` and splits it into smaller chunks suitable for semantic retrieval.
   - It uses a recursive character text splitter with `numOfChars` set to `500`, `overlapChars` set to `50`, and separators of paragraph breaks, line breaks, and spaces.
   - The purpose is to produce chunks that are small enough for effective embedding and retrieval while preserving context across chunk boundaries through overlap.

4. `Get Chunks` (`dynamicNode` with `codeNode`)
   - This code step runs the referenced script `@scripts/onedrive_get-chunks.ts`.
   - Its role is to transform the chunking output into the exact text array or structure expected by the embedding step.
   - In practical terms, this is the bridge between Lamatic's chunking output and the `Vectorize` node's `inputText` field, which is wired to `codeNode_254.output`.

5. `Vectorize` (`dynamicNode` with `vectorizeNode`)
   - This node converts the prepared chunk text from `Get Chunks` into vector embeddings using the selected `embeddingModelName`.
   - Its output includes `vectors`, which are the numeric semantic representations ultimately stored in the vector database.
   - This is the step that makes OneDrive content retrievable by semantic similarity in the chatbot flow.

6. `Transform Metadata` (`dynamicNode` with `codeNode`)
   - This code step runs `@scripts/onedrive_transform-metadata.ts`.
   - It reshapes and aligns metadata into the format required by the indexing node, likely combining the working variables and file-level context into chunk-level metadata records.
   - The resulting `metadata` output is passed directly to the indexer.

7. `Index` (`dynamicNode` with `IndexNode`)
   - This node writes the vectors and transformed metadata into the selected `vectorDB`.
   - It receives vectors from `vectorizeNode_639.output.vectors` and metadata from `codeNode_507.output.metadata`.
   - The configured `primaryKeys` value is `file_name`, and `duplicateOperation` is `overwrite`, which means matching indexed records are replaced when duplicates are detected on that key.
   - This is the persistence step that makes the ingested OneDrive content available to downstream retrieval.

8. `addNode` (`addNode`)
   - This is a terminal placeholder node with no configured business logic.
   - It marks the end of the current flow graph and does not add additional processing.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow fails immediately at the trigger. | Missing, expired, or invalid OneDrive `credentials`. | Reconfigure the `credentials` input with a valid Microsoft OneDrive Business connection and verify access to the target drive. |
| No files are ingested even though the flow runs. | `drive_name` or `folder_path` is incorrect, inaccessible, or points to an empty location. | Confirm the exact drive name, verify the path format such as `.` or `./Folder/Subfolder`, and ensure the authenticated account can access that location. |
| Expected documents are skipped. | Files do not match the configured glob patterns or are in unsupported formats. | Ensure documents are one of the supported file types: `pdf`, `docx`, `txt`, `pptx`, or `md`, or update the flow configuration if broader support is needed. |
| The flow runs but nothing new is indexed. | Incremental sync found no changes since the last successful sync. | Verify that source files were created or modified, or reset sync state if a full reindex is required operationally. |
| Chunking or vectorization fails on specific files. | Extracted content is empty, malformed, or too noisy for downstream processing. | Inspect the affected source files, confirm they contain extractable text, and test with a simpler document to isolate parsing issues. |
| The embedding step fails. | `embeddingModelName` was not selected or the underlying model provider is unavailable. | Select a valid embedding model and verify that the corresponding provider integration is configured and healthy in the Lamatic workspace. |
| Indexing fails at the final step. | `vectorDB` is missing, unreachable, or incompatible with the metadata/vector payload. | Select a valid vector database connection, confirm it is provisioned, and verify the index schema can accept the generated vectors and metadata. |
| Reindexed content overwrites existing records unexpectedly. | The `Index` node is configured with `duplicateOperation` set to `overwrite` and `primaryKeys` set to `file_name`. | If overwrite behavior is undesirable, change duplicate handling or use a more specific primary key strategy that distinguishes file versions or chunks. |
| The chatbot cannot answer from OneDrive content after this flow ran. | The indexation flow did not complete successfully, indexed the wrong vector store, or metadata/content was empty. | Verify successful completion of `Index`, ensure the same vector database is used by the downstream `Knowledge Chatbot` flow, and confirm vectors and metadata were written correctly. |
| Metadata fields such as source URL or last modified date are blank. | Trigger output fields were unavailable for the ingested file or the metadata transform script did not map them as expected. | Inspect trigger output for `_ab_source_file_url`, `_ab_source_file_last_modified`, and `document_key`, then review the transform scripts if customization is needed. |

## Notes
- This flow is one of several sibling ingestion flows in the Knowledge Chatbot bundle. Operationally, teams should run exactly the source-specific flow that matches their repository of truth, then use the shared chatbot flow for querying.
- The trigger is scheduled with the cron expression `0 0 00 ? * 1 * UTC`, indicating a weekly schedule at midnight UTC on day `1` in the configured cron semantics. Validate schedule behavior in your Lamatic environment if timing is important.
- The trigger also carries `days_to_sync_if_history_is_full` set to `3`, which suggests the connector has bounded historical catch-up behavior when sync history is saturated.
- Chunk size and overlap are fixed in this export at `500` characters with `50` characters of overlap. These defaults are reasonable for general-purpose retrieval, but may need tuning for very long-form documents or highly structured content.
- The index uses `file_name` as its primary key. Depending on how the metadata script structures records, this may be too coarse if multiple chunks from the same file need unique identities. Review the metadata and indexing strategy carefully before relying on overwrite behavior in production.