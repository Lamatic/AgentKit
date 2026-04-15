/*
 * # Vectorize Google Drive
 * A scheduled ingestion flow that pulls content from Google Drive, chunks and vectorizes it, then indexes it into a vector database for downstream semantic search and RAG.
 *
 * ## Purpose
 * This flow is responsible for converting Google Drive content into retrieval-ready vector records. It solves the ingestion side of the problem: source documents in Drive are not directly useful to semantic search systems until their text has been extracted, split into embedding-friendly chunks, transformed into vectors, and stored with usable metadata in a vector database.
 *
 * The outcome is a searchable vector index grounded in your organization’s Drive data. That matters because downstream assistants and search experiences rely on this indexed corpus to retrieve relevant passages by meaning rather than by exact keyword match. Without this flow, the wider system has no normalized knowledge base to query.
 *
 * In the broader pipeline, this flow sits firmly in the indexing and preparation stage of a retrieve-based architecture. It is the entry point for building the knowledge layer that later query or RAG flows depend on. It does not answer questions itself; it prepares the corpus that those later retrieval and synthesis steps use.
 *
 * ## When To Use
 * - Use when you need to ingest documents from Google Drive into a vector database for the first time.
 * - Use when Google Drive content changes and you want to append newly discovered content using the configured incremental sync behavior.
 * - Use when you are preparing a private knowledge base that will later be queried by semantic search or RAG flows.
 * - Use when you want a scheduled indexing job rather than an interactive user-facing response flow.
 * - Use when your downstream application expects embeddings and metadata to already exist in a vector store.
 *
 * ## When Not To Use
 * - Do not use when the goal is to answer a user question directly; this flow indexes data but does not retrieve or synthesize responses.
 * - Do not use when Google Drive credentials or connector configuration have not been set up.
 * - Do not use when no vector database target has been configured in the `Index to DB` node.
 * - Do not use when your source content is not in Google Drive; a different ingestion flow should handle other repositories.
 * - Do not use when you need full reindex semantics and the configured `incremental_append` sync mode does not match your operational requirement.
 * - Do not use when documents contain no extractable text, since chunking and embedding will produce little or no useful output.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | None | N/A | No | This flow exposes no runtime trigger input fields in `inputs`. Source selection and operational behavior are configured inside the nodes rather than passed as API payload fields. |
 *
 * This flow has no declared public trigger inputs. In practice, execution depends on node-level configuration for the Google Drive connection, source scope such as folder selection, embedding model selection, and vector database destination. Any validation therefore happens primarily through connector setup and node configuration rather than request-body schema validation.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | Response payload | implementation-defined object | The exported flow does not declare an explicit response-mapping node with named fields. The effective result is the terminal outcome of the indexing pipeline, typically the success or failure status returned by the final indexing stage. |
 *
 * The flow behaves like an ingestion job rather than a data-returning query endpoint. Its output is best understood as an execution result indicating whether indexing completed, not as a structured business payload containing the indexed documents. Because the terminal node is an `addNode` placeholder with no configured response fields, consumers should treat this flow primarily as a side-effecting operation that writes to a vector store.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a standalone entry-point flow for the kit.
 * - No upstream Lamatic flow is required to supply runtime data before this flow can run.
 * - Operational prerequisites still apply: the Google Drive connector, embedding model, and vector database must already be configured.
 *
 * ### Downstream Flows
 * - Downstream retrieval or RAG flows outside this template are expected to consume the vector records written by this flow.
 * - Those downstream flows typically depend on the indexed vectors and associated metadata stored by `Index to DB`, rather than on a direct API response field from this flow.
 * - No additional downstream flow is defined inside the provided kit materials.
 *
 * ### External Services
 * - Google Drive API or Lamatic Google Drive connector — used to fetch file content from Drive on a schedule — requires Google Drive credentials configured on the `Google Drive` node.
 * - Embedding model service — used to convert chunk text into vectors — requires an embedding model selection on the `Get Vectors` node.
 * - Vector database — used to persist vectors and metadata for retrieval — requires vector store configuration on the `Index to DB` node.
 * - Webhook endpoint — present as a configured URL on the indexing node, likely for notification, callback, or integration behavior — uses the `webhookURL` configured on `Index to DB`.
 *
 * ### Environment Variables
 * - No explicit environment variable names are declared in the exported flow source.
 * - Google Drive authentication settings are required in practice — used by `Google Drive`.
 * - Embedding provider credentials are required in practice — used by `Get Vectors`.
 * - Vector database credentials and endpoint settings are required in practice — used by `Index to DB`.
 *
 * ## Node Walkthrough
 * 1. `Google Drive` (`googleDriveNode`)
 *    - This is the trigger node and entry point for the flow. It is configured to run on a daily cron schedule using `0 0 00 1/1 * ? * UTC`.
 *    - The node reads from Google Drive using a list-style `folderUrl` mode and incremental sync behavior set to `incremental_append`.
 *    - Its key contribution to the pipeline is `triggerNode_1.output.content`, which provides the raw text content that later nodes process.
 *
 * 2. `chunking` (`chunkNode`)
 *    - This node splits `{{triggerNode_1.output.content}}` into smaller pieces suitable for embedding.
 *    - It uses recursive character splitting with separators `\n\n`, `\n`, and space, targeting chunks of `200` characters with `20` characters of overlap.
 *    - The goal is to preserve semantic continuity while keeping chunks small enough for reliable embedding and later retrieval.
 *
 * 3. `Extract Chunked Text` (`codeNode`)
 *    - This custom script node runs `@scripts/vectorize-google-drive_extract-chunked-text.ts`.
 *    - It takes the chunking output and extracts or reshapes the chunk payload into the text array or text structure expected by the embedding node.
 *    - In this flow, its output is used directly as the `inputText` to the vectorization step.
 *
 * 4. `Get Vectors` (`vectorizeNode`)
 *    - This node receives `{{codeNode_539.output}}` as the text to embed.
 *    - It sends the chunked text to the configured embedding model and returns vector representations for each chunk.
 *    - These vectors are not yet indexed; they are intermediate artifacts that still need to be paired with normalized metadata.
 *
 * 5. `Transform Metadata` (`codeNode`)
 *    - This custom script node runs `@scripts/vectorize-google-drive_transform-metadata.ts`.
 *    - It processes the vectorization output into the exact field structure expected by the indexing node, exposing `output.vectors` and `output.metadata`.
 *    - This is where embedding results and source-related metadata are aligned so the vector database can store both together.
 *
 * 6. `Index to DB` (`IndexNode`)
 *    - This node writes `{{codeNode_560.output.vectors}}` and `{{codeNode_560.output.metadata}}` to the configured vector database.
 *    - It is set to use `overwrite` for duplicate handling, meaning existing records with matching keys are replaced rather than duplicated.
 *    - The node also contains a configured `webhookURL`, which may support notification or integration behavior depending on the runtime implementation.
 *    - This is the operationally important side-effect of the flow: the vector store becomes populated or updated with Google Drive-derived knowledge.
 *
 * 7. `addNode_545` (`addNode`)
 *    - This terminal placeholder node has no configured business logic.
 *    - It marks the end of the exported graph and does not add additional transformation or response mapping in the provided definition.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at `Google Drive` before any content is processed | Missing, invalid, or expired Google Drive credentials | Reconnect the Google Drive account or update the credentials configured on the `Google Drive` node. |
 * | Flow runs but no documents are indexed | The Drive source configuration resolves to no files, or the incremental sync found nothing new | Verify the selected Drive scope, folder configuration, and whether new or changed files actually exist since the last run. |
 * | `chunking` produces empty or unusable output | `triggerNode_1.output.content` is empty, binary, or not extractable as text | Confirm the Drive files are text-extractable and that the connector is exporting supported document formats correctly. |
 * | Vectorization fails at `Get Vectors` | No embedding model is configured, provider credentials are missing, or the provider request failed | Select a valid embedding model, confirm provider credentials, and retry after checking service availability and rate limits. |
 * | Indexing fails at `Index to DB` | Vector database connection details are incomplete or invalid | Configure the target vector store, credentials, and any required collection or namespace settings on `Index to DB`. |
 * | Records overwrite unexpectedly | `duplicateOperation` is set to `overwrite` | Change duplicate handling if replacement is not desired, or ensure your primary key strategy matches update expectations. |
 * | Metadata or vectors are rejected by the database | The `Transform Metadata` script outputs a shape that does not match the indexer’s expectations | Validate the script output fields `vectors` and `metadata` and align them with the schema required by the selected vector database. |
 * | Flow appears to succeed but downstream RAG cannot find content | The data was indexed into the wrong collection, namespace, or database, or downstream retrieval uses a different embedding/index configuration | Verify the exact vector store destination and ensure downstream retrieval flows query the same index with compatible embeddings. |
 * | Scheduled runs do not occur | The cron schedule is not active in the deployment environment | Confirm the deployed flow has scheduling enabled and that the runtime supports cron-triggered execution. |
 * | A downstream retrieval flow expects this knowledge base but finds nothing | This ingestion flow has not been run successfully yet | Execute this flow first and confirm vectors and metadata are present in the target vector database before invoking retrieval. |
 *
 * ## Notes
 * - The flow declares no public runtime inputs, so most operational control comes from editing node configuration rather than passing parameters at invocation time.
 * - The embedding model and vector database are left blank in the exported source, which means the template is incomplete until those values are configured.
 * - The Google Drive trigger is configured as scheduled despite the parent agent description mentioning manual or API-invoked operation; in practice, the exported flow source should be treated as the authoritative runtime configuration.
 * - Chunking is configured very aggressively at `200` characters with `20` characters overlap. This can improve recall for narrow facts but may increase index size and embedding cost.
 * - The final node does not define a clean response contract. If you need API consumers to receive structured indexing statistics such as document count, chunk count, or upsert status, add an explicit response-mapping step.
 */

