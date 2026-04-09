# GSheet
A flow that ingests rows from a Google Sheet, transforms them into vector-ready chunks with metadata, and indexes them into the shared knowledge store used by the wider internal RAG system.

## Purpose
This flow is responsible for syncing structured content from Google Sheets into a vector database so that spreadsheet data can participate in semantic retrieval. It solves the ingestion side of the problem for teams that keep operational knowledge, FAQs, inventories, process tables, or lightweight datasets in Google Sheets rather than in documents, websites, or file storage systems.

The outcome of the flow is a set of embedded chunks plus normalized metadata written into a configured vector store. That matters because the assistant flows in this kit depend on a populated, searchable index to retrieve grounded context before generating answers. Without flows like this one, the downstream chat assistants would have no representation of spreadsheet content and could not answer questions based on it.

In the broader architecture, this is an entry-point indexation flow in the ingest half of the pipeline described by the parent agent. It sits before retrieval and synthesis: first it reads a selected Google Sheet, then it maps and chunks row content, then it generates embeddings, and finally it indexes vectors and metadata. The assistant flows that run later use the resulting vector index during the retrieve stage of RAG, after which a response is synthesized for the user in web, Slack, or Teams channels.

## When To Use
- Use when the source content you want searchable is stored in Google Sheets.
- Use when spreadsheet rows contain business knowledge that should be retrievable by downstream RAG assistants.
- Use when you need recurring synchronization from a specific spreadsheet and sheet tab rather than a one-time manual export.
- Use when you want Google Sheets content embedded into the same vector database as other internal knowledge sources.
- Use when the broader internal assistant has already been chosen as the consumer of indexed knowledge and this sheet is one of the intended ingestion sources.

## When Not To Use
- Do not use when the source data lives in Google Drive documents, OneDrive, SharePoint, S3, Postgres, or web pages; those sibling indexation flows are a better fit.
- Do not use when no Google Sheets credentials are available or the selected credentials do not grant access to the target spreadsheet.
- Do not use when you need direct row-level transactional processing rather than semantic indexing for retrieval.
- Do not use when the spreadsheet link is missing, malformed, or points to a sheet the connector cannot read.
- Do not use when no vector database has been configured, because the flow’s final output is written to a vector store.
- Do not use when the downstream need is immediate answer generation; this flow only prepares indexed knowledge and does not answer user questions itself.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Google Sheets authentication credentials used by the trigger connector to access the spreadsheet. |
| `spreadSheetLink` | `text` | Yes | The full Google Sheets URL for the spreadsheet to sync. This is mapped to the spreadsheet identifier used by the connector. |
| `sheetName` | `resourceLocator` | Yes | The specific sheet tab inside the spreadsheet to sync. It can be selected from a discovered list or entered manually. |
| `mapping` | `variablesInput` | Yes | A mapping object that supplies values for `title` and `source` used downstream during row transformation and metadata shaping. |
| `embeddingModelName` | `model` | Yes | The embedding model used to convert chunked row text into vectors. |
| `vectorDB` | `select` | Yes | The target vector database where vectors and metadata will be indexed. |

Below the table, note these input constraints and assumptions:

