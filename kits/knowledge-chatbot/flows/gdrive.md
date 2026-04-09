# GDrive
A Google Drive indexation flow that ingests documents from a selected Drive folder, converts them into vector embeddings, and stores them in the shared knowledge index used by the wider RAG system.

## Purpose
This flow is responsible for the Google Drive ingestion slice of the knowledge pipeline. It connects to a configured Drive folder, reads document content exposed by the Google Drive trigger, enriches that content with lightweight metadata, splits it into retrieval-friendly chunks, generates embeddings for those chunks, and writes the resulting vectors plus metadata into a selected vector database.

The outcome is an indexed corpus derived from Google Drive content, keyed in a way that supports overwrite-on-duplicate updates. That matters because the parent agent system depends on a searchable vector store before the `Knowledge Chatbot` flow can retrieve relevant context and produce grounded answers. Without flows like this one, the chatbot has no internal knowledge base to search.

Within the broader pipeline, this flow sits squarely in the ingestion and indexing stage of the RAG architecture described by the parent agent. It does not answer user questions directly. Instead, it prepares Google Drive content so downstream retrieval and synthesis components can use it later during query-time response generation.

## When To Use
- Use when the source material to be indexed lives in a Google Drive folder.
- Use when you are setting up or refreshing the knowledge base for the RAG system with Drive-hosted documents.
- Use when operators want scheduled or repeatable ingestion from Google Drive rather than one-off manual text upload.
- Use when a vector database has already been selected and you want Drive content embedded into that shared index.
- Use when the downstream `Knowledge Chatbot` flow should be able to answer questions grounded in documents stored in Google Drive.

## When Not To Use
- Do not use when the source content is in a different system such as Google Sheets, OneDrive, SharePoint, S3, Postgres, or a crawled website; use the sibling indexation flow for that source instead.
- Do not use when Google Drive credentials have not been configured or cannot access the target folder.
- Do not use when no vector database destination is available, because the flow’s final purpose is indexing rather than ad hoc extraction.
- Do not use when you need direct question answering; this flow prepares data for retrieval, while the `Knowledge Chatbot` flow handles query-time answering.
- Do not use when the input is a single arbitrary file payload or freeform text body rather than a Google Drive folder selection.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Google Drive credential selection used to authenticate access to the Google Drive API. |
| `folderUrl` | `resourceLocator` | Yes | Target Google Drive folder to ingest. Supports either selecting from a loaded folder list or supplying a folder URL directly. |
| `mapping.source` | `string` | Yes | Source value used by the `Variables` node as part of metadata mapping. In this flow export, it represents the canonical folder URL recorded as source metadata. |
| `vectorDB` | `select` | Yes | Vector database destination where embeddings and metadata are indexed. |
| `embeddingModelName` | `model` | Yes | Text embedding model used to convert extracted chunk text into vector representations. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The `folderUrl` field must resolve to a Google Drive folder that the selected `credentials` can access. It can be provided either as a picker-backed list selection or as a direct URL, but the URL must be a valid Google Drive folder locator. The metadata mapping expects a `source` key and the flow itself also derives `title` from `triggerNode_1.output.document_key`. The embedding model must be compatible with `embedder/text`, and the chosen `vectorDB` must be a configured Lamatic-supported vector store connection.

## Outputs
| Field | Type | Description |
|---|---|---|
| `vectors` | `array` | Vector embeddings prepared for indexing, produced after chunk extraction, embedding, and metadata transformation. |
| `metadata` | `array` | Metadata objects aligned to the vectors being indexed, including title and source-oriented document context. |
| `indexingResult` | `object` | Effective outcome of the `Index to DB` node writing records into the selected vector database. Exact provider-specific response fields are not defined in the export. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

The operational output of this flow is best understood as an indexing side effect plus a structured indexing result from the final database write. Internally, the data passed toward indexing is collection-shaped: a set of chunk vectors and a parallel set of metadata records. The exact API response surface is not explicitly defined in the export, so consumers should treat the primary success condition as successful completion of the index write rather than rely on a richly standardized response payload.

## Dependencies
### Upstream Flows
This is a standalone ingestion entry-point flow within the bundle. No other flow must run before it.

Within the broader agent system, operators run this flow before the retrieval flow becomes useful. Conceptually, it must have produced indexed vectors and metadata in the shared vector store so that the downstream `Knowledge Chatbot` flow can retrieve relevant Google Drive content later. There is no upstream Lamatic flow whose output fields are consumed directly here; instead, this flow starts from its own Google Drive trigger inputs.

### Downstream Flows
- `Knowledge Chatbot` — consumes the indexed corpus created by this flow from the shared vector database during retrieval. It depends on the presence of embedded chunks and associated metadata, not on a direct synchronous handoff payload.

No other direct downstream flow dependency is encoded in this flow export.

