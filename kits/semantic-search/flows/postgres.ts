/*
 * # Postgres
 * A flow that incrementally ingests rows from a Postgres table or view, converts them into embeddings, and indexes them into a vector database as one of the structured-data ingestion paths in the wider Semantic Search system.
 *
 * ## Purpose
 * This flow is responsible for turning relational data stored in Postgres into searchable vector representations. In the Semantic Search kit, different source-specific indexation flows normalize content from different systems into a common downstream shape for retrieval. This Postgres flow handles the structured-database case: it reads from a selected schema and table or view, derives source metadata, chunks row content into indexable text units, embeds those chunks, and writes vectors plus metadata into the configured vector database.
 *
 * The outcome is a vectorized index of Postgres-backed content that can be searched semantically by the retrieval side of the bundle. That matters because many knowledge sources live in application databases rather than documents or web pages. By converting rows into retrieval-friendly text and preserving metadata such as source and title, this flow makes database content discoverable through natural-language search alongside content indexed from other sources.
 *
 * Within the broader agent pipeline, this is an indexation flow rather than a retrieval or synthesis flow. It sits on the ingestion side of the chain: source extraction and normalization first, then chunking, embedding, and indexing. Downstream retrieval flows rely on the vector records this flow produces, but this flow itself is an entry-point ingestion workflow triggered by operator configuration and scheduled sync execution rather than by an end-user search query.
 *
 * ## When To Use
 * - Use when the content to be indexed lives in a Postgres database table or view rather than in files, web pages, or cloud storage.
 * - Use when you want structured relational data to participate in the same semantic search experience as other indexed sources.
 * - Use when a recurring batch sync from Postgres is needed; the trigger is configured for scheduled incremental append ingestion.
 * - Use when you can identify a specific `schema` and `table/view` to ingest and have valid Postgres credentials available in Lamatic.
 * - Use when you want row content chunked and embedded automatically before being written to a vector database.
 *
 * ## When Not To Use
 * - Do not use when the source content is in Google Drive, S3, SharePoint, OneDrive, Sheets, or a website; those are handled by sibling indexation flows in the kit.
 * - Do not use when no Postgres credentials have been configured or when the target schema and table cannot be selected.
 * - Do not use when you need ad hoc semantic retrieval over an already-built index; that is the job of the retrieval/search flow, not this ingestion flow.
 * - Do not use when the source is not row-oriented relational data, since the chunking and metadata scripts are clearly tailored to Postgres row processing.
 * - Do not use when you require a custom conflict strategy other than `overwrite` for duplicate indexed records, because this flow is preconfigured to overwrite on duplicate keys.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | Postgres authentication credentials used by the trigger node to connect to the source database. |
 * | `schemas` | `select` | Yes | Source Postgres schema to read from. The options are loaded dynamically from the selected database connection. |
 * | `tables` | `select` | Yes | Source table or view within the selected schema for batch ingestion. The options are loaded dynamically from the selected schema. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used to shape metadata fields for downstream processing. This flow expects keys `title` and `source`. |
 * | `vectorDB` | `select` | Yes | Target vector database where generated embeddings and metadata will be indexed. |
 * | `embeddingModelName` | `model` | Yes | Embedding model used to convert chunked Postgres row text into vector representations. |
 *
 * Below the table, the main validation assumption is that `schemas` and `tables` must be resolvable from the selected `credentials`, and that the chosen embedding model supports `embedder/text`. The `mapping` input is defined with required keys `title` and `source`; this exported flow defaults them to `table_name` and `postgres` respectively. No explicit length limits are declared in the flow, but row content quality and size directly affect chunking volume, embedding latency, and indexing throughput.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `status` | `string` | Implicit operational outcome of the indexing run, typically derived from the final indexing step. |
 * | `indexedCount` | `number` | The number of vectors or documents successfully written to the target vector database, if exposed by the runtime. |
 * | `metadata` | `object[]` | Metadata objects prepared for indexed records, including mapped source-level fields such as `title` and `source`, plus row-derived metadata produced by the transformation script. |
 * | `vectors` | `number[][]` | Embedding vectors generated from chunked row text and passed into the index step. |
 *
 * Below the table, the flow’s effective output is a structured indexing result rather than a prose response. The final meaningful payload before the terminal add node is the pair of fields consumed by `Index to DB`: `vectors` and `metadata`. Depending on runtime behavior, the externally visible API response may be minimal and focused on indexation success rather than returning all vectors directly. Developers should treat this flow primarily as a side-effecting ingestion pipeline whose main result is persisted data in the configured vector store.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a standalone entry-point ingestion flow. No other flow must run before it.
 * - Operationally, it does depend on source data already existing in the selected Postgres schema and table or view.
 * - In the broader bundle, it participates as one of several parallel indexation options that populate the shared semantic search corpus.
 *
 * ### Downstream Flows
 * - The bundle’s semantic retrieval/search flow consumes the vector records written by this flow into the shared vector database.
 * - That downstream retrieval flow depends on the persisted indexed artifacts produced here, especially the stored embeddings and associated metadata fields needed to render source-backed search results.
 * - No other direct flow-to-flow handoff is encoded inside this flow file; the integration point is the vector database itself.
 *
 * ### External Services
 * - Postgres — source relational database read during trigger-driven ingestion — requires configured `credentials`
 * - Embedding model provider exposed through Lamatic model selection — converts chunked text into vectors — requires the selected `embeddingModelName` and any provider-specific credentials configured in the workspace
 * - Vector database — stores generated vectors and metadata for later retrieval — requires selected `vectorDB`
 * - Airbyte-style schema and stream discovery behind the source selector — loads available `schemas` and `tables` from the Postgres connection — requires valid source credentials
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Provider-specific secrets for the selected embedding model or vector database may still be required at the Lamatic workspace or connector level, but they are not named in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `Postgres` (`triggerNode`) starts the flow by connecting to the configured Postgres source using the selected `credentials`, `schemas`, and `tables`. It is configured for `incremental_append` sync mode and a daily cron schedule of `0 0 00 1/1 * ? * UTC`, so its role is to fetch rows from the chosen table or view on a recurring basis for ingestion.
 * 2. `Variables` (`variablesNode`) defines and passes forward the metadata mapping used by the rest of the flow. In this exported configuration, it maps `title` to `table_name` and `source` to `postgres`, giving the downstream scripts a consistent source label and a title field basis for indexed records.
 * 3. `Row Chunking` (`codeNode`) runs the `@scripts/postgres_row-chunking.ts` script. This is the source-specific normalization step that takes the Postgres rows from the trigger and the variable mapping from the previous node, then converts row content into chunkable text units suitable for embedding. Its output is passed directly as `inputText` into the vectorization step.
 * 4. `Vectorise` (`dynamicNode` using `vectorizeNode`) sends the chunked text from `{{codeNode_331.output}}` to the selected text embedding model. It transforms the row-derived chunks into vector embeddings while preserving ordering so they can later be re-associated with metadata.
 * 5. `Transform Metadata` (`codeNode`) runs the `@scripts/postgres_transform-metadata.ts` script. This step combines upstream context with the generated embeddings to produce the exact structures expected by the indexing node: a `vectors` field containing embeddings and a `metadata` field containing per-record metadata objects.
 * 6. `Index to DB` (`dynamicNode` using `IndexNode`) writes the prepared `vectors` and `metadata` into the chosen vector database. It uses `title` and `content` as `primaryKeys` and is configured with `duplicateOperation` set to `overwrite`, so repeated ingestions replace existing indexed records that collide on those keys.
 * 7. `addNode` (`addNode`) is the terminal placeholder node after indexing. It does not introduce any meaningful business logic in the exported flow and mainly marks the end of the execution chain.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Connection to source fails before ingestion starts | Invalid or missing `credentials` for the Postgres source | Reconfigure the `credentials` input in Lamatic and verify network access, host, database, username, and password for the selected Postgres instance |
 * | No schemas or tables appear in the input selectors | The selected credentials cannot enumerate the source, or the database user lacks discovery permissions | Confirm the Postgres user can list schemas and tables, then refresh the dynamic selectors |
 * | Flow runs but indexes nothing | The selected table/view is empty, incremental sync finds no new rows, or the row chunking script produces no chunkable output | Validate source data exists, check sync state, and inspect the row-shaping logic used by `postgres_row-chunking.ts` |
 * | Embedding step fails | `embeddingModelName` is not configured correctly, the selected model is unavailable, or provider credentials are missing at the workspace level | Select a valid text embedding model and verify the backing model provider is configured in Lamatic |
 * | Indexing step fails with duplicate or schema-related issues | The target vector database is misconfigured, the expected metadata shape is invalid, or the index rejects the supplied keys/fields | Verify the selected `vectorDB`, check index schema compatibility, and ensure the metadata transform script outputs fields expected by the target index |
 * | Search flow cannot find Postgres content after a seemingly successful run | The downstream retrieval flow is pointed at a different vector index, or this flow wrote incomplete metadata/vectors | Confirm both ingestion and retrieval flows target the same vector database and collection/index configuration |
 * | Metadata fields look wrong in search results | The `mapping` values for `title` and `source` do not match the intended row fields or source labels | Adjust the `mapping` input so `title` references the desired source field and `source` uses the correct source identifier |
 * | Flow cannot continue after source extraction | Upstream source payload is malformed or the Postgres row-chunking script expects fields not present in the selected table/view | Inspect the source schema, test with representative rows, and update the source-specific script or mapping configuration |
 *
 * ## Notes
 * - This flow is configured as a scheduled ingestion job, not a user-facing request/response flow. Its core value is the side effect of populating the vector database.
 * - The trigger uses `incremental_append`, which suggests repeated runs are intended to add newly available data over time; however, the exact incremental cursor behavior is managed by the underlying source connector rather than shown in this flow definition.
 * - Duplicate handling in the indexing node is fixed to `overwrite`. That is useful for keeping records fresh, but it also means reprocessing may replace previously indexed content for the same `primaryKeys`.
 * - The indexing node uses `title` and `content` as `primaryKeys`. Developers should ensure the upstream scripts consistently produce those fields or compatible equivalents in the metadata/document structure expected by the indexer.
 * - A `webhookURL` is present in the index node configuration, but no behavior in the flow definition explains it or exposes it as an interface contract. Treat it as internal node configuration rather than part of the public API for this flow.
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