- `spreadSheetLink` is expected to be a valid Google Sheets share URL, not an arbitrary web link.
- `sheetName` must match an accessible tab in the referenced spreadsheet; list mode depends on connector discovery, while manual mode depends on an exact user-provided value.
- `mapping` must provide both `title` and `source`. The exported default maps `title` to `Data` and `source` to `Google Sheets`.
- `embeddingModelName` must be an embedding-capable model of type `embedder/text`.
- `vectorDB` must point to a supported and reachable vector store configured in the Lamatic workspace.
- The flow is configured for incremental append synchronization at the source connector level, so source-side change handling follows connector behavior rather than custom flow logic.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` | An implicit execution result indicating whether the indexing run completed successfully or failed. |
| `indexedCount` | `number` | The number of vector records successfully written, if surfaced by the runtime or index node response. |
| `vectors` | `array` | The vector payload produced after chunking and embedding, passed internally into the index node. |
| `metadata` | `array` | The normalized metadata objects paired with vectors for indexing. |

Below the table, the practical output shape is best understood as an indexing operation result rather than a rich user-facing payload. Internally, the flow produces chunk text, embeddings, and metadata arrays, then passes those into the indexer. Externally, operators should expect a success or failure outcome and, depending on runtime behavior, indexing diagnostics such as how many records were written.

This flow is not designed to return prose, extracted spreadsheet rows, or retrieval-ready answers to an end user. Its meaningful artifact is the side effect of having populated the configured vector database with Google Sheets content.

## Dependencies
### Upstream Flows
- This is a standalone entry-point ingestion flow. No other Lamatic flow must run before it.
- It does, however, depend on configuration state being ready before execution:
  - valid Google Sheets `credentials`
  - a reachable `spreadSheetLink`
  - a valid `sheetName`
  - a configured `embeddingModelName`
  - a configured `vectorDB`
- Within the wider bundle, this flow participates in the indexing stage that precedes all assistant flows, but it does not consume outputs from another flow.

### Downstream Flows
- The assistant flows in the parent `Internal Assistant` bundle depend indirectly on this flow’s side effects.
- Downstream RAG assistant flows consume the indexed content from the shared vector database rather than calling this flow directly.
- The specific data they rely on is the vectorized chunk content and associated metadata written by this flow, especially fields derived from `title`, `source`, and row content.

### External Services
- Google Sheets connector — reads spreadsheet data from the selected spreadsheet and tab — requires Google Sheets `credentials`.
- Embedding model provider — converts chunked row text into embeddings — requires the selected `embeddingModelName` to be available in the Lamatic project.
- Vector database — stores vectors and metadata for later retrieval — requires `vectorDB` configuration.
- Webhook endpoint — a webhook URL is configured on the index node, likely for callback or debugging behavior — no separate user-supplied credential is exposed in this flow.

### Environment Variables
- No explicit environment variables are declared in the exported flow definition.
- Any connector- or model-level secrets are abstracted behind Lamatic-managed inputs such as `credentials`, `embeddingModelName`, and `vectorDB` rather than referenced as named environment variables inside the flow.

## Node Walkthrough
1. `Google Sheets` (`triggerNode`) starts the flow by connecting to Google Sheets with the selected `credentials`, reading the spreadsheet identified by `spreadSheetLink`, and targeting the chosen `sheetName`. It is configured for `incremental_append`, with a batch size of `200`, so ingestion is intended to process source records in batches and append newly seen data over time.

2. `Variables` (`variablesNode`) establishes a simple mapping object for downstream processing. In the exported configuration it defines `title` as `Data` and `source` as `Google Sheets`. These values act as normalized context that later scripts can attach to the chunked and indexed records.

3. `Row Chunking` (`codeNode`) runs the referenced script `@scripts/gsheet_row-chunking.ts`. This script receives the sheet data from the trigger plus the variable mapping from `Variables`, then transforms spreadsheet rows into chunkable text. In practice, this is the point where structured row data is reshaped into textual content suitable for embeddings.

4. `Vectorise` (`dynamicNode`) takes the text output from `Row Chunking` through `inputText` set to `{{codeNode_331.output}}`. It sends that text to the selected embedding model and returns vector representations for each chunked row or row-derived text segment.

5. `Transform Metadata` (`codeNode`) runs `@scripts/gsheet_transform-metadata.ts`. This script combines prior outputs into the exact shape required by the indexer, producing at least two internal fields: `vectors` and `metadata`. This is where embeddings are paired with normalized metadata, likely including the mapped `title` and `source` values and any source-specific row identifiers or content descriptors the script derives.

6. `Index to DB` (`IndexNode`) writes the prepared records into the selected vector database. It receives vectors from `{{codeNode_443.output.vectors}}` and metadata from `{{codeNode_443.output.metadata}}`. It uses `title` and `content` as `primaryKeys`, and its duplicate handling is set to `overwrite`, meaning matching records are replaced rather than duplicated when the key combination collides.

7. `addNode` (`addNode`) is a terminal placeholder node with no configured business logic. It marks the end of the execution path after indexing completes.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow fails immediately at startup | `credentials` were not selected or are invalid for Google Sheets access | Reconfigure the Google Sheets credential and verify it can read the target spreadsheet. |
| The spreadsheet cannot be found | `spreadSheetLink` is malformed, points to the wrong file, or the file is no longer accessible | Paste the full share link again, confirm the spreadsheet exists, and ensure the authenticated account has permission. |
| The sheet tab cannot be loaded or synced | `sheetName` does not match an existing tab or the discovery list is stale | Re-select the sheet from list mode or enter the exact tab name manually. |
| The run completes with no useful indexed content | The selected sheet is empty, contains unsupported structure for the chunking script, or produced empty text after transformation | Inspect the source sheet contents, confirm rows contain meaningful data, and validate the row chunking script assumptions. |
| Embedding generation fails | `embeddingModelName` was not configured, is unavailable, or is incompatible with text embedding | Choose a valid `embedder/text` model available in the current Lamatic workspace. |
| Indexing fails after embeddings are created | `vectorDB` is missing, misconfigured, unreachable, or incompatible with the payload shape | Verify vector database configuration, connectivity, and expected schema in the Lamatic project. |
| Existing records keep being replaced | Duplicate handling is set to `overwrite` and `primaryKeys` of `title` plus `content` are colliding | Adjust source data or metadata generation if overwrites are unintended, or change duplicate strategy in the flow if supported. |
| The indexed data lacks expected metadata fields | The `mapping` input was changed incorrectly or the metadata transform script expects fields not being provided | Restore or correct the `mapping` object and validate assumptions in `gsheet_transform-metadata.ts`. |
| Downstream assistants cannot answer questions from the sheet even though the flow ran | The flow wrote no useful records, wrote to the wrong vector database, or the retrieval assistant is configured against a different index | Confirm the correct `vectorDB` was used, verify records exist, and ensure the assistant flow retrieves from the same vector store. |
| Incremental sync misses expected updates | Source connector incremental behavior does not interpret the sheet changes as new appendable records | Review connector sync semantics, rerun a fuller sync if needed, or adjust source update practices. |

## Notes
- The flow name in metadata includes a trailing space as exported: `GSheet `. For documentation purposes, the canonical name is presented as `GSheet`.
- Although the source connector is configured with a daily cron expression, the exported flow definition here documents the flow behavior rather than operational scheduling guarantees. Verify deployment-time scheduler settings in Lamatic before relying on automated refresh.
- The real chunking and metadata semantics are defined in the referenced scripts `gsheet_row-chunking.ts` and `gsheet_transform-metadata.ts`. This document reflects their role and interfaces as exposed by the flow wiring, not their hidden implementation details.
- `primaryKeys` are set to `title` and `content`. Because the default `title` mapping is static (`Data`), uniqueness may depend heavily on content-level variation unless the transform script augments record identity.
- This flow is optimized for indexation, not for preserving spreadsheet structure exactly as-is. If consumers later need row-accurate reconstruction, ensure the metadata transform script stores enough source identifiers to trace chunks back to original rows.