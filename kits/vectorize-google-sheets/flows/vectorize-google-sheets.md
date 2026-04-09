# Vectorize Google Sheets
A scheduled ingestion flow that reads Google Sheets data, converts rows into embeddings, and writes them to a vector database so downstream search and RAG systems can retrieve spreadsheet knowledge semantically.

## Purpose
This flow is responsible for turning tabular data in Google Sheets into searchable vectorized knowledge. It solves the ingestion side of the problem: structured spreadsheet rows are not directly useful for semantic retrieval, so the flow extracts them, reshapes them into embedding-ready text, computes vectors, attaches metadata, and stores the result in a vector index.

The outcome is a refreshed vector database populated with representations of the latest sheet content. That matters because downstream applications can then search by meaning rather than exact string match, enabling retrieval over operational data, product data, CRM exports, inventories, FAQs, or any other information maintained in Sheets. The flow is especially useful where spreadsheet content changes over time and must be indexed repeatedly.

Within the broader agent system, this flow sits at the ingestion layer of a retrieval pipeline. It is the upstream indexing component that prepares knowledge for later query-time retrieval and synthesis flows. In plan-retrieve-synthesize terms, this flow does not answer user questions directly; it prepares the retrieval substrate that later flows or services query during the retrieve phase before synthesis happens elsewhere.

## When To Use
- Use when Google Sheets is the source of truth for data that must become searchable through semantic similarity.
- Use when you need to populate or refresh a vector index from spreadsheet rows on a schedule.
- Use when downstream RAG or semantic search systems depend on the latest spreadsheet content being indexed.
- Use when rows should be embedded incrementally rather than rebuilding an entire corpus manually.
- Use when a Lamatic deployment needs an automated Sheet-to-vector-store ingestion path with metadata preserved for provenance.

## When Not To Use
- Do not use when the source data is not in Google Sheets.
- Do not use when no Google Sheets credentials have been configured for the `Google Sheets` node.
- Do not use when no vector database target has been configured for the `Index to DB` node.
- Do not use when an embeddings model has not been selected or provisioned for the `Get Vectors` node.
- Do not use for interactive retrieval, question answering, or response generation; this flow indexes data but does not query or synthesize answers.
- Do not use when the desired behavior is full document parsing, OCR, or unstructured file ingestion from PDFs or web pages; a different ingestion flow would be more appropriate.
- Do not use when spreadsheet rows require complex runtime user-supplied filtering or ad hoc query logic that this trigger does not accept.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| None | n/a | No | This flow exposes no explicit API trigger fields in `inputs`. It is configured as a trigger-driven Google Sheets ingestion workflow and relies on node-level configuration instead of runtime request parameters. |

This flow has an empty declared input schema. Operationally, it assumes the `Google Sheets` trigger node has been configured with valid credentials, sheet selection settings, sync mode, schedule, and batch parameters inside the flow itself. Because there are no public trigger fields, spreadsheet identity, sheet scope, and indexing behavior are determined by deployment configuration rather than caller-supplied payload.

## Outputs
| Field | Type | Description |
|---|---|---|
| Response payload | implementation-defined object | The terminal response comes after `Index to DB` and the trailing `addNode`, but no explicit output mapping is declared in the flow source. In practice, the result is whatever Lamatic emits for successful completion of the indexing operation. |
| Indexed vectors | internal side effect | The primary outcome is not a rich API body but the successful persistence of vectors and metadata into the configured vector database. |

The effective output of this flow is a side effect: rows from Google Sheets are embedded and written to a vector index. The API response shape is not explicitly defined in the exported flow configuration, so callers should not rely on a stable structured response beyond success or failure metadata from the runtime. If downstream orchestration needs detailed counts or identifiers, the code scripts or index node configuration may need to be extended to emit them explicitly.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point ingestion flow within the kit.
- In the broader agent architecture, it serves as the producer of indexed knowledge rather than consuming outputs from another Lamatic flow.

### Downstream Flows
- Downstream retrieval or RAG flows outside this template can consume the vector records written by this flow.
- Those consumers typically depend on the vectors and metadata persisted by `Index to DB`, not on a strongly typed API response from this flow.
- Specifically, downstream systems rely on the indexed text embeddings and associated metadata fields produced through `Transform Metadata` and stored by `Index to DB`.

### External Services
- Google Sheets API — reads spreadsheet rows on a schedule or trigger basis — required credential configured on the `Google Sheets` node
- Embedding model provider — converts row text into vector embeddings — model and provider configured on the `Get Vectors` node
- Vector database — stores vectors and metadata for similarity search — database connection configured on the `Index to DB` node
- Webhook endpoint at `https://webhook.site/685a66e7-b4d3-40a4-9801-99e3460414f9` — configured on the indexing node, likely for event delivery or debugging — used by `Index to DB`

### Environment Variables
- No explicit environment variables are declared in the exported flow source.
- Credential and provider secrets are likely managed through Lamatic connection settings rather than named environment variables in this file.
- If your selected embeddings provider or vector database integration requires environment variables at deployment time, those are integration-specific and are not visible in this flow definition.

## Node Walkthrough
1. `Google Sheets` (`googleSheetsNode`)
   - This is the trigger and entry point for the flow. It is configured to run in trigger mode with `syncMode` set to `incremental_append`, meaning the flow is intended to ingest newly available spreadsheet data without replacing the whole corpus on each run.
   - The node is scheduled with the cron expression `0 0 00 1/1 * ? * UTC`, which indicates a daily UTC run cadence.
   - It processes data in batches of `200`, and `sheetName` is configured in list mode. The node produces sheet rows that are passed downstream for transformation.