### External Services
- Google Drive API — used to access folder content and document payloads via the `Google Drive` trigger — required credential: configured Google Drive `credentials`
- Embedding model provider — used by `Get Vectors` to convert chunk text into embeddings — required credential or configuration: selected `embeddingModelName` model connection
- Vector database — used by `Index to DB` to persist vectors and metadata for later retrieval — required credential or configuration: selected `vectorDB`
- Custom Lamatic code scripts — used by `Extract Chunked Text` and `Transform Metadata` to reshape chunk text and metadata — no separate external credential shown in the export

### Environment Variables
- No explicit environment variables are referenced in the flow export.

## Node Walkthrough
1. `Google Drive` (`triggerNode`) starts the flow by authenticating with the selected Google Drive credentials and targeting the chosen folder. It is configured for `incremental_append`, which indicates that new or changed content is appended into the indexing process over time rather than rebuilding everything in-place each run. A weekly cron expression is also configured, so this trigger is intended to support scheduled synchronization.

2. `Variables` (`variablesNode`) creates a small metadata mapping object for the current document stream. In this flow, it sets `title` from `triggerNode_1.output.document_key` and sets `source` to a Google Drive folder URL. This metadata is later used to align chunks and vectors with document identity and provenance.

3. `chunking` (`chunkNode`) splits `triggerNode_1.output.content` into retrievable segments. It uses recursive character splitting with a target size of `500` characters, `50` characters of overlap, and separators in descending granularity: double newline, single newline, then space. This produces chunk boundaries suitable for embedding and later semantic retrieval.

4. `Extract Chunked Text` (`codeNode`) runs the `@scripts/gdrive_extract-chunked-text.ts` script. Its purpose, based on the node wiring, is to take the chunking output and extract or normalize the text payload into the exact list format expected by the embedding node.

5. `Get Vectors` (`vectorizeNode`) sends the extracted chunk text from `codeNode_539.output` to the selected embedding model. It returns vector representations for each chunk so the content can be stored semantically rather than as plain text only.

6. `Transform Metadata` (`codeNode`) runs the `@scripts/gdrive_transform-metadata.ts` script after embeddings are created. Based on its downstream mappings, this script combines embedding output with the earlier variables-derived metadata and reshapes the result into two aligned fields: `vectors` and `metadata`.

7. `Index to DB` (`IndexNode`) writes the transformed `vectors` and `metadata` into the selected vector database. It uses `title` as the primary key and applies `overwrite` duplicate handling, meaning an incoming record with the same key replaces the existing one rather than creating a second copy.

8. `addNode` (`addNode`) is an empty trailing placeholder node from the Studio export. It does not contribute business logic and can be treated as a terminator with no additional processing.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Authentication fails at start | `credentials` are missing, expired, or lack Drive access | Reconfigure the Google Drive credential and verify it has permission to the selected folder. |
| Folder cannot be resolved | `folderUrl` is invalid, points to a non-folder resource, or is inaccessible to the credential | Use the list selector where possible, or provide a valid Google Drive folder URL that the credential can open. |
| Flow runs but indexes nothing | The Drive folder is empty, no supported content is exposed by the trigger, or incremental sync found no new items | Confirm the folder contains ingestible documents and test with content changes or a known-populated folder. |
| Chunking or extraction produces empty text | `triggerNode_1.output.content` is empty or the extraction script cannot parse the upstream structure | Inspect the Drive trigger output shape and verify the `gdrive_extract-chunked-text` script matches the content payload being emitted. |
| Embedding step fails | `embeddingModelName` is not configured correctly, the model is unavailable, or the chunk text shape is invalid | Choose a valid text embedding model, confirm provider access, and verify the extraction node returns plain text items in the expected format. |
| Index write fails | `vectorDB` is missing, unreachable, or incompatible with the vector and metadata payload | Verify the vector database connection, schema expectations, and any provider-side limits for vectors or metadata fields. |
| Existing records are unexpectedly replaced | Duplicate handling is configured as `overwrite` with `title` as the primary key | Ensure `title` is sufficiently unique, or adjust key strategy if multiple documents can share the same document key. |
| Downstream retrieval finds no Google Drive knowledge | This flow has not run successfully, or it indexed into a different vector database than the chatbot uses | Run the flow to completion and confirm both ingestion and retrieval flows point to the same shared vector store. |

## Notes
- The flow metadata name includes a trailing space in the source export (`GDrive `), but the canonical flow name should be treated as `GDrive`.
- The `Variables` node hardcodes the `source` URL in the exported configuration. If operators change the selected Drive folder without updating this mapping behavior, indexed metadata may report a stale source URL.
- The trigger is configured with a cron expression of `0 0 00 ? * 1 * UTC`, which indicates a scheduled weekly run. Operators should verify the intended schedule semantics in their Lamatic environment.
- Because chunking is character-based rather than structure-aware, formatting-heavy documents may split at semantically awkward points. The `50`-character overlap partially mitigates this but does not eliminate it.
- The export includes a `webhookURL` on `Index to DB`, but this flow description does not assume it is part of the public invocation contract because the node wiring shows the primary purpose is database indexing.