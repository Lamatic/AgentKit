/*
 * # GSheet
 * A flow that ingests rows from a Google Sheet, converts them into vector embeddings, and indexes them into the shared knowledge base used by the wider Knowledge Chatbot system.
 *
 * ## Purpose
 * This flow is responsible for turning structured spreadsheet data into searchable vector records. It solves the specific ingestion problem where knowledge lives in Google Sheets rather than in documents, websites, or databases. Instead of treating the sheet as a file blob, the flow syncs a selected sheet, prepares row-level text for embedding, attaches normalized metadata, and writes the resulting vectors into the configured vector database.
 *
 * The outcome is an indexed representation of spreadsheet content that can be retrieved later by the chatbot flow. This matters because operational data, FAQs, inventories, runbooks, and lightweight knowledge tables are often maintained in Sheets. By indexing that content, the broader system can answer grounded questions against spreadsheet-backed knowledge just as it does for documents or crawled pages.
 *
 * Within the wider bundle, this is an entry-point indexation flow in the ingest stage of the plan-retrieve-synthesize chain. It does not answer user questions directly. Its role is to populate or refresh the vector store so that the downstream `Knowledge Chatbot` flow can perform retrieval over the indexed chunks at query time.
 *
 * ## When To Use
 * - Use when the source content to index is stored in a Google spreadsheet.
 * - Use when you want a scheduled or repeatable sync from a specific spreadsheet and sheet tab into the project vector database.
 * - Use when sheet rows contain knowledge that should become searchable by the downstream RAG chatbot.
 * - Use when you have valid Google Sheets credentials and know both the spreadsheet link and the target sheet name.
 * - Use when the desired indexing behavior is incremental append from Google Sheets rather than one-off manual copy-paste ingestion.
 *
 * ## When Not To Use
 * - Do not use when the knowledge source is a website, cloud drive, object store, relational database, or another source that has its own dedicated sibling indexation flow in the bundle.
 * - Do not use when no Google Sheets credentials have been configured.
 * - Do not use when you only need to query the knowledge base; use the downstream `Knowledge Chatbot` flow after indexing is complete.
 * - Do not use when the spreadsheet link is invalid, inaccessible to the configured credential, or does not contain the target sheet.
 * - Do not use when you need document-style chunking over long prose files rather than row-oriented processing.
 * - Do not use when no vector database or embedding model has been configured for this workspace.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | Google Sheets authentication credential used by the trigger to access the spreadsheet. |
 * | `spreadSheetLink` | `text` | Yes | Shareable Google Sheets URL for the spreadsheet to sync. This is mapped to the source spreadsheet identifier. |
 * | `sheetName` | `resourceLocator` | Yes | Name of the specific sheet tab to sync. It can be selected from a loaded list or entered directly as text. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used to enrich records with working values for `title` and `source`. Defaults are `Data` and `Google Sheets`. |
 * | `embeddingModelName` | `model` | Yes | Text embedding model used to convert chunked row content into vectors. |
 * | `vectorDB` | `select` | Yes | Target vector database where processed vectors and metadata will be indexed. |
 *
 * Below the table, note these constraints and assumptions:
 * - `spreadSheetLink` is expected to be a valid Google Sheets URL, not an arbitrary document link.
 * - `sheetName` must refer to an existing tab inside the referenced spreadsheet.
 * - `credentials` must authorize read access to the target spreadsheet.
 * - `mapping` is designed around two keys, `title` and `source`; downstream processing assumes those keys exist.
 * - The flow is configured for row-based ingestion, so data quality depends on sheet rows being usable as coherent text records.
 * - The trigger is configured with `incremental_append`, so repeated runs are intended to add or update indexed content rather than perform an unrelated ad hoc transformation.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Vector representations generated from the chunked sheet-row text and passed into the indexing node. |
 * | `metadata` | `array` | Normalized metadata records paired with the vectors for storage in the vector database. |
 * | `indexingResult` | `object` | The effective result of the vector index write operation performed by `Index to DB`. Exact provider-specific response shape is not declared in the flow source. |
 *
 * The flow produces an indexing-oriented result rather than a human-readable answer. Internally, the main artifacts are arrays of chunk embeddings and associated metadata objects, which are then written to the configured vector store. The final API response shape depends on the platform behavior of the terminal indexing path and may expose write status more than raw transformed payloads. Developers should treat this flow primarily as a side-effecting ingestion job whose key outcome is updated vector index state.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow.
 * - In the broader bundle, it is one of several alternative source-specific indexation flows. Operators choose this flow when Google Sheets is the source system.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` flow — consumes the indexed knowledge indirectly by querying the shared vector database after this flow has populated or refreshed it.
 * - The downstream dependency is on persisted vector records rather than on a direct in-memory payload. The important artifacts produced by this flow are the indexed `vectors` and their `metadata` in the selected `vectorDB`.
 *
 * ### External Services
 * - Google Sheets connector — reads rows from the specified spreadsheet and sheet tab — requires configured Google Sheets `credentials`.
 * - Embedding model provider — converts row chunks into vector embeddings — requires the selected `embeddingModelName` available in the workspace.
 * - Vector database — stores embeddings and metadata for later retrieval — requires selected `vectorDB` connection.
 * - Lamatic script runtime — executes `@scripts/gsheet_row-chunking.ts` and `@scripts/gsheet_transform-metadata.ts` during transformation steps — no separate user-provided credential declared in this flow.
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Any provider-specific secrets are expected to be encapsulated in Lamatic-managed credentials or model/database selections rather than referenced as named environment variables inside nodes.
 *
 * ## Node Walkthrough
 * 1. `Google Sheets` (`triggerNode`) starts the flow by connecting to Google Sheets with the selected `credentials`, reading from the provided `spreadSheetLink`, and targeting the chosen `sheetName`. The trigger is configured for `incremental_append`, with a batch size of `200`, so it is intended to sync sheet data in manageable batches on a daily schedule.
 *
 * 2. `Variables` (`variablesNode`) defines working metadata fields used later in the pipeline. By default it sets `title` to `Data` and `source` to `Google Sheets`, though these values can be remapped through the flow input. This step ensures later transformation logic has stable labels to attach to indexed records.
 *
 * 3. `Row Chunking` (`codeNode`) runs the `@scripts/gsheet_row-chunking.ts` script. It takes the synced sheet rows plus the variable mapping context and converts them into text chunks suitable for embedding. In this flow, chunking is row-oriented rather than document-oriented, so each output item represents a spreadsheet-derived text unit ready for vectorization.
 *
 * 4. `Vectorise` (`dynamicNode`) sends the chunked text from `{{codeNode_331.output}}` to the selected `embeddingModelName`. This step generates numerical embeddings for each row chunk so that semantic retrieval can be performed later by the chatbot.
 *
 * 5. `Transform Metadata` (`codeNode`) runs the `@scripts/gsheet_transform-metadata.ts` script. It combines the vectorization output with row context and the mapped variables to produce two indexing payloads: `vectors` and `metadata`. This is the normalization step that shapes spreadsheet-derived content into the schema expected by the indexing node.
 *
 * 6. `Index to DB` (`dynamicNode`) writes the generated `vectors` and `metadata` into the selected `vectorDB`. The node uses `title` and `content` as `primaryKeys` and is configured with `duplicateOperation` set to `overwrite`, so records with matching keys are replaced rather than retained as duplicates.
 *
 * 7. `addNode` (`addNode`) is a terminal placeholder with no business logic of its own. It marks the end of the visible execution path after indexing completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication error when the flow starts | `credentials` are missing, expired, or do not grant access to the spreadsheet | Reconfigure the Google Sheets credential and confirm the authenticated account can open the target spreadsheet and sheet tab. |
 * | Spreadsheet cannot be found | `spreadSheetLink` is malformed or points to a non-existent sheet | Paste the full Google Sheets URL again and verify it opens correctly in the browser. |
 * | Sheet tab is missing or empty | `sheetName` does not match an existing tab, or the selected tab has no usable rows | Select the sheet from the list loader when possible, confirm exact naming, and check that the tab contains data. |
 * | Flow runs but no vectors are indexed | The sheet returned no rows, the chunking script emitted nothing, or content fields were blank | Validate that the spreadsheet contains populated rows and inspect the row chunking assumptions used by the flow. |
 * | Embedding step fails | `embeddingModelName` is not configured, unavailable, or incompatible with the workspace | Select a valid text embedding model and verify provider access in the Lamatic workspace. |
 * | Index write fails | `vectorDB` is not configured, unreachable, or rejects the payload schema | Reconnect the vector database, verify access, and confirm it accepts the vector and metadata structure generated by the transform step. |
 * | Indexed rows overwrite unexpectedly | `duplicateOperation` is `overwrite` and `title` plus `content` collide with existing records | Adjust source data or transformation logic if overwrite behavior is not desired, or use distinguishing metadata/content values. |
 * | Downstream chatbot returns no relevant answers after a successful run | The downstream `Knowledge Chatbot` flow is querying a different vector store, wrong namespace, or stale index context | Confirm that this flow and the chatbot use the same vector database configuration and retrieval scope. |
 * | Scheduled sync does not behave as expected | The cron-based trigger schedule or incremental sync semantics were misunderstood | Review the configured cron expression and sync mode, then test with a controlled spreadsheet change to confirm ingestion behavior. |
 *
 * ## Notes
 * - The flow metadata name includes a trailing space in source configuration (`GSheet `), but the canonical flow name should be treated as `GSheet`.
 * - The trigger is scheduled with cron expression `0 0 00 1/1 * ? * UTC`, indicating a daily UTC-based execution pattern in addition to any manual runs.
 * - Batch size is set to `200`, which may affect throughput and memory behavior for large sheets.
 * - `primaryKeys` are `title` and `content`, which is unusual for spreadsheet data if many rows share the same title. In practice, uniqueness will depend heavily on how the row chunking and metadata scripts construct `content` and related fields.
 * - The exact structure of the API response is less important than the side effect of successful indexing. Operationally, success should be verified in the target vector database and then validated through retrieval in the chatbot flow.
 * - Two transformation scripts are central to behavior: `@scripts/gsheet_row-chunking.ts` and `@scripts/gsheet_transform-metadata.ts`. Any customization of row formatting, field selection, or metadata schema will most likely happen there rather than in the node graph itself.
 */

// Flow: gsheet
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "GSheet ",
  "description": "GSheet Indexation",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "IndexNode_824": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Vector DB",
      "required": true,
      "isPrivate": true,
      "description": "Select the vector database where the vectors will be indexed.",
      "defaultValue": ""
    }
  ],
  "triggerNode_1": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Google Sheets authentication. Required to access the Google Sheet API.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "spreadSheetLink",
      "type": "text",
      "label": "Spreadsheet Link",
      "required": true,
      "isPrivate": true,
      "description": "Enter the link to the Google spreadsheet you want to sync. To copy the link, click the 'Share' button in the top-right corner of the spreadsheet, then click 'Copy link'. Example value: https://docs.google.com/spreadsheets/d/1hLd9Qqti3UyLXZB2aFfUWDT7BG-arw2xy4HR3D-dwUb/edit",
      "airbyteInputName": "source/configuration.spreadsheet_id"
    },
    {
      "name": "sheetName",
      "type": "resourceLocator",
      "label": "Sheet Name",
      "modes": [
        {
          "name": "list",
          "type": "select",
          "label": "From List",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "url",
          "type": "text",
          "label": "Sheet Name",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "description": "Enter the name of the sheet inside the Google spreadsheet you want to sync.",
      "typeOptions": {
        "loadOptionsMethod": "getSheets"
      },
      "airbyteInputName": "connection/configurations.streams[0].name",
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    }
  ],
  "variablesNode_305": [
    {
      "keys": [
        "title",
        "source"
      ],
      "name": "mapping",
      "type": "variablesInput",
      "label": "Mapping",
      "required": true,
      "description": "Map the variables with the values",
      "defaultValue": "",
      "useCaseInput": true
    }
  ],
  "vectorizeNode_177": [
    {
      "mode": "embedding",
      "name": "embeddingModelName",
      "type": "model",
      "label": "Embedding Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "embedder/text",
      "description": "Select the model to convert the texts into vector representations.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "gsheet_transform_metadata": "@scripts/gsheet_transform-metadata.ts",
    "gsheet_row_chunking": "@scripts/gsheet_row-chunking.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "googleSheetsNode",
      "modes": {
        "sheetName": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Google Sheets",
        "syncMode": "incremental_append",
        "batchSize": "200",
        "cronExpression": "0 0 00 1/1 * ? * UTC",
        "namesConversion": "false"
      }
    }
  },
  {
    "id": "vectorizeNode_177",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorise",
        "inputText": "{{codeNode_331.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_443",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Transform Metadata",
        "code": "@scripts/gsheet_transform-metadata.ts"
      }
    }
  },
  {
    "id": "IndexNode_824",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index to DB",
        "webhookURL": "https://webhook.site/685a66e7-b4d3-40a4-9801-99e3460414f9",
        "primaryKeys": [
          "title",
          "content"
        ],
        "vectorsField": "{{codeNode_443.output.vectors}}",
        "metadataField": "{{codeNode_443.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "addNode_894",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {
        "nodeName": ""
      }
    }
  },
  {
    "id": "codeNode_331",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Row Chunking",
        "code": "@scripts/gsheet_row-chunking.ts"
      }
    }
  },
  {
    "id": "variablesNode_305",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "modes": {},
      "values": {
        "nodeName": "Variables",
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"Data\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"Google Sheets\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "codeNode_331-vectorizeNode_177",
    "source": "codeNode_331",
    "target": "vectorizeNode_177",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_177-codeNode_443",
    "source": "vectorizeNode_177",
    "target": "codeNode_443",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_443-IndexNode_824",
    "source": "codeNode_443",
    "target": "IndexNode_824",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_824-addNode_894",
    "source": "IndexNode_824",
    "target": "addNode_894",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "variablesNode_305-codeNode_331",
    "source": "variablesNode_305",
    "target": "codeNode_331",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-variablesNode_305",
    "source": "triggerNode_1",
    "target": "variablesNode_305",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