2. `Row Chunking` (`codeNode`)
   - This custom script, referenced as `@scripts/vectorize-google-sheets_row-chunking.ts`, receives the raw rows from `Google Sheets`.
   - Its role is to transform each row into chunked textual content suitable for embedding. For spreadsheet data, that usually means combining row fields into a readable, semantically meaningful text representation while preserving row boundaries or chunk structure.
   - The node’s output becomes the `inputText` for the embedding stage, so its formatting directly affects embedding quality and retrieval usefulness.

3. `Get Vectors` (`vectorizeNode`)
   - This node takes `{{codeNode_331.output}}` from `Row Chunking` as its `inputText`.
   - It calls the configured embeddings model to convert the row-derived text chunks into vector representations. The exported source shows `embeddingModelName` left open, so the actual model must be selected in deployment or workspace configuration.
   - The resulting embeddings remain aligned with the chunked row content and are passed to the metadata transformation stage.

4. `Transform Metadata` (`codeNode`)
   - This custom script, referenced as `@scripts/vectorize-google-sheets_transform-metadata.ts`, receives the outputs from prior steps and prepares the final payload for indexing.
   - It emits at least two structured fields: `vectors` and `metadata`, as shown by the downstream mappings used by `Index to DB`.
   - This is the normalization step where provenance and row-level context are likely attached to each vector so the vector database can store not just embeddings but also the information needed for filtering, traceability, and meaningful retrieval results.

5. `Index to DB` (`IndexNode`)
   - This node writes the transformed vectors and metadata into the configured vector database.
   - It reads vectors from `{{codeNode_443.output.vectors}}` and metadata from `{{codeNode_443.output.metadata}}`.
   - Duplicate handling is set to `overwrite`, so when the database detects matching records according to its configured identity strategy, newer data replaces existing entries.
   - The `vectorDB`, `primaryKeys`, embedding model setting, and generative model setting are not populated in the exported source, so these must be configured before production use.
   - A `webhookURL` is also present, which may be used for status delivery, debugging, or integration hooks depending on the platform behavior.

6. `addNode` (`addNode`)
   - This is the terminal node after indexing.
   - No custom name or output mapping is defined, so it functions as a passive endpoint in the execution graph rather than performing business logic.
   - Its practical purpose is to close the flow path and allow Lamatic to finalize execution after the database write completes.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow does not start or immediately fails at `Google Sheets` | Missing or invalid Google Sheets credentials | Reconnect the Google Sheets integration on the `Google Sheets` node and verify spreadsheet access permissions. |
| Flow runs but no rows are processed | Sheet selection, sync state, or schedule configuration does not match the intended spreadsheet data | Verify the sheet selection settings, trigger configuration, and whether `incremental_append` is skipping already-seen rows. |
| `Row Chunking` fails | Unexpected row shape from Google Sheets or script logic not handling empty or malformed rows | Review the row schema returned by the trigger and update `vectorize-google-sheets_row-chunking.ts` to handle missing cells, headers, or null values safely. |
| `Get Vectors` fails | No embeddings model configured, provider credentials missing, or model quota/rate limit exceeded | Configure a valid embedding model on `Get Vectors`, confirm provider authentication, and check provider usage limits. |
| `Transform Metadata` fails | Script expects fields from previous nodes that are absent or differently shaped | Inspect actual outputs from `Row Chunking` and `Get Vectors`, then align `vectorize-google-sheets_transform-metadata.ts` with the current payload shape. |
| `Index to DB` fails before writing records | Vector database connection is not configured or credentials are invalid | Configure the `vectorDB` target and verify all required connection details and credentials for the selected database. |
| `Index to DB` rejects records | Mismatch between vectors and metadata counts, invalid metadata schema, or primary key strategy is incomplete | Ensure `Transform Metadata` emits one metadata object per vector and configure `primaryKeys` appropriately if your database requires them. |
| Flow succeeds technically but retrieval quality is poor | Row text produced by `Row Chunking` is too sparse, noisy, or inconsistent for good embeddings | Improve the chunking script to generate clearer natural-language row summaries and preserve important column labels and values. |
| Downstream RAG flow returns nothing useful | This ingestion flow has not run successfully, or the wrong vector index/database was targeted | Confirm the indexing run completed, verify the destination index, and ensure downstream retrieval points to the same vector store and namespace. |
| Duplicate or stale content appears in search results | `overwrite` behavior is insufficient without stable record identity, or incremental append is not aligned with update semantics | Define stable primary keys and review whether `incremental_append` should be replaced or supplemented with a different sync strategy. |

## Notes
- The flow’s public input schema is empty, so most operational behavior is controlled by node configuration rather than runtime invocation payloads.
- Several important fields in the export are intentionally unset, including `credentials`, `vectorDB`, `primaryKeys`, and model selections. The template is therefore not production-ready until those are configured.
- Because `duplicateOperation` is `overwrite`, record identity matters. If primary keys are not defined correctly, updates may not behave as intended.
- Batch size is set to `200`, which is a practical throughput setting but may need adjustment depending on sheet size, embedding model rate limits, and vector database write constraints.
- The daily UTC cron schedule is suitable for periodic refresh, but teams needing near-real-time indexing should adjust scheduling or use a different trigger strategy.
- The quality of downstream semantic search depends heavily on the custom scripts referenced in `references.scripts`, especially how row content is serialized into text and how metadata is normalized for indexing.