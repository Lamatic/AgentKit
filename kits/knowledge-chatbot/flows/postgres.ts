/*
 * # Postgres
 * A flow that extracts rows from a Postgres table or view, converts them into chunked embeddings, and indexes them into a vector database for use by the wider RAG knowledge base.
 *
 * ## Purpose
 * This flow is responsible for turning structured data stored in Postgres into retrievable vector records. In the broader Knowledge Chatbot kit, it solves the ingestion side of the pipeline for relational database content: it connects to a selected Postgres schema and table or view, reads source rows on a schedule, shapes row-level information into text chunks, generates embeddings for those chunks, and writes both vectors and metadata into a configured vector store.
 *
 * The outcome is an indexed corpus derived from Postgres data that can participate in semantic retrieval alongside content ingested from other sources such as files, cloud storage, web crawling, and spreadsheets. That outcome matters because the downstream chatbot flow depends on a populated vector index to retrieve relevant context at question time. Without this indexing step, database-backed knowledge remains inaccessible to the retrieval layer.
 *
 * Within the wider agent architecture described in the parent `agent.md`, this flow sits firmly in the prepare-and-index stage of the RAG chain. It is not a query-time retrieval or synthesis flow. Instead, it feeds the shared vector knowledge base that the `Knowledge Chatbot` flow later queries when answering user questions.
 *
 * ## When To Use
 * - Use when the knowledge you want searchable lives in a Postgres database table or view.
 * - Use when you need to ingest structured relational records into the same vector index used by the RAG chatbot.
 * - Use when a schema and table can be selected in advance and processed in scheduled batch sync mode.
 * - Use when incremental append sync behaviour is appropriate for the source data.
 * - Use when you want each row transformed into chunked text and embedded with a configurable text embedding model.
 * - Use when Postgres is the system of record and sibling ingestion flows such as Google Drive, S3, SharePoint, or crawling would not reach the desired content.
 *
 * ## When Not To Use
 * - Do not use when the source content is not in Postgres; choose the sibling ingestion flow that matches the actual source system.
 * - Do not use when no Postgres credentials have been configured or the target schema and table cannot be resolved.
 * - Do not use when the target vector database has not been configured, because indexing cannot complete without it.
 * - Do not use when you need ad hoc question answering; this flow prepares data but does not answer user queries.
 * - Do not use when the source requires complex joins, transformations, or denormalization not handled by the built-in row chunking and metadata scripts.
 * - Do not use when the desired ingestion pattern is something other than scheduled batch extraction from a table or view.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | Postgres authentication credentials used by the trigger node to connect to the source database. |
 * | `schemas` | `select` | Yes | Source Postgres schema to read from. The available values are loaded dynamically from the selected connection. |
 * | `tables` | `select` | Yes | Source table or view within the selected schema for batch processing. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used downstream during row processing. This flow expects keys `title` and `source`. |
 * | `embeddingModelName` | `model` | Yes | Text embedding model used to convert chunked row text into vectors. |
 * | `vectorDB` | `select` | Yes | Target vector database where generated embeddings and metadata are indexed. |
 *
 * Below the table, describe any notable input constraints or validation assumptions.
 *
 * - The `schemas` options are populated by the connector using `getSchemas`, so the selected credentials must grant schema discovery access.
 * - The `tables` options are populated by `getTables`, so the selected schema must be accessible and contain at least one readable table or view.
 * - The `mapping` input is treated as structured configuration, not free-form runtime text. By default, `title` maps to `table_name` and `source` maps to `postgres`.
 * - The selected `embeddingModelName` must be compatible with `embedder/text` usage.
 * - The selected `vectorDB` must support the index node’s expected vector and metadata write operations.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Vector payload produced after embedding and metadata transformation, then passed to the index node for storage. |
 * | `metadata` | `array` | Metadata payload aligned with the vectors and written alongside them into the vector database. |
 * | `indexingResult` | `object` | The practical end result of the flow: records written or overwritten in the configured vector database. The exact shape depends on the runtime behaviour of the index node. |
 *
 * The flow’s effective output is a structured indexing operation rather than an end-user response body. Internally, the transformed `vectors` and `metadata` arrays are produced by the `Transform Metadata` step and consumed immediately by `Index to DB`. In operational terms, the durable output is the set of vectorized Postgres-derived documents stored in the target index. Because the export does not define an explicit response-mapping node, callers should treat successful completion and persisted indexed records as the primary outcome.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone ingestion entry-point flow within the kit.
 * - Operationally, it does depend on setup work having already happened: a reachable Postgres source, valid credentials, a selected schema and table, a configured embedding model, and a configured vector database connection.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` — consumes the indexed records produced by this flow indirectly through the shared vector database. It relies on this flow having populated retrievable vectors and associated metadata in the common index.
 * - Any other retrieval-time flow in the same RAG system would likewise depend on the persisted vector records, not on a direct API response field from this flow.
 *
 * ### External Services
 * - Postgres — source system for relational data extraction — required credential: selected `credentials` in `triggerNode_1`
 * - Embedding model provider — converts chunked text into dense vectors — required configuration: selected `embeddingModelName` in `vectorizeNode_177`
 * - Vector database — stores vectors and metadata for retrieval — required configuration: selected `vectorDB` in `IndexNode_824`
 * - Airbyte-style source/stream discovery under the connector layer — used to enumerate schemas and tables and configure sync from Postgres — required credential: selected `credentials` in `triggerNode_1`
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow definition.
 * - Runtime credentials and model/database selections are provided through Lamatic private inputs rather than named environment variables in this flow.
 *
 * ## Node Walkthrough
 * 1. `Postgres` (`triggerNode`)
 *    - This is the flow entry point. It connects to the selected Postgres instance using the configured `credentials`, targets the chosen `schemas` and `tables`, and runs in `incremental_append` sync mode on the configured daily cron schedule `0 0 00 1/1 * ? * UTC`.
 *    - Its job is to pull source rows from the specified table or view and make them available to downstream nodes for transformation and indexing.
 *
 * 2. `Variables` (`variablesNode`)
 *    - This node injects flow-specific mapping values used during row processing.
 *    - By default, it defines `title` as `table_name` and `source` as `postgres`. These values provide consistent metadata context so downstream scripts can label indexed chunks with a stable source identity and title-like field.
 *
 * 3. `Row Chunking` (`codeNode`)
 *    - This custom script, referenced as `@scripts/postgres_row-chunking.ts`, takes the extracted Postgres rows plus the variable mapping and converts each row into chunkable text.
 *    - Its output is the text payload that will be embedded. The next node reads this value from `codeNode_331.output`, so this step is where row-level database content is normalized into embedding-ready strings.
 *
 * 4. `Vectorise` (`dynamicNode`)
 *    - This node sends the chunked text from `Row Chunking` to the selected text embedding model.
 *    - It transforms database-derived text into vector representations suitable for semantic retrieval. The chosen `embeddingModelName` determines the embedding backend used for this conversion.
 *
 * 5. `Transform Metadata` (`codeNode`)
 *    - This custom script, referenced as `@scripts/postgres_transform-metadata.ts`, combines the embedding output with row- and flow-level context to produce two aligned structures: `vectors` and `metadata`.
 *    - These structures are explicitly referenced by the index node through `codeNode_443.output.vectors` and `codeNode_443.output.metadata`, so this step is the final normalization layer before persistence.
 *
 * 6. `Index to DB` (`dynamicNode`)
 *    - This node writes the transformed vectors and metadata into the selected vector database.
 *    - It uses `primaryKeys` of `title` and `content` to identify records and is configured with `duplicateOperation` set to `overwrite`, meaning matching records are replaced rather than duplicated.
 *    - This is the step that makes Postgres content available to the shared retrieval layer used by the chatbot and any other retrieval consumers.
 *
 * 7. `addNode` (`addNode`)
 *    - This terminal placeholder node has no configured business logic in the export.
 *    - It marks the end of the current published path after indexing completes and does not materially alter the indexed result.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Connection to source database fails at start | `credentials` are missing, invalid, expired, or lack network/database access | Reconfigure the Postgres credential, verify host/user/password and connectivity, and ensure the Lamatic runtime can reach the database |
 * | Schema list is empty or desired schema cannot be selected | Credential does not have permission to inspect schemas, or the database connection points to the wrong instance | Grant schema discovery permissions, confirm the target database, and reload the `schemas` input |
 * | Table/view list is empty or selected table cannot be read | Wrong schema selected, insufficient privileges, or no readable streams exposed | Verify the selected schema, grant read access on the table/view, and refresh available `tables` |
 * | Flow runs but indexes nothing | Source table returned no rows, incremental sync found no new data, or row chunking emitted empty text | Confirm the table contains data, review sync timing and append behaviour, and validate the chunking script’s assumptions about row structure |
 * | Embedding step fails | `embeddingModelName` is unset, incompatible, unavailable, or quota-limited | Select a valid text embedding model, confirm provider access, and retry after resolving quota or service issues |
 * | Indexing step fails | `vectorDB` is not configured correctly, target store is unavailable, or payload shape is rejected | Reconfigure the vector database connection, verify availability and schema expectations, and inspect the transformed `vectors` and `metadata` payloads |
 * | Existing records are unexpectedly replaced | `duplicateOperation` is set to `overwrite` and `primaryKeys` matched prior records | Change indexing strategy if overwrite is not desired, or adjust upstream content/key generation to avoid collisions |
 * | Metadata appears incomplete or incorrect in retrieval | Variable mapping or transformation script produced the wrong fields | Review `mapping` values in `variablesNode_543` and validate the `postgres_transform-metadata.ts` script logic |
 * | Downstream chatbot cannot retrieve Postgres content even though this flow ran | The flow completed without persisting usable vectors, or the chatbot is pointed at a different vector index | Verify records exist in the expected vector database, confirm index configuration is shared with the chatbot flow, and ensure embeddings were generated successfully |
 * | Flow cannot be meaningfully chained because prerequisite ingestion setup is missing | The broader RAG system has not been configured with a common vector store or retrieval flow | Complete kit setup first: configure the vector store, run one or more ingestion flows, then use the `Knowledge Chatbot` flow for query-time retrieval |
 *
 * ## Notes
 * - The flow is scheduled to run daily via cron, so it is suited to recurring ingestion rather than only one-off manual execution.
 * - Sync mode is `incremental_append`, which suggests the connector is intended to process new or changed source data incrementally rather than fully replacing the corpus on each run.
 * - The index node uses `title` and `content` as primary keys, but only `title` is surfaced in the variable mapping export. Developers should verify that the chunking and metadata scripts reliably produce a `content` field before relying on overwrite semantics.
 * - The flow’s behaviour depends materially on two referenced custom scripts: `@scripts/postgres_row-chunking.ts` and `@scripts/postgres_transform-metadata.ts`. If you modify source schema conventions, those scripts are the first place to check.
 * - A `webhookURL` is present in the index node configuration, but the exported graph does not show any downstream use of a webhook response. Treat it as node-level configuration rather than a documented public output contract unless runtime behaviour confirms otherwise.
 */

// Flow: postgres
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Postgres",
  "description": "Postgres Indexation",
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
      "description": "Select the credentials for Postgres database authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "schemas",
      "type": "select",
      "label": "Schema",
      "required": true,
      "isPrivate": true,
      "description": "Select the source schema.",
      "typeOptions": {
        "loadOptionsMethod": "getSchemas"
      },
      "airbyteInputName": "source/configuration.schemas[0]",
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    },
    {
      "name": "tables",
      "type": "select",
      "label": "Table/View",
      "required": true,
      "isPrivate": true,
      "description": "Specify the source table or view for batch processing.",
      "typeOptions": {
        "loadOptionsMethod": "getTables"
      },
      "defaultValue": "",
      "isAirbyteStream": true,
      "airbyteInputName": "connection/configurations.streams[0].name"
    }
  ],
  "variablesNode_543": [
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
    "postgres_transform_metadata": "@scripts/postgres_transform-metadata.ts",
    "postgres_row_chunking": "@scripts/postgres_row-chunking.ts"
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
      "nodeId": "postgresNode",
      "modes": {
        "schemas": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Postgres",
        "syncMode": "incremental_append",
        "cronExpression": "0 0 00 1/1 * ? * UTC"
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
        "code": "@scripts/postgres_transform-metadata.ts"
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
        "code": "@scripts/postgres_row-chunking.ts"
      }
    }
  },
  {
    "id": "variablesNode_543",
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
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"table_name\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"postgres\"\n  }\n}"
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
    "id": "variablesNode_543-codeNode_331",
    "source": "variablesNode_543",
    "target": "codeNode_331",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-variablesNode_543",
    "source": "triggerNode_1",
    "target": "variablesNode_543",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
