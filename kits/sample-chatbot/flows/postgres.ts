/*
 * # Postgres
 * A scheduled Postgres indexation flow that extracts rows from a selected schema and table, chunks and vectorises their content, and writes the results into the vector store used by the wider Knowledge Chatbot system.
 *
 * ## Purpose
 * This flow is responsible for turning relational data from a Postgres table or view into retrieval-ready vector records. In the Knowledge Chatbot kit, it solves the ingestion side of the problem for teams whose source knowledge already lives in a database rather than in files, web pages, or cloud document systems. Instead of serving answers directly, it prepares row-derived content so it can be searched semantically later.
 *
 * The outcome is an updated vector index containing embeddings plus normalized metadata for each processed row chunk. That matters because the chatbot flow depends on a populated knowledge base to retrieve grounded context at question time. Without this ingestion step, Postgres-held knowledge remains inaccessible to the downstream RAG runtime.
 *
 * In the broader pipeline described by the parent agent, this flow sits in the indexing stage of the extract-chunk-vectorise-index chain. It is an entry-point ingestion flow: an operator configures the source database, selects the destination vector database, runs or schedules the sync, and then the separate `Knowledge Chatbot` flow queries the indexed chunks during answer generation.
 *
 * ## When To Use
 * - Use when the source knowledge to be indexed lives in a Postgres database table or view.
 * - Use when you want incremental ingestion from Postgres into the shared vector index that powers the chatbot.
 * - Use when a scheduled sync is appropriate; this flow is configured to run on a recurring cron schedule.
 * - Use when rows can be meaningfully transformed into text chunks and metadata for semantic retrieval.
 * - Use when you need database-backed operational or reference data to become searchable by the downstream RAG chatbot.
 *
 * ## When Not To Use
 * - Do not use when the source content is in Google Drive, Sheets, OneDrive, SharePoint, S3, or web pages; those sibling indexation flows are the correct source-specific choices.
 * - Do not use when no Postgres credentials are configured or when the target schema/table cannot be selected.
 * - Do not use when you need direct question answering; this flow only builds the index and does not return conversational responses.
 * - Do not use when the data cannot be represented as row-level text for embedding, or when the selected table is empty.
 * - Do not use when no vector database has been configured for the `Index to DB` step.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | Postgres authentication credentials used by the trigger source connector. |
 * | `schemas` | `select` | Yes | Source Postgres schema to read from. Loaded dynamically from the configured database. |
 * | `tables` | `select` | Yes | Source table or view to process in batch/incremental sync mode. Loaded dynamically from the selected schema. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used to construct working metadata fields. This flow expects keys `title` and `source`. |
 * | `embeddingModelName` | `model` | Yes | Text embedding model used to convert chunked row text into vectors. |
 * | `vectorDB` | `select` | Yes | Destination vector database/index target where vectors and metadata are written. |
 *
 * Below the table, note these constraints and assumptions:
 *
 * - `credentials`, `schemas`, and `tables` must refer to a reachable Postgres source that Lamatic can enumerate.
 * - `schemas` is loaded in list mode and must correspond to an existing schema name.
 * - `tables` is an Airbyte stream selection and must map to an available table or view within the selected schema.
 * - `mapping` is required and is preconfigured with `title = table_name` and `source = postgres`; changing it affects downstream metadata generation.
 * - `embeddingModelName` must be a text embedding model compatible with the `Vectorise` node.
 * - `vectorDB` must point to a writable vector store configured in the workspace.
 * - The flow assumes rows can be transformed by the referenced scripts into chunk text and metadata; malformed or highly irregular source rows may break those scripts.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `status` | `string` | High-level execution result from the indexing pipeline, typically indicating success or failure of the write operation. |
 * | `indexedCount` | `number` | Number of vector records or chunks successfully written to the destination vector database, if exposed by the runtime. |
 * | `metadata` | `object[]` | Normalized metadata objects prepared for indexed chunks during the `Transform Metadata` step. |
 * | `vectors` | `array` | Generated embeddings passed into the indexer for storage, if surfaced in execution output. |
 *
 * The flow behaves primarily as an indexing pipeline rather than a user-facing response generator. In practice, its returned payload is a structured execution result from the terminal indexing step, not a prose answer. Exact response shape can vary by Lamatic runtime and connector behavior, but the meaningful artifacts are the indexed vectors and their metadata, plus write-status information. If no rows are extracted or chunked, the response may be technically successful while containing little or no indexed data.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point indexation flow within the Knowledge Chatbot bundle.
 * - Operationally, it depends on workspace-level configuration rather than another flow: valid Postgres credentials, a selectable schema/table, an embedding model, and a target vector database.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` flow — consumes the vector records written by this flow from the shared vector database. It does not call this flow directly by field mapping, but it depends on this flow having populated the index with chunk text embeddings and metadata.
 * - Any orchestration or scheduled automation that monitors ingestion health may consume the terminal indexing status returned by this flow.
 *
 * ### External Services
 * - Postgres — source database from which rows are read and synced — requires configured `credentials` in the trigger node.
 * - Embedding model provider — converts row chunks into vector embeddings — requires the selected `embeddingModelName` model credential/configuration in `Vectorise`.
 * - Vector database — stores embeddings and metadata for later retrieval — requires the selected `vectorDB` connection in `Index to DB`.
 * - Airbyte-style source/stream discovery under Lamatic's connector layer — used to enumerate schemas and tables and drive sync configuration — requires the configured Postgres source connection.
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow definition.
 * - Credential-backed configuration is still required for `Postgres`, the selected embedding provider, and the destination `vectorDB`, but these are supplied through Lamatic-managed private inputs rather than named environment variables in the flow source.
 *
 * ## Node Walkthrough
 * 1. `Postgres` (`triggerNode`) starts the flow by connecting to the configured Postgres source, using the selected `credentials`, `schemas`, and `tables`. It is configured for `incremental_append` sync mode and scheduled with the cron expression `0 0 00 1/1 * ? * UTC`, so it is intended to run automatically on a daily cadence unless manually invoked through the platform.
 *
 * 2. `Variables` (`variablesNode`) establishes reusable metadata fields for downstream processing. By default, it maps `title` to `table_name` and sets `source` to `postgres`. This gives the later transformation step a consistent basis for identifying where each indexed chunk came from.
 *
 * 3. `Row Chunking` (`codeNode`) runs the script `@scripts/postgres_row-chunking.ts`. This script takes the extracted Postgres rows plus the variable mapping and converts row content into chunkable text suitable for embedding. Its output is passed as `{{codeNode_331.output}}` into the vectorisation step, so this is the point where structured row data becomes text fragments.
 *
 * 4. `Vectorise` (`dynamicNode`) sends the chunked row text to the selected `embeddingModelName`. For each chunk produced by the previous script, it generates an embedding vector that can be stored in the target vector database.
 *
 * 5. `Transform Metadata` (`codeNode`) runs `@scripts/postgres_transform-metadata.ts`. This script combines the chunking output and vectorisation result into the final index payload structure, exposing at least `metadata` and `vectors` fields. This is where row-level context is normalized into metadata records appropriate for retrieval.
 *
 * 6. `Index to DB` (`dynamicNode`) writes the prepared records into the selected `vectorDB`. It uses `{{codeNode_443.output.vectors}}` as the vectors payload and `{{codeNode_443.output.metadata}}` as the metadata payload. Duplicate handling is set to `overwrite`, and the configured primary keys are `title` and `content`, so matching records are replaced rather than duplicated when the same keys reappear.
 *
 * 7. `addNode` (`addNode`) is a terminal placeholder node with no configured business logic. It marks the end of the designed path after indexing completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | The flow cannot start or fails to connect to Postgres. | `credentials` are missing, invalid, or no longer authorized. | Reconfigure the Postgres credential in Lamatic, verify network/database access, and retest schema discovery. |
 * | The `Schema` dropdown is empty or does not show the expected schema. | The credentialed user lacks schema visibility, the database is unreachable, or discovery failed. | Confirm permissions on the Postgres instance, validate the connection, and refresh the dynamic options. |
 * | The `Table/View` dropdown is empty. | The selected schema has no accessible tables/views, or stream discovery did not complete. | Check that the schema contains supported objects and that the connector user can list them. |
 * | The flow runs but indexes zero records. | The selected table is empty, incremental sync found no new rows, or the chunking script produced no text. | Verify source data exists, inspect incremental sync behavior, and test the row-chunking logic against representative rows. |
 * | Vectorisation fails. | `embeddingModelName` is not configured correctly, the selected model is unavailable, or input text is malformed/empty. | Choose a valid embedding model, confirm provider credentials, and inspect the chunking output for empty content. |
 * | Indexing fails at `Index to DB`. | `vectorDB` is not configured, is unavailable, or rejects the payload shape. | Reconnect the vector database, verify write permissions, and ensure the metadata/vector outputs from `Transform Metadata` match the indexer's expected structure. |
 * | Records overwrite unexpectedly. | Duplicate handling is set to `overwrite` with primary keys `title` and `content`. | Review whether `title` and `content` uniquely identify chunks; adjust indexing strategy if overwrites are undesirable. |
 * | Metadata looks incorrect or incomplete in retrieval results. | The `mapping` values or metadata transform script do not align with the source table fields. | Validate the `mapping` configuration, especially `title`, and review the `postgres_transform-metadata.ts` script assumptions. |
 * | Downstream chatbot returns poor or no answers from Postgres content. | This flow has not run successfully, wrote zero usable chunks, or indexed low-quality chunk text. | Re-run the ingestion flow, confirm records exist in the vector store, and inspect chunking quality and metadata fidelity. |
 *
 * ## Notes
 * - This flow is one of several sibling indexation flows in the Knowledge Chatbot bundle. Only one source-specific ingestion flow typically needs to run for a given content source, but multiple can populate the same knowledge base if that is an intentional design choice.
 * - The source trigger is configured as `incremental_append`, which is efficient for recurring ingestion but means change capture behavior depends on the underlying connector's incremental sync support.
 * - The cron expression schedules daily execution in UTC. Operators should confirm that this aligns with expected data freshness windows.
 * - The indexing node includes a `webhookURL` value in its configuration, but the flow definition does not expose any documented contract around that URL. Treat it as implementation detail unless your workspace runtime specifically relies on it.
 * - Because the chunking and metadata behavior live in referenced scripts, the exact text segmentation and metadata schema are script-defined rather than fully visible in the exported flow source. Any customization of retrieval quality will likely require editing those scripts.
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
