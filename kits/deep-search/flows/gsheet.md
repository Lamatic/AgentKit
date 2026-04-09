# GSheet
A flow that ingests rows from a Google Sheet, converts them into vector-searchable documents, and maintains an internal index used by the wider Deep Research retrieval pipeline.

## Purpose
This flow is responsible for **indexing Google Sheets content** into a configured vector database so that spreadsheet data can be searched later as internal knowledge. It connects to a specific spreadsheet and sheet tab, reads rows on a scheduled sync, reshapes the row data into chunkable text, generates embeddings, attaches normalized metadata, and writes the result into a vector index with deterministic overwrite behavior for duplicates.

The outcome of this flow is a refreshed vectorized representation of spreadsheet content, keyed in a way that supports repeatable re-indexing. That matters because the broader agent system depends on reliable internal retrieval when answering research questions against organizational data. Without this indexing step, spreadsheet-based knowledge remains inaccessible to downstream search flows.

In the wider Deep Research architecture, this flow sits in the internal knowledge preparation layer rather than the interactive reasoning path. It is not a plan-generation or answer-synthesis flow. Instead, it runs before retrieval-time flows so those flows can query an up-to-date vector store populated with Google Sheets content alongside other indexed enterprise sources.

## When To Use
- Use when a team wants Google Sheets data to be searchable as part of the system’s internal knowledge base.
- Use when a spreadsheet is a source of business facts, lookup tables, operational records, or structured notes that downstream research flows should retrieve.
- Use when onboarding a new Google Sheet into the Deep Research environment.
- Use when spreadsheet contents change regularly and need scheduled re-indexing.
- Use when a downstream internal search flow depends on vectorized spreadsheet content being present in the configured vector database.
- Use when operators need overwrite-style re-indexing for the same logical records based on stable primary fields.

## When Not To Use
- Do not use when the target data source is not Google Sheets; use the corresponding indexation flow for Google Drive, SharePoint, OneDrive, S3, Postgres, or another supported connector instead.
- Do not use when the goal is to answer a user question directly; this flow prepares data and does not return a synthesized research answer.
- Do not use when no vector database has been configured, because the flow’s final indexing step requires a destination store.
- Do not use when valid Google Sheets credentials are unavailable or the spreadsheet is not shared appropriately with the configured account.
- Do not use when the spreadsheet link or sheet name is malformed or unknown.
- Do not use when the desired operation is ad hoc spreadsheet reading for one-off inspection rather than persistent indexing.
- Do not use if downstream retrieval has not been designed to query the vector index; in that case indexing provides no immediate value.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Google Sheets authentication credentials used by the trigger connector to access the spreadsheet. |
| `spreadSheetLink` | `text` | Yes | URL of the Google spreadsheet to sync. This is mapped to the connector’s spreadsheet identifier configuration. |
| `sheetName` | `resourceLocator` | Yes | Name of the sheet tab inside the spreadsheet to sync. Can be selected from a loaded list or entered directly. |
| `mapping` | `variablesInput` | Yes | Variable mapping used inside the flow to provide document-level metadata fields. This flow expects keys `title` and `source`. |
| `embeddingModelName` | `model` | Yes | Embedding model used to convert chunked row text into vector representations. |
| `vectorDB` | `select` | Yes | Target vector database where generated vectors and metadata will be indexed. |

The spreadsheet input is expected to be a valid Google Sheets URL, not an arbitrary document link. The `sheetName` must correspond to an existing tab in that spreadsheet. The `mapping` payload is designed around two keys, `title` and `source`, and the default configuration sets them to `Data` and `Google Sheets` respectively. The flow assumes the selected embedding model supports text embedding and that the chosen vector store is compatible with Lamatic’s indexing node.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` | High-level indication that indexing completed, failed, or partially succeeded, as provided by the runtime/indexing layer. |
| `indexedCount` | `number` | Number of vector records written or updated in the destination vector database, if exposed by the runtime. |
| `result` | `object` | Implementation-dependent response from the final indexing node, typically containing indexing operation details. |

This flow is an ingestion pipeline rather than a user-facing answer flow, so its response is operational in nature. In practice, the returned payload comes from the indexing stage and should be treated as a structured status object rather than a semantic content result. Exact response fields can vary by runtime and vector database integration; the canonical durable outputs of the flow are the vectors and metadata persisted in the configured index.

## Dependencies
### Upstream Flows
- This flow has no mandatory upstream flow dependency. It is an indexation entry flow that can be run independently by an operator or scheduler.
- In the broader kit, it belongs to the indexing layer that must complete before internal retrieval flows can make use of Google Sheets content.
- Conceptually, downstream internal search flows depend on this flow having already produced indexed spreadsheet embeddings in the vector database, even though they do not invoke it directly in-process.

### Downstream Flows
- Internal data-source retrieval flows in the Deep Research kit consume the vector database contents produced by this flow.
- Those downstream flows do not read a direct API field from this flow; instead they rely on the persisted indexed records written from `vectorsField` and `metadataField` into the configured vector store.
- Final synthesis flows benefit indirectly because retrieval flows can surface spreadsheet-backed evidence only after this flow has populated the index.

### External Services
- Google Sheets API via Lamatic connector — reads spreadsheet rows from the configured document and sheet tab — requires selected `credentials`
- Embedding model provider — converts row chunks into vector embeddings — requires selected `embeddingModelName` provider credentials configured in Lamatic
- Vector database — stores embeddings and metadata for later retrieval — requires selected `vectorDB`
- Lamatic execution/runtime services — orchestrate scheduled sync, node execution, and indexing — requires the project’s Lamatic deployment configuration

### Environment Variables
- No flow-specific environment variables are declared in the flow source.
- Platform-level Lamatic environment configuration may still be required at deployment time, but no node in this flow references a named environment variable directly.

## Node Walkthrough
1. `Google Sheets` (`triggerNode`) starts the flow by connecting to the configured spreadsheet using the selected `credentials`, `spreadSheetLink`, and `sheetName`. It is configured for `incremental_append` sync with a batch size of `200` and a daily cron schedule of `0 0 00 1/1 * ? * UTC`, so it is intended to keep the spreadsheet index refreshed over time rather than only on manual invocation.

2. `Variables` (`variablesNode`) injects operator-configured metadata mappings into the pipeline. By default, it defines `title` as `Data` and `source` as `Google Sheets`. These values are later used when building metadata records for each indexed item, ensuring that downstream retrieval can identify the origin and logical label of the content.

3. `Row Chunking` (`codeNode`) runs the custom script `@scripts/gsheet_row-chunking.ts`. This node transforms the sheet rows pulled by the trigger into text chunks suitable for embedding. It combines the incoming spreadsheet data with the values prepared by `Variables`, producing the text payload exposed as `codeNode_331.output`, which becomes the direct input to embedding.

4. `Vectorise` (`vectorizeNode`) takes `{{codeNode_331.output}}` as `inputText` and uses the selected `embeddingModelName` to generate vector embeddings for the chunked row content. This is the step that turns spreadsheet rows into numerical representations that can later be searched semantically.

5. `Transform Metadata` (`codeNode`) runs the custom script `@scripts/gsheet_transform-metadata.ts`. It combines the embedding output with the chunked row context to produce two explicit structures for the indexer: `vectors` in `codeNode_443.output.vectors` and `metadata` in `codeNode_443.output.metadata`. This is where the flow normalizes what will be stored as searchable vectors and what will be stored as accompanying record metadata.

6. `Index to DB` (`IndexNode`) writes the prepared vectors and metadata into the selected `vectorDB`. It uses `title` and `content` as `primaryKeys`, which means duplicate detection is based on those fields, and its `duplicateOperation` is set to `overwrite`, so re-indexing the same logical content replaces prior records rather than creating uncontrolled duplicates.

7. The trailing `addNode` is only a canvas terminator/placeholder and does not add business logic. The effective work of the flow ends at `Index to DB`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Authentication error when the flow starts | `credentials` are missing, expired, revoked, or do not have access to the target spreadsheet | Reconnect or replace the Google Sheets credential and confirm the spreadsheet is shared with the authenticated account or service identity. |
| Spreadsheet cannot be found | `spreadSheetLink` is malformed, points to a non-Sheets document, or references a deleted file | Paste the full Google Sheets URL again and verify the document exists and is accessible. |
| Sheet tab cannot be found | `sheetName` does not match an existing tab, or the wrong mode/value was selected in the resource locator | Re-select the sheet from the loaded list or enter the exact tab name manually. |
| Flow runs but indexes no useful content | The selected sheet is empty, rows are malformed, or the row chunking script produces empty text | Verify the sheet contains data, inspect row shape, and review the `gsheet_row-chunking.ts` logic for assumptions about columns and formatting. |
| Embedding step fails | `embeddingModelName` is unset, misconfigured, or provider credentials are invalid | Select a valid text embedding model and verify the underlying model provider is configured in Lamatic. |
| Indexing fails at the final step | `vectorDB` is not configured correctly, is unavailable, or the metadata/vector payload shape is incompatible with the destination | Reconfigure the vector database connection, confirm the target index exists if required, and validate the metadata transform output. |
| Duplicate records overwrite unexpectedly | `primaryKeys` are `title` and `content`, causing records with the same values to be treated as the same item | Adjust upstream chunk/title generation if record uniqueness needs finer granularity, or revise index key strategy in the flow configuration. |
| Data changes in the spreadsheet are not reflected as expected | The trigger is configured as `incremental_append`, which may not behave like a full replacement sync for every change pattern | Confirm the connector’s sync semantics for the source data and consider whether the indexing logic or sync mode should be changed for update-heavy sheets. |
| Downstream internal search returns nothing from spreadsheets | This indexing flow has not run successfully yet, indexed the wrong vector DB, or stored records under unexpected metadata | Run and verify this flow first, ensure downstream retrieval points to the same vector store, and inspect stored metadata conventions. |
| Metadata fields are missing or incorrect in the vector store | The `mapping` values or the metadata transform script do not match the intended schema | Review the `mapping` input and the `gsheet_transform-metadata.ts` script to ensure `title`, `source`, and any derived fields are emitted correctly. |

## Notes
- The flow metadata name includes a trailing space in source configuration (`GSheet `), but the effective flow name should be treated as `GSheet` in documentation and operational references.
- The default metadata mapping is static: `title` is `Data` and `source` is `Google Sheets`. If richer per-row titles or source attribution are needed, they must be implemented in the transformation scripts or variable mapping strategy.
- The actual chunk structure and metadata schema are determined by the referenced scripts `gsheet_row-chunking.ts` and `gsheet_transform-metadata.ts`. Those scripts are authoritative for row serialization details.
- A `webhookURL` is present in the index node configuration, but the flow topology does not expose webhook-based behavior as part of the documented contract; operators should treat indexing into the vector store as the meaningful side effect.
- Because this flow is part of the kit’s internal knowledge preparation layer, it is usually operated by builders or administrators on a scheduled basis rather than by end users during an interactive research session.