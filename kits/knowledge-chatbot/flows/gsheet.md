# GSheet
A Google Sheets ingestion flow that reads rows from a selected sheet, chunks and embeds them, and writes the resulting vectors and metadata into the shared knowledge index used by the wider RAG system.

## Purpose
This flow is responsible for turning spreadsheet content stored in Google Sheets into retrievable vector records. In the broader kit, it solves the source-specific ingestion problem for tabular knowledge that lives in a sheet rather than in files, websites, or databases. It authenticates to Google Sheets, reads the configured spreadsheet and sheet, applies row-level transformation and chunking logic, generates embeddings for the resulting text, and indexes both vectors and metadata into the selected vector database.

The outcome is an indexed representation of spreadsheet data that can be retrieved semantically by downstream question-answering components. That matters because spreadsheet content often contains operational data, lookup tables, FAQs, catalog entries, or structured notes that end users may later ask about through the chatbot. Without this ingestion step, that content would remain outside the searchable knowledge base.

Within the wider RAG pipeline described in the parent agent, this flow sits squarely in the preparation stage of the retrieve-synthesize chain. It is an ingestion/indexation flow, not a conversational runtime flow. Its job is to populate the vector store so that the separate `Knowledge Chatbot` flow can later retrieve relevant chunks and synthesize grounded answers from them.

## When To Use
- Use when the source of truth is a Google spreadsheet and you want one specific sheet indexed into the knowledge base.
- Use when spreadsheet rows contain business data, support content, reference material, or structured notes that should be searchable via semantic retrieval.
- Use when you are setting up or refreshing the knowledge base for the RAG system and Google Sheets is one of the configured content sources.
- Use when you need incremental ingestion from Google Sheets rather than a one-off manual export-and-upload process.
- Use when your downstream chatbot or retrieval system depends on the vector database being populated with sheet-derived content.

## When Not To Use
- Do not use when the source content is a website, crawl target, document repository, object store, or database table handled by a sibling indexation flow in the same kit.
- Do not use when you have not configured valid Google Sheets credentials; the flow cannot access the sheet anonymously.
- Do not use when you do not yet know the spreadsheet link or target `sheetName`.
- Do not use when the intended source is not row-oriented tabular content; another ingestion flow may preserve document structure better.
- Do not use when no vector database has been selected, because indexing is the terminal purpose of this flow.
- Do not use this flow to answer user questions directly; that is the role of the downstream `Knowledge Chatbot` flow after ingestion has completed.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Google Sheets authentication credentials used by the trigger connector to access the spreadsheet. |
| `spreadSheetLink` | `text` | Yes | Shareable Google Sheets URL for the spreadsheet to sync. This is mapped to the connector's spreadsheet identifier configuration. |
| `sheetName` | `resourceLocator` | Yes | Name of the specific sheet tab within the spreadsheet to ingest. Can be selected from a loaded list or entered directly as text. |
| `mapping` | `variablesInput` | Yes | Key-value mapping passed into the flow's variables node. This flow expects keys `title` and `source`. Defaults are `Data` and `Google Sheets`. |
| `embeddingModelName` | `model` | Yes | Embedding model used to convert chunked sheet text into vectors. Must be a model of type `embedder/text`. |
| `vectorDB` | `select` | Yes | Target vector database where generated vectors and metadata will be indexed. |

Below the table, note these important constraints and assumptions:

- `spreadSheetLink` should be a valid Google Sheets URL pointing to a spreadsheet the configured credentials can access.
- `sheetName` must refer to an existing tab in that spreadsheet. In `list` mode, the UI is expected to load available sheet names; in `url` mode, the value must exactly match the tab name.
- The `mapping` input is treated as structured variables and should include `title` and `source`, because those keys are explicitly declared by the flow.
- `embeddingModelName` must resolve to a supported text embedding model in the Lamatic workspace.
- `vectorDB` is private and required; the flow does not include a fallback storage target.
- The trigger is configured for incremental append sync behavior, so subsequent runs are intended to add new material while duplicate handling at index time is controlled separately.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` | High-level execution result from the indexing pipeline, typically indicating successful completion or failure. |
| `indexedCount` | `number` | Number of vector records successfully written to the selected vector database, if exposed by the runtime. |
| `metadata` | `array<object>` | Metadata objects produced for the indexed chunks or rows, if surfaced in the flow response. |
| `vectors` | `array` | Generated embeddings passed into the index node, if surfaced for inspection by the runtime. |

The practical output of this flow is an indexing side effect more than a rich business payload: the important result is that Google Sheets content is now stored in the vector database. Depending on how Lamatic surfaces execution results for this connector chain, the API response may be minimal and operational rather than a full dump of vectors or metadata. Developers should treat the vector store as the canonical destination of record and not assume the response contains every indexed chunk in full.

## Dependencies
### Upstream Flows
- This is a standalone ingestion entry-point flow. No other flow must run before it in order for it to execute.
- Operationally, it depends on external setup rather than upstream flow outputs: a reachable Google spreadsheet, valid Google credentials, an available embedding model, and a configured vector database.
- In the wider agent pipeline, this flow contributes source content to the shared knowledge base but does not consume structured outputs from sibling ingestion flows.

### Downstream Flows
- `Knowledge Chatbot` — consumes the indexed data indirectly from the shared vector database during retrieval. It depends on this flow having populated the store with embeddings and metadata relevant to Google Sheets content.
- Any other retrieval or QA flow in the same RAG bundle that queries the same vector index can benefit from this flow's output, specifically the persisted vector records and associated metadata stored by `Index to DB`.

### External Services
- Google Sheets connector — reads spreadsheet rows from the selected spreadsheet and sheet — requires the configured `credentials` selection for Google authentication.
- Embedding model provider — converts chunked row text into vector embeddings — requires the selected `embeddingModelName` model configured in the Lamatic workspace.
- Vector database — stores vectors and metadata for semantic retrieval — requires the selected `vectorDB` connection.
- Lamatic code execution runtime — runs `gsheet_row-chunking.ts` and `gsheet_transform-metadata.ts` to shape content and metadata — requires no user-supplied credential beyond normal flow execution context.

### Environment Variables
- No explicit environment variables are declared in the exported flow configuration.
- If the selected embedding provider or vector database connector relies on workspace-level secrets, those are managed by Lamatic connection and model configuration rather than referenced as named environment variables inside this flow.

## Node Walkthrough
1. `Google Sheets` (`triggerNode`) starts the flow by connecting to Google Sheets using the selected `credentials`, targeting the spreadsheet identified by `spreadSheetLink`, and reading the specified `sheetName`. The trigger is configured with `syncMode` set to `incremental_append`, a `batchSize` of `200`, and a daily cron expression, which indicates it is designed for scheduled ingestion as well as operator-driven setup.

2. `Variables` (`variablesNode`) prepares flow-level variables that are later used during transformation. This node expects a `mapping` object with keys `title` and `source`; by default these are set to `Data` and `Google Sheets`. These values act as enrichment inputs so downstream processing can stamp each indexed record with consistent descriptive metadata.

3. `Row Chunking` (`codeNode`) runs the referenced script `@scripts/gsheet_row-chunking.ts`. It receives upstream sheet data plus the variable mapping and converts raw row content into chunkable text payloads suitable for embedding. In this flow, that script is the key normalization step that decides how spreadsheet rows are represented as text for retrieval.

4. `Vectorise` (`dynamicNode`) takes the text output from `Row Chunking` via `inputText` set to `{{codeNode_331.output}}` and generates embeddings using the selected `embeddingModelName`. This step transforms human-readable row chunks into dense vector representations compatible with semantic search.

5. `Transform Metadata` (`codeNode`) runs `@scripts/gsheet_transform-metadata.ts` after vectorization. Its role is to combine or reshape the embedding output and the source-derived context into the final structures expected by the indexer. The node produces at least two fields consumed downstream: `vectors` and `metadata`.

6. `Index to DB` (`dynamicNode`) writes the prepared `vectors` and `metadata` into the selected `vectorDB`. It uses `primaryKeys` of `title` and `content` and applies `duplicateOperation` set to `overwrite`, meaning matching records are replaced rather than duplicated when the indexer detects the same logical item again. This is the step that makes the sheet searchable by downstream retrieval flows.

7. `addNode` (`addNode`) is a terminal placeholder node following the index operation. It does not define business logic in the exported configuration and functions as the end of the visible flow path.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Authentication failure when the flow starts | `credentials` is missing, expired, revoked, or does not have access to the target spreadsheet | Reconnect or replace the Google Sheets credential and verify the authenticated account can open the spreadsheet and target sheet. |
| Spreadsheet cannot be found | `spreadSheetLink` is malformed, points to the wrong document, or the connector cannot extract the spreadsheet identifier | Paste the full Google Sheets URL again and confirm it opens the intended spreadsheet in the browser. |
| Sheet selection fails or no data is read | `sheetName` does not match an existing tab, or the list-mode loader cannot resolve available sheets | Re-select the sheet from the loaded list if possible, or enter the exact tab name manually in text mode. |
| Flow runs but indexes nothing | The selected sheet is empty, row chunking produced no text, or filtering inside the chunking script removed all rows | Verify the sheet contains data, inspect the chunking script behavior, and test with representative rows to confirm text is emitted. |
| Embedding step fails | `embeddingModelName` is unset, unavailable, or incompatible with text embedding | Choose a valid `embedder/text` model that is enabled in the workspace and retry. |
| Indexing fails at the final step | `vectorDB` is not configured correctly, is unavailable, or rejects the payload shape | Confirm the vector database connection is valid, reachable, and compatible with the metadata/vector schema emitted by `Transform Metadata`. |
| Existing records are unexpectedly replaced | `duplicateOperation` is set to `overwrite` and `primaryKeys` match previously indexed items | Change duplicate handling only if your indexing strategy requires versioned duplicates; otherwise ensure `title` and `content` are stable identifiers. |
| Retrieved chatbot answers do not include sheet content after a run | The flow did not actually index records, indexed the wrong sheet, or the chatbot is pointed at a different vector store | Verify successful completion of this flow, confirm the selected `vectorDB`, and ensure downstream retrieval uses the same index. |
| Scheduled sync does not appear to run as expected | Cron scheduling is configured but the deployed environment has not enabled or activated scheduled execution | Check deployment status, scheduler settings, and whether the flow has been published with trigger execution enabled. |
| Metadata fields are missing or inconsistent in the index | `mapping` omitted expected keys or the metadata transform script produced unexpected output | Supply both `title` and `source` in `mapping` and validate the behavior of `gsheet_transform-metadata.ts`. |

## Notes
- The flow metadata name includes a trailing space in the exported source as `GSheet `. Documentation and operational references should use `GSheet` consistently.
- The trigger uses `incremental_append`, but the final index node uses overwrite semantics for duplicates based on `title` and `content`. Together, this means new source data can be appended at extraction time while logically matching records are updated in the vector store rather than endlessly duplicated.
- Because the transformation logic lives in referenced scripts rather than inline config, the exact chunk shape, metadata schema, and row-to-text strategy are defined by `gsheet_row-chunking.ts` and `gsheet_transform-metadata.ts`. If retrieval quality is poor, those scripts are the first place to inspect.
- A `webhookURL` is present on `Index to DB` in the exported configuration, but it appears incidental to the indexing node configuration and should not be treated as this flow's public invocation interface.
- `batchSize` is set to `200`, which may affect throughput and memory behavior for large sheets. If the source sheet is very large, test with representative data and monitor execution time and connector limits.