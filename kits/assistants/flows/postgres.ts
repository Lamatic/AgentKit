/*
 * # Postgres
 * A flow that incrementally ingests content from a PostgreSQL table or view, converts rows into vector embeddings, and indexes them into the shared vector store used by the wider internal RAG system.
 *
 * ## Purpose
 * This flow is responsible for turning structured data stored in PostgreSQL into retrieval-ready vector records. In many internal knowledge systems, important operational information lives in database tables rather than documents or web pages. This flow bridges that gap by reading from a selected schema and table or view, shaping each row into text, generating embeddings, and writing the resulting vectors plus metadata into a configured vector database.
 *
 * The outcome is a searchable representation of Postgres-backed knowledge that can be retrieved later by assistant flows. That matters because the bundle’s assistant channels depend on a populated vector index to answer questions with grounded context. Without this ingestion step, any knowledge that exists only in PostgreSQL remains invisible to retrieval and therefore unavailable to downstream assistants.
 *
 * In the broader kit, this flow sits in the ingestion side of the pipeline rather than the conversational side. It is one of the source-specific indexation flows that feed the common vector store. Assistant flows for web chat, Slack, or Microsoft Teams then retrieve from that index during RAG execution. Conceptually, this flow covers the extract-normalize-embed-index portion of the plan-retrieve-synthesize chain.
 *
 * ## When To Use
 * - Use when relevant knowledge is stored in a PostgreSQL database table or view rather than in files, websites, or cloud document systems.
 * - Use when you need to keep a vector index in sync with Postgres content on a scheduled basis using incremental append mode.
 * - Use when the assistant should be able to answer questions grounded in structured or semi-structured database records.
 * - Use when a specific schema and table or view can be identified as the source of truth for the content to index.
 * - Use when you want row-level data transformed into chunked text and metadata before indexing into a shared vector database.
 *
 * ## When Not To Use
 * - Do not use when the source content lives in Google Drive, SharePoint, OneDrive, S3, websites, or other systems handled by sibling indexation flows.
 * - Do not use when no PostgreSQL credentials have been configured or the target schema and table cannot be selected.
 * - Do not use when the desired source is not row-oriented database content and would be better processed as documents or crawled pages.
 * - Do not use when you need ad hoc question answering directly from a user query; assistant flows, not indexation flows, handle live retrieval and response generation.
 * - Do not use when the target vector database has not been configured, because this flow only prepares and writes vectors; it does not provision the destination store.
 * - Do not use when you require strict real-time CDC semantics; this flow is configured for scheduled `incremental_append` ingestion rather than a custom streaming replication pattern.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | The PostgreSQL credential set used to authenticate to the source database. |
 * | `schemas` | `select` | Yes | The source schema to read from. Loaded dynamically from the selected Postgres connection. |
 * | `tables` | `select` | Yes | The source table or view to batch process. Loaded dynamically from the selected schema. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used to enrich records with standard fields. This flow expects keys `title` and `source`. |
 * | `embeddingModelName` | `model` | Yes | The text embedding model used to convert chunked row content into vectors. |
 * | `vectorDB` | `select` | Yes | The target vector database where vectors and metadata will be indexed. |
 *
 * Below the table, the key constraints are operational rather than schema-heavy. `schemas` and `tables` are not free-text fields; they are selected from values discoverable through the configured Postgres connection. The `mapping` input must provide the keys `title` and `source`; in the exported configuration it defaults to `title = table_name` and `source = postgres`. The embedding model must support text embedding, and the vector database must be compatible with the indexing node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | The vector payload prepared for indexing, derived from embedded row chunks. |
 * | `metadata` | `array` | Metadata objects aligned to the indexed vectors. |
 * | `indexingResult` | `object` | The result returned by the vector indexing operation, typically indicating success or overwrite behavior for matching primary keys. |
 *
 * The flow’s effective output is a structured indexing payload and the write result from the destination vector database. Internally, the final indexing node consumes `vectors` and `metadata` from the metadata transformation step, then writes them to the configured vector store. Depending on how this flow is invoked in Lamatic, the externally visible response may primarily reflect the terminal indexing outcome rather than exposing every intermediate field directly.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point ingestion flow. No other flow must run before it.
 *
 * Within the broader agent architecture, operators typically run this flow before any assistant flow that depends on retrieval from the shared vector store. The practical prerequisite is not another flow invocation but a populated Postgres source and a configured vector database.
 *
 * ### Downstream Flows
 * - Assistant flows in the parent bundle consume the indexed records indirectly by querying the shared vector store during RAG retrieval.
 * - Web, Slack, or Microsoft Teams assistant flows depend on this flow having populated the vector database with relevant embeddings and metadata.
 * - The specific fields they rely on are the indexed vector entries and their metadata, especially whatever source-identifying information is preserved in `metadata`.
 *
 * ### External Services
 * - PostgreSQL — source system from which schema and table data are read — required credential: selected `credentials`
 * - Embedding model provider — converts row chunks into embeddings — required configuration: selected `embeddingModelName`
 * - Vector database — destination store for vectors and metadata — required configuration: selected `vectorDB`
 * - Lamatic scheduling/runtime — executes the trigger on the configured cron schedule — required project runtime configuration
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow definition.
 * - Connector-specific secrets are expected to be supplied through Lamatic private inputs such as `credentials`, `embeddingModelName`, and `vectorDB` rather than named environment variables in this flow export.
 *
 * ## Node Walkthrough
 * 1. `Postgres` (`triggerNode`) starts the flow by connecting to the selected PostgreSQL source using the configured `credentials`. It is set to run on a daily cron schedule and uses `incremental_append` sync mode, with the operator selecting the source `schemas` and `tables` values that identify which table or view should be ingested.
 *
 * 2. `Variables` (`variablesNode`) establishes lightweight, standardized field mappings for downstream processing. In the current configuration it maps `title` to `table_name` and `source` to `postgres`, giving later steps consistent metadata fields even though the raw source is a database table.
 *
 * 3. `Row Chunking` (`codeNode`) runs the referenced script `@scripts/postgres_row-chunking.ts`. Its job is to take the rows obtained from the Postgres trigger and turn them into text chunks suitable for embedding. This is the normalization step that converts row-shaped data into retrieval-friendly textual units.
 *
 * 4. `Vectorise` (`dynamicNode`) sends the chunked text from `{{codeNode_331.output}}` to the selected embedding model. It produces vector embeddings for each chunk, preserving the correspondence between source text and generated vectors for later indexing.
 *
 * 5. `Transform Metadata` (`codeNode`) runs the referenced script `@scripts/postgres_transform-metadata.ts`. This step combines the vectorization output with source-aware fields and produces the final `vectors` and `metadata` structures expected by the indexing layer.
 *
 * 6. `Index to DB` (`dynamicNode`) writes the prepared `vectors` and `metadata` into the selected vector database. It is configured with `duplicateOperation = overwrite`, so records matching the configured primary key pair `title` and `content` are overwritten instead of duplicated. This is the persistence step that makes the ingested Postgres content available for downstream retrieval.
 *
 * 7. `addNode` (`addNode`) is a terminal placeholder node with no configured business logic in the export. It marks the end of the flow graph after indexing completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Connection to Postgres fails at startup | `credentials` are missing, invalid, or no longer authorized for the target database | Reconfigure the selected Postgres credential in Lamatic, verify host/network access, and confirm the account can read the chosen schema and table |
 * | Schema list is empty or schema selection fails | The configured database user cannot enumerate schemas, or the connection points to the wrong database | Verify database permissions, correct the connection target, and ensure the user can list schemas |
 * | Table or view list is empty | The selected schema contains no accessible tables/views, or permissions are insufficient | Confirm the correct schema was chosen and grant read access to the intended table or view |
 * | Flow runs but indexes no content | The source table returned no eligible rows, incremental sync found nothing new, or the chunking script produced empty output | Inspect source data availability, review incremental state assumptions, and test the row chunking script with sample records |
 * | Embedding step fails | `embeddingModelName` is not configured, unavailable, or incompatible with the payload size/content | Select a valid text embedding model, verify model access, and reduce or reshape chunk sizes if needed |
 * | Indexing step fails | `vectorDB` is not configured correctly or the destination store rejected the payload | Validate vector database credentials and collection configuration, and confirm the destination accepts the produced vector dimensions and metadata shape |
 * | Duplicate records are unexpectedly replaced | The indexing node uses `duplicateOperation = overwrite` with primary keys `title` and `content` | Change key strategy or duplicate handling if overwrite behavior is not desired, and ensure `title`/`content` uniquely identify intended records |
 * | Metadata looks wrong or incomplete | The `mapping` values or metadata transform script do not align with the source schema | Review the `mapping` input and the `postgres_transform-metadata` script assumptions against the actual source columns |
 * | Assistant flows cannot answer from Postgres data after indexing | This flow did not complete successfully, indexed the wrong table, or wrote into an unexpected vector database | Confirm a successful indexing result, verify the selected table and vector store, and ensure assistant flows are pointed at the same shared index |
 * | Invocation assumes another flow should have prepared data first | This flow is an entry-point ingestion flow and does not consume outputs from sibling flows | Run it directly with valid Postgres and vector store configuration; do not wait for another indexation flow to seed its inputs |
 *
 * ## Notes
 * - The flow is configured for scheduled execution with cron expression `0 0 00 1/1 * ? * UTC`, which corresponds to a daily run in UTC.
 * - The sync mode is `incremental_append`, so operators should understand how source-side change detection is handled by the underlying Postgres connector.
 * - The metadata standardization is partly driven by the `mapping` input and partly by custom scripts, so source schema changes may require script updates rather than only UI-level reconfiguration.
 * - The indexing node includes a `webhookURL` in its configuration, but the exported flow does not explain any operational dependency on that endpoint. Treat it as implementation detail unless your deployment specifically uses it.
 * - Because `title` is mapped from `table_name` by default, record uniqueness may depend heavily on how the chunking and metadata scripts populate `content` and related fields.
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