// Flow: vectorize-google-drive
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Vectorize Google Drive",
  "description": "Vectorizes Google Drive data and loads it into a vector database. Enables fast, accurate search and RAG Flows grounded in the context of your data.",
  "tags": [
    "🚀 Startup",
    "📱 Apps"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/vectorize-google-drive",
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
    "vectorize_google_drive_extract_chunked_text": "@scripts/vectorize-google-drive_extract-chunked-text.ts",
    "vectorize_google_drive_transform_metadata": "@scripts/vectorize-google-drive_transform-metadata.ts"
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
      "nodeId": "googleDriveNode",
      "modes": {
        "folderUrl": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Google Drive",
        "syncMode": "incremental_append",
        "credentials": "",
        "cronExpression": "0 0 00 1/1 * ? * UTC"
      }
    }
  },
  {
    "id": "chunkNode_934",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "nodeName": "chunking",
        "chunkField": "{{triggerNode_1.output.content}}",
        "numOfChars": 200,
        "separators": [
          "\\n\\n",
          "\\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": "20"
      }
    }
  },
  {
    "id": "codeNode_539",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Extract Chunked Text",
        "code": "@scripts/vectorize-google-drive_extract-chunked-text.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_623",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Get Vectors",
        "inputText": "{{codeNode_539.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_560",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Transform Metadata",
        "code": "@scripts/vectorize-google-drive_transform-metadata.ts"
      }
    }
  },
  {
    "id": "IndexNode_343",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index to DB",
        "vectorDB": "",
        "webhookURL": "https://webhook.site/685a66e7-b4d3-40a4-9801-99e3460414f9",
        "primaryKeys": "",
        "vectorsField": "{{codeNode_560.output.vectors}}",
        "metadataField": "{{codeNode_560.output.metadata}}",
        "duplicateOperation": "overwrite",
        "embeddingModelName": {},
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "addNode_545",
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
    "id": "triggerNode_1-chunkNode_934",
    "source": "triggerNode_1",
    "target": "chunkNode_934",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_934-codeNode_539",
    "source": "chunkNode_934",
    "target": "codeNode_539",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_539-vectorizeNode_623",
    "source": "codeNode_539",
    "target": "vectorizeNode_623",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_623-codeNode_560",
    "source": "vectorizeNode_623",
    "target": "codeNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_560-IndexNode_343",
    "source": "codeNode_560",
    "target": "IndexNode_343",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_343-addNode_545",
    "source": "IndexNode_343",
    "target": "addNode_545",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
