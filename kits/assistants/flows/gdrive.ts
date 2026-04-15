/*
 * # GDrive
 * A flow that ingests documents from a Google Drive folder, converts them into vector embeddings, and indexes them into a vector database for use by the wider internal RAG assistant system.
 *
 * ## Purpose
 * This flow is responsible for turning files stored in Google Drive into retrieval-ready vector records. It solves the ingestion side of the knowledge pipeline for teams whose source material lives in Drive folders rather than on websites, cloud storage buckets, or other enterprise repositories. The flow authenticates against Google Drive, reads folder content through the connector trigger, prepares document text, chunks it into retrieval-sized segments, generates embeddings, and writes those vectors plus normalized metadata into a configured vector database.
 *
 * The outcome is a searchable semantic index of Google Drive content. That matters because the assistant flows in this kit depend on a populated vector store to retrieve grounded evidence before generating answers. Without this indexing step, the downstream assistant cannot answer questions over Drive-hosted knowledge with precision or source traceability.
 *
 * In the broader bundle, this flow sits on the ingestion side of the plan-retrieve-synthesize chain described by the parent agent. It is an entry-point indexation flow, not a conversational flow. Its role is to populate and refresh the retrieval layer so that sibling assistant flows such as web chat, Slack, or Teams can later retrieve the most relevant chunks and synthesize grounded responses.
 *
 * ## When To Use
 * - Use when the knowledge source to ingest is a Google Drive folder.
 * - Use when you want Google Drive documents to become searchable through the kit’s RAG assistants.
 * - Use when a vector store has already been selected and you want to populate or refresh it with Drive content.
 * - Use when operators need scheduled or repeatable ingestion from Drive using configured Google credentials.
 * - Use when the source material is document-centric and can be extracted as text for chunking and embedding.
 *
 * ## When Not To Use
 * - Do not use when the content source is not Google Drive; use the sibling indexation flow for the actual source such as OneDrive, SharePoint, S3, Postgres, Google Sheets, or crawling.
 * - Do not use when no Google Drive credentials have been configured.
 * - Do not use when no vector database is available or selected for `Index to DB`.
 * - Do not use when the target input is a single ad hoc user question; an assistant flow should handle querying, not this ingestion flow.
 * - Do not use when the folder reference is invalid, inaccessible, or points to content the configured account cannot read.
 * - Do not use when you need direct raw file export rather than indexed semantic retrieval records.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | Google Drive authentication credentials used by the trigger connector to access the Drive API. |
 * | `folderUrl` | `resourceLocator` | Yes | The Google Drive folder to ingest. Can be selected from a list or provided directly as a URL. |
 * | `mapping.source` | `string` | Yes | Source value injected by the `Variables` node for metadata mapping. In the exported flow it is set to a fixed Google Drive folder URL. |
 * | `vectorDB` | `select` | Yes | Target vector database where embeddings and metadata will be indexed. |
 * | `embeddingModelName` | `model` | Yes | Embedding model used to convert extracted chunk text into vectors. |
 *
 * Below the table, there are several important input assumptions. The `folderUrl` input is required and must resolve to a Google Drive folder the selected credentials can access. It supports either list selection or URL entry, but the exported node mode defaults to `list`. The flow also assumes the Google Drive connector can extract textual content into `triggerNode_1.output.content`; binary-only or unsupported file types may yield poor or empty indexing results. The `mapping.source` field is technically configurable as a use-case variable, but in this export it is prefilled with a specific folder URL rather than dynamically bound to the chosen `folderUrl`, so operators should verify that metadata source values remain accurate.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Vector representations generated from the extracted and chunked Google Drive document text. Produced for indexing and passed internally through transformed metadata output. |
 * | `metadata` | `array` | Metadata objects aligned to the generated vectors, including at minimum a title derived from the Drive document key and a source value from the variables mapping. |
 * | `indexingResult` | `object` | The effective outcome of the `Index to DB` node after writing vectors and metadata to the selected vector database. Exact shape depends on the backing index connector. |
 *
 * The output is operational rather than user-facing. Internally, the flow works with arrays of chunk texts, embeddings, and metadata records, then writes them to the vector store. The final observable response is typically whatever the index node returns after the write operation, not a prose answer. Completeness depends on connector extraction success, chunking behaviour, embedding generation, and duplicate handling in the vector database.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow.
 * - In the broader kit, it does not consume outputs from another flow before execution. Instead, it is one of several sibling indexation flows that independently populate the shared retrieval layer.
 *
 * ### Downstream Flows
 * - Assistant flows in the parent bundle consume the vector records produced by this flow indirectly through the shared vector store.
 * - Downstream RAG assistants need the indexed chunk embeddings and associated metadata written by this flow, especially source-identifying fields such as `title` and `source`, so retrieval can return grounded context and citations.
 * - No downstream flow is wired directly to this flow’s runtime output within the exported graph; dependency is through persisted vector database state.
 *
 * ### External Services
 * - Google Drive — reads folder content for ingestion — requires configured `credentials` on `Google Drive`.
 * - Embedding model provider — converts chunk text into vector embeddings — requires `embeddingModelName` on `Get Vectors`.
 * - Vector database — stores vectors and metadata for later retrieval — requires `vectorDB` on `Index to DB`.
 * - Lamatic script runtime — executes custom transformation scripts for chunk extraction and metadata shaping — used by `Extract Chunked Text` and `Transform Metadata`.
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow.
 * - Connector credentials and model selections are configured as private inputs rather than named environment variables.
 * - The `Index to DB` node includes a `webhookURL` value in configuration, but this is a node setting in the export, not an environment variable.
 *
 * ## Node Walkthrough
 * 1. `Google Drive` (`triggerNode`): This is the entry point for the flow. It uses the selected Google Drive `credentials` and `folderUrl` to access a Drive folder and pull document content. The trigger is configured for `incremental_append`, indicating the intent is to add newly discovered or updated content over time rather than rebuild from scratch. It also carries a cron expression for scheduled execution.
 * 2. `Variables` (`variablesNode`): This node creates normalized metadata fields for downstream indexing. It maps `title` from `{{triggerNode_1.output.document_key}}`, which implies each ingested document gets a title-like identifier from the Drive connector output. It also sets `source` to a fixed Google Drive folder URL. This metadata is later attached to vectors so retrieved chunks can be traced back to their origin.
 * 3. `chunking` (`chunkNode`): This node splits the raw document content from `{{triggerNode_1.output.content}}` into retrieval-friendly chunks. It uses recursive character splitting with a target size of 500 characters, 50 characters of overlap, and separators ordered as paragraph breaks, line breaks, then spaces. This improves retrieval quality by preserving local context while keeping chunks small enough for embedding and search.
 * 4. `Extract Chunked Text` (`codeNode`): This custom script transforms the chunking output into the exact text list expected by the embedding node. Its role is to extract only the chunk text payloads, likely flattening any richer chunk objects into a clean array or string collection for vectorization.
 * 5. `Get Vectors` (`vectorizeNode`): This node sends the extracted chunk text from `{{codeNode_539.output}}` to the selected embedding model. It generates numerical vector representations for each chunk so semantic search can later match user questions against indexed Drive content.
 * 6. `Transform Metadata` (`codeNode`): This custom script combines the generated vectors with normalized metadata into the field structure required by the indexer. Based on downstream bindings, it emits `vectors` and `metadata` fields that align positionally so each vector is indexed with the correct title and source information.
 * 7. `Index to DB` (`IndexNode`): This node writes the prepared vectors and metadata into the chosen vector database. It uses `title` as the primary key and is configured with `duplicateOperation` set to `overwrite`, meaning records with the same primary key are replaced rather than duplicated. This is the persistence step that makes the Drive content retrievable by downstream assistants.
 * 8. `addNode` (`addNode`): This is only a canvas placeholder for extending the flow and does not perform runtime business logic.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Google Drive trigger cannot access the folder | Missing, expired, or mis-scoped `credentials` | Reconnect valid Google Drive credentials with access to the target folder and verify OAuth scopes or account permissions. |
 * | Flow starts but indexes no content | `folderUrl` is empty, invalid, points to an empty folder, or extracted files contain no usable text | Confirm the selected folder exists, contains supported readable documents, and can be accessed by the configured account. |
 * | Metadata source points to the wrong folder | `Variables` node uses a hard-coded `source` URL instead of the runtime-selected `folderUrl` | Update the variables mapping so `source` is dynamically derived from the selected folder or from trigger output. |
 * | Embedding step fails | No `embeddingModelName` selected or the selected provider/model is unavailable | Choose a valid embedding model supported in the workspace and verify provider connectivity or quota. |
 * | Index write fails | No `vectorDB` selected, database is unreachable, or schema expectations do not match | Select the correct vector database, verify connectivity and permissions, and ensure the index accepts the provided vector and metadata format. |
 * | Records are unexpectedly replaced | `duplicateOperation` is set to `overwrite` and `title` is used as the primary key | Change duplicate handling or use a more unique primary key if multiple documents can share the same title. |
 * | Retrieved assistant answers do not include Drive content | This ingestion flow has not run successfully, or indexing completed against a different vector store than the assistant uses | Run the flow, confirm vectors were written, and ensure assistant flows query the same configured vector database. |
 * | Chunking produces poor retrieval quality | The fixed chunk size and overlap are not a good fit for the document types being ingested | Tune `numOfChars`, `overlapChars`, and separators based on document structure and retrieval performance. |
 *
 * ## Notes
 * - The flow metadata name contains a trailing space in the export (`GDrive `), but the canonical name should be treated as `GDrive`.
 * - The trigger cron expression is present in the export as `0 0 00 ? * 1 * UTC`, indicating a scheduled cadence is intended, but actual schedule behaviour depends on deployment configuration in Lamatic.
 * - `syncMode` is `incremental_append`, which suggests the flow is optimized for ongoing ingestion rather than destructive full reindexing.
 * - The use of `title` alone as a primary key may be too coarse if different files can resolve to the same `document_key`; consider a more stable unique identifier if collisions occur.
 * - The two custom scripts are critical to data shaping in this flow. If you modify upstream chunk structure or downstream index schema, review both `gdrive_extract-chunked-text` and `gdrive_transform-metadata` together.
 * - The final persisted contract matters more than the transient runtime response. In practice, the true output of this flow is the vectorized Google Drive corpus stored in the selected vector database for later retrieval by assistant flows.
 */

// Flow: gdrive
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "GDrive ",
  "description": "Google Drive Indexation",
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
  "IndexNode_343": [
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
      "description": "Select the credentials for Google Drive authentication. Required to access the Google Drive API.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "folderUrl",
      "type": "resourceLocator",
      "label": "Folder",
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
          "label": "By URL",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "typeOptions": {
        "loadOptionsMethod": "getFolders"
      },
      "airbyteInputName": "source/configuration.folder_url",
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    }
  ],
  "variablesNode_272": [
    {
      "keys": [
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
  "vectorizeNode_623": [
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
    "gdrive_extract_chunked_text": "@scripts/gdrive_extract-chunked-text.ts",
    "gdrive_transform_metadata": "@scripts/gdrive_transform-metadata.ts"
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
        "cronExpression": "0 0 00 ? * 1 * UTC"
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
        "numOfChars": 500,
        "separators": [
          "\\n\\n",
          "\\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 50
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
        "code": "@scripts/gdrive_extract-chunked-text.ts"
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
        "code": "@scripts/gdrive_transform-metadata.ts"
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
        "webhookURL": "https://webhook.site/685a66e7-b4d3-40a4-9801-99e3460414f9",
        "primaryKeys": [
          "title"
        ],
        "vectorsField": "{{codeNode_560.output.vectors}}",
        "metadataField": "{{codeNode_560.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_870476",
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
    "id": "variablesNode_272",
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
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.document_key}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"https://drive.google.com/drive/folders/1oeBVP-aokrik2iSlb9QYNQZXZ13ViXvs?usp=sharing\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "variablesNode_272-chunkNode_934",
    "source": "variablesNode_272",
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
    "id": "IndexNode_343-plus-node-addNode_870476",
    "source": "IndexNode_343",
    "target": "plus-node-addNode_870476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-variablesNode_272",
    "source": "triggerNode_1",
    "target": "variablesNode_272",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
