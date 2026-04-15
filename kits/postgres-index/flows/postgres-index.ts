/*
 * # Postgres Index
 * A scheduled ingestion flow that syncs records from Postgres into a Lamatic vector index, serving as the pipeline’s extraction-and-indexing entry point for retrieval workloads.
 *
 * ## Purpose
 * This flow is responsible for turning operational data stored in Postgres into vector-searchable assets inside Lamatic. It solves the sub-task of recurring database ingestion: connecting to a Postgres source on a schedule, extracting rows, transforming them into aligned metadata and vectorizable text, generating embeddings, and writing the results into a vector index.
 *
 * The outcome is an updated Lamatic index that reflects new or changed database records. That matters because downstream semantic search, retrieval-augmented generation, clustering, and similarity workflows all depend on this indexed representation being current, structured, and consistently keyed. Without this flow, the wider system would have no reliable bridge between source-of-truth relational data and retrieval-ready vector storage.
 *
 * Within the broader agent architecture, this flow sits at the ingestion side of the pipeline rather than the query-time reasoning side. In plan-retrieve-synthesize terms, it prepares the retrieval substrate: it does not answer user questions directly, but it ensures the retrieval layer has fresh embeddings and metadata available for later search and synthesis flows.
 *
 * ## When To Use
 * - Use when you need to keep a Lamatic vector index synchronized with data stored in a Postgres database.
 * - Use when ingestion should happen automatically on a schedule rather than via manual export and upload.
 * - Use when source records must be transformed into both structured `metadata` and embedding-ready `vectorData` before indexing.
 * - Use when new or updated database rows should be appended incrementally and indexed for semantic retrieval.
 * - Use when downstream applications depend on searchable embeddings derived from relational records.
 * - Use when an operator is deploying a recurring ETL-style pipeline as an entry-point flow in the agent kit.
 *
 * ## When Not To Use
 * - Do not use when the source system is not Postgres or when data originates from files, web pages, SaaS apps, or another database connector.
 * - Do not use when no Postgres credentials, table configuration, or index destination have been set.
 * - Do not use when you need an on-demand user-triggered query flow rather than scheduled background ingestion.
 * - Do not use when records should not be vectorized, such as purely transactional data with no retrieval or semantic search use case.
 * - Do not use when schema-to-text transformation logic in `Make MetaData and VectorData` has not been adapted to the source table shape.
 * - Do not use when a sibling ingestion flow for another source system is the correct connector for the dataset.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | Trigger payload | `object` | No | This flow does not accept a user-supplied runtime input payload. It is invoked by schedule and reads from configured Postgres and indexing resources. |
 *
 * This flow has no declared public trigger inputs in `inputs`. Its effective runtime inputs are operational configuration values inside nodes, including the Postgres connection, source table selection, cron schedule, vector model selection, and destination vector database/index settings. The flow assumes those values are configured correctly in Lamatic before deployment.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | Flow response | `object` | The terminal response is whatever Lamatic exposes after the final indexing step; the flow itself does not declare a custom response schema in source. |
 * | `vectors` | `array` | Generated embeddings produced by the `Vectorize` node and passed into indexing. |
 * | `MetaData` | `array` | Structured metadata records produced by `Make MetaData and VectorData` and supplied to the index node. |
 *
 * In practice, this flow behaves like a background indexing pipeline rather than a request-response API with a rich business payload. Its meaningful outputs are intermediate artifacts used internally for indexing: a list of vector embeddings and a list of aligned metadata objects. The terminal response is implementation-dependent and may primarily reflect indexing completion or node execution status rather than a developer-facing document payload.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow triggered on a schedule.
 * - It does not consume outputs from another flow; instead, it reads directly from the configured Postgres source.
 *
 * ### Downstream Flows
 * - No direct downstream flow dependencies are defined in the provided kit materials.
 * - Indirectly, any retrieval, semantic search, or RAG flow that queries the Lamatic vector index depends on this flow having populated that index with current data.
 * - Those downstream consumers rely on the indexed vectors derived from `vectorizeNode_738.output.vectors` and the structured records derived from `codeNode_858.output.MetaData`, even though they do not consume them as immediate flow-to-flow API fields.
 *
 * ### External Services
 * - Postgres — source database read for rows to ingest — requires configured Postgres credentials in the `Postgres` node
 * - Lamatic vectorization service / embedding model — converts `vectorData` text into embeddings — requires an embedding model configured in the `Vectorize` node
 * - Lamatic vector index / vector database — stores embeddings and metadata for retrieval — requires vector database configuration in the `Index Translation` node
 * - Custom transformation script runtime — executes the referenced script that maps source rows into `MetaData` and `vectorData` — uses the script referenced by `@scripts/postgres-index_make-metadata-and-vectordata.ts`
 *
 * ### Environment Variables
 * - No explicit environment variable names are declared in the provided flow source.
 * - Postgres connection secrets — used by the `Postgres` node through its configured credentials binding
 * - Vector database credentials or index access settings — used by the `Index Translation` node through its configured `vectorDB` binding
 * - Model provider credentials, if required by the selected embedding backend — used by the `Vectorize` node and potentially the `Index Translation` node depending on deployment configuration
 *
 * ## Node Walkthrough
 * 1. `Postgres` (`triggerNode` using `postgresNode`)
 *    - This is the scheduled entry point for the flow. It runs on the cron expression `0 0 00 1/1 * ? * UTC`, which indicates a daily schedule in UTC.
 *    - The node is configured for `incremental_append` sync mode, so it is intended to ingest new data incrementally rather than fully replacing the source snapshot on each run.
 *    - It connects to the configured Postgres instance, reads from the selected table set, and emits source rows into the pipeline. The exact tables and credentials are left blank in the template and must be supplied during setup.
 *
 * 2. `Make MetaData and VectorData` (`dynamicNode` using `codeNode`)
 *    - This node runs the referenced script `@scripts/postgres-index_make-metadata-and-vectordata.ts`.
 *    - It transforms raw Postgres rows into two aligned outputs: `MetaData`, which contains the structured fields that should accompany each vector in the index, and `vectorData`, which contains the text content that should be embedded.
 *    - This is the schema-mapping step of the flow. It determines which fields become searchable text, which fields remain metadata, and how source records are normalized before vectorization.
 *
 * 3. `Vectorize` (`dynamicNode` using `vectorizeNode`)
 *    - This node takes `{{codeNode_858.output.vectorData}}` as its `inputText`.
 *    - It sends that text payload to the configured embedding model and produces vector embeddings as `vectors`.
 *    - The quality and dimensionality of the resulting embeddings depend on the embedding model chosen in the node configuration, which is left unspecified in the template and must be configured for deployment.
 *
 * 4. `Index Translation` (`dynamicNode` using `IndexNode`)
 *    - This node writes the generated embeddings into the destination vector store.
 *    - It receives vectors from `{{vectorizeNode_738.output.vectors}}` and metadata from `{{codeNode_858.output.MetaData}}`, preserving the alignment between each embedded text item and its associated metadata record.
 *    - The node is configured with `duplicateOperation` set to `overwrite`, which means existing indexed records matching the configured primary key strategy should be replaced rather than duplicated.
 *    - The destination `vectorDB`, `primaryKeys`, embedding model, and generative model settings are placeholders in the template and must be configured before the flow can run successfully.
 *
 * 5. Unnamed terminal node (`addNode`)
 *    - This final node is a structural endpoint in the exported flow graph.
 *    - It does not expose any additional business logic in the provided source, and it mainly marks the end of the execution chain after indexing completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at startup or cannot connect to source database | Missing or invalid Postgres credentials in the `Postgres` node | Configure the correct Postgres connection binding, verify host/user/password/database settings, and retest connectivity |
 * | Scheduled run executes but no records are indexed | `tables` selection is empty, the source query returns no rows, or incremental sync finds no new data | Configure the source tables explicitly, confirm the source contains eligible rows, and verify the incremental sync logic matches the schema |
 * | Transformation step fails in `Make MetaData and VectorData` | The custom script does not match the shape of the incoming Postgres rows | Update `@scripts/postgres-index_make-metadata-and-vectordata.ts` so it correctly maps the actual columns and returns aligned `MetaData` and `vectorData` outputs |
 * | Vectorization fails | No embedding model is configured or provider credentials are missing | Select a supported embedding model in `Vectorize` and ensure any required provider credentials are available in the environment |
 * | Indexing fails in `Index Translation` | `vectorDB` is not configured, credentials are missing, or primary key settings are invalid | Configure the target vector database/index, verify access credentials, and define stable `primaryKeys` for overwrite behavior |
 * | Records are indexed with poor retrieval quality | `vectorData` is malformed, too sparse, or not representative of the source content | Improve the transformation script so text chunks are coherent, descriptive, and consistently structured before embedding |
 * | Duplicate or inconsistent records appear in the index | Primary key mapping is missing or does not uniquely identify source rows | Set `primaryKeys` to stable source identifiers and confirm `duplicateOperation` should remain `overwrite` |
 * | Flow appears to run successfully but downstream retrieval has stale data | Cron has not run yet, schedule is misconfigured, or incremental logic is excluding expected updates | Validate the cron schedule, check execution history, and review how changed rows are detected in the Postgres source |
 * | A caller expects request-time inputs or a direct API payload result | This flow is schedule-driven and does not define public runtime inputs or a rich synchronous response schema | Route request-time use cases to a separate retrieval or application flow; use this flow only for background ingestion |
 * | Upstream flow not having run | Not applicable as a hard dependency, but downstream retrieval systems may appear empty if this entry-point ingestion flow has never completed successfully | Run and validate this flow first before testing any consumer that depends on the populated vector index |
 *
 * ## Notes
 * - The template leaves several critical configuration fields blank, including Postgres credentials, source tables, vector database destination, primary keys, and model selections. It is not deployable as-is without setup.
 * - Although the README mentions checking for new files, the actual source connector in this flow is Postgres rows, not file storage. Treat this as a database ingestion pattern.
 * - The field name `MetaData` is capitalized exactly as emitted by the transformation node and should be preserved when wiring downstream references.
 * - Because the flow uses incremental append semantics plus overwrite behavior at indexing time, correct source identifiers are essential to avoid duplication and stale records.
 * - The final `addNode` is not semantically meaningful for business logic and should not be treated as a source of output data.
 */

// Flow: postgres-index
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Postgres Index",
  "description": "This template indexes data from a PostgresDB, periodically running a cron job to check for new files. It helps teams set up automatic data pipelines from Postgres, vectorizing and indexing data to Lamatic.",
  "tags": [
    "🚀 Startup",
    "🛢️ Database"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/postgres-index",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "postgres_index_make_metadata_and_vectordata": "@scripts/postgres-index_make-metadata-and-vectordata.ts"
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
      "trigger": true,
      "values": {
        "nodeName": "Postgres",
        "tables": "",
        "syncMode": "incremental_append",
        "credentials": "",
        "cronExpression": "0 0 00 1/1 * ? * UTC"
      }
    }
  },
  {
    "id": "codeNode_858",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Make MetaData and VectorData",
        "code": "@scripts/postgres-index_make-metadata-and-vectordata.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_738",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_858.output.vectorData}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "IndexNode_451",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index Translation",
        "vectorDB": "",
        "primaryKeys": "",
        "vectorsField": "{{vectorizeNode_738.output.vectors}}",
        "metadataField": "{{codeNode_858.output.MetaData}}",
        "duplicateOperation": "overwrite",
        "embeddingModelName": {},
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "addNode_565",
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
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_858",
    "source": "triggerNode_1",
    "target": "codeNode_858",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_858-vectorizeNode_738",
    "source": "codeNode_858",
    "target": "vectorizeNode_738",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_738-IndexNode_451",
    "source": "vectorizeNode_738",
    "target": "IndexNode_451",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_451-addNode_565",
    "source": "IndexNode_451",
    "target": "addNode_565",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
