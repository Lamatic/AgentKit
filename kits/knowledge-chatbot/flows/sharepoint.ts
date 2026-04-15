/*
 * # Sharepoint
 * A flow that ingests documents from a SharePoint site, converts them into vector embeddings, and stores them in the shared knowledge index used by the wider RAG system.
 *
 * ## Purpose
 * This flow is responsible for the SharePoint-specific ingestion and indexation part of the knowledge pipeline. It connects to a configured SharePoint site, reads supported document types from that site, extracts document content and source metadata, splits the content into retrieval-friendly chunks, generates embeddings for those chunks, and writes the resulting vectors plus metadata into a configured vector database.
 *
 * The outcome is a searchable semantic representation of SharePoint-hosted knowledge. That matters because the broader agent system depends on a populated vector index before the chatbot can retrieve relevant context and answer questions grounded in enterprise documents. Without this ingestion step, SharePoint content remains inaccessible to downstream retrieval.
 *
 * In the larger plan-retrieve-synthesize chain described by the parent agent, this flow sits squarely in the preparation stage. It is one of several sibling indexation flows that normalize content from different source systems into a common retrieval substrate. Its outputs are not aimed at an end user directly; they are meant to feed the shared vector store that the `Knowledge Chatbot` flow queries later during answer generation.
 *
 * ## When To Use
 * - Use when your source knowledge lives in SharePoint sites and needs to be added to the RAG knowledge base.
 * - Use when you want to ingest supported file types from a SharePoint Business site into a vector database.
 * - Use when the retrieval layer must include enterprise documents such as PDFs, Word files, PowerPoint files, Markdown files, or plain text stored in SharePoint.
 * - Use during initial knowledge base setup for SharePoint-backed content.
 * - Use on a recurring sync schedule when SharePoint documents change and the index needs to stay current.
 * - Use when the broader `Knowledge Chatbot` flow is expected to answer questions using SharePoint documents as evidence.
 *
 * ## When Not To Use
 * - Do not use when the source content is in a different system such as Google Drive, OneDrive, S3, Postgres, Google Sheets, or a crawled website; use the sibling indexation flow for that source instead.
 * - Do not use when no SharePoint credentials have been configured.
 * - Do not use when you do not yet know which SharePoint site should be indexed.
 * - Do not use when the content you need is outside the supported file patterns configured in this flow: `pdf`, `docx`, `txt`, `pptx`, and `md`.
 * - Do not use when you need direct question answering or retrieval at runtime; this flow prepares the index but does not answer user queries.
 * - Do not use when a vector database and embedding model have not been selected, because the flow cannot complete indexation without both.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | SharePoint or OneDrive-compatible credentials used by the trigger connector to authenticate against the target SharePoint site. |
 * | `site_url` | `resourceLocator` | Yes | The SharePoint site to ingest from. It can be selected from a discovered list or supplied directly as a URL such as `https://lamatic.sharepoint.com/sites/test`. |
 * | `embeddingModelName` | `model` | Yes | The text embedding model used to convert chunked document text into vectors. Must be a model compatible with `embedder/text`. |
 * | `vectorDB` | `select` | Yes | The target vector database where generated vectors and metadata will be indexed. |
 *
 * Below the table, describe any notable input constraints or validation assumptions.
 *
 * - `site_url` is required and is expected to point to a valid SharePoint site, not an arbitrary page or file URL.
 * - The connector is configured to scan from `folder_path` `.` with `search_scope` set to `ALL`, so the chosen site should be one the credentials can traverse.
 * - Supported file matching is restricted by the configured glob patterns: `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`.
 * - The flow is configured for incremental sync, so repeated runs assume the source connector can detect changed content.
 * - `embeddingModelName` must resolve to a text embedding model available in the workspace.
 * - `vectorDB` must refer to an index destination that supports metadata writes and overwrite semantics on duplicate keys.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | The generated embedding vectors produced by the `Vectorize` node for the current batch of chunked SharePoint text. |
 * | `metadata` | `array` | The transformed metadata records produced for indexing, aligned to the generated chunks and vectors. |
 * | `index_result` | `object` | The effective result of the `Index` node writing vectors and metadata into the selected vector database. Exact shape depends on the backing index service. |
 *
 * Below the table, describe the output format in plain English.
 *
 * This flow is primarily an ingestion pipeline, so its meaningful outcome is a side effect: documents are written into a vector index. Internally it produces a collection of chunk texts, a corresponding collection of embeddings, and structured metadata derived from the source document. The final response should be understood as an indexing result rather than a user-facing payload. Depending on the runtime and selected vector database, the returned object may expose write status, counts, or record identifiers, but the canonical contract of the flow is that SharePoint content has been indexed for later retrieval.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is an entry-point ingestion flow.
 * - In the broader agent architecture, it is invoked during knowledge base preparation rather than as a continuation of another flow.
 * - It does not consume output fields from another Lamatic flow; instead, it reads directly from SharePoint via its trigger connector using `credentials` and `site_url`.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` — consumes the data written by this flow into the shared vector index during retrieval. It depends on this flow having already populated the vector store with embeddings and metadata.
 * - More generally, any retrieval or orchestration flow that queries the same configured vector database depends on the indexed records created here.
 * - The practical downstream fields are not passed as direct flow-to-flow payload fields; they are persisted index records composed from `vectors` and `metadata` in the selected `vectorDB`.
 *
 * ### External Services
 * - SharePoint connector — used to authenticate to a SharePoint site and read source documents incrementally — required credential: `credentials`
 * - Embedding model provider — used to turn chunk text into vector representations — required configuration: `embeddingModelName`
 * - Vector database — used to persist embeddings and metadata for semantic retrieval — required configuration: `vectorDB`
 * - Custom script `@scripts/sharepoint_get-chunks.ts` — used to reshape chunk output into the text payload expected by the vectorization step — no user-supplied credential exposed in this flow
 * - Custom script `@scripts/sharepoint_transform-metadata.ts` — used to build indexable metadata aligned with vectors — no user-supplied credential exposed in this flow
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow definition.
 * - Credential and model selection are provided through Lamatic private inputs rather than named environment variables.
 * - If the selected embedding provider or vector database requires environment-backed secrets, they are resolved by the platform outside this flow definition.
 *
 * ## Node Walkthrough
 * 1. `Sharepoint Business` (`triggerNode`) starts the flow by connecting to the configured SharePoint site using the selected `credentials` and `site_url`. It scans the site with incremental sync enabled, searching across the site from the root folder using `search_scope` `ALL`. It is configured to ingest only files matching the globs for `pdf`, `docx`, `txt`, `pptx`, and `md`. For each discovered document it emits the document content plus source fields such as `document_key`, `_ab_source_file_last_modified`, and `_ab_source_file_url`.
 *
 * 2. `Variables` (`variablesNode`) maps selected fields from the SharePoint trigger output into a compact metadata scaffold. It creates `title` from `{{triggerNode_1.output.document_key}}`, `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`, and `source` from `{{triggerNode_1.output._ab_source_file_url}}`. This step standardizes the source metadata before chunk-level processing.
 *
 * 3. `Chunking` (`dynamicNode`) splits the raw document content from `{{triggerNode_1.output.content}}` into smaller retrieval-friendly segments. It uses recursive character splitting with a target chunk size of `500` characters, an overlap of `50` characters, and separators of paragraph break, newline, and space. This balances semantic continuity against chunk size so later retrieval can fetch relevant passages instead of whole documents.
 *
 * 4. `Get Chunks` (`dynamicNode`) runs the custom script `@scripts/sharepoint_get-chunks.ts`. In this flow, its role is to convert the chunking output into the exact text array or structure expected by the embedding node. It acts as the bridge between generic chunk generation and model-ready vectorization input.
 *
 * 5. `Vectorize` (`dynamicNode`) takes the processed chunk text from `{{codeNode_254.output}}` and sends it to the selected `embeddingModelName`. It generates vector embeddings for each chunk so that the content can be indexed and later retrieved by semantic similarity.
 *
 * 6. `Transform Metadata` (`dynamicNode`) runs the custom script `@scripts/sharepoint_transform-metadata.ts`. This script prepares the metadata payload for index insertion, likely aligning chunk-level metadata with the vectors created in the previous step and combining source document information with chunk context.
 *
 * 7. `Index` (`dynamicNode`) writes the final records to the selected `vectorDB`. It takes vectors from `{{vectorizeNode_639.output.vectors}}` and metadata from `{{codeNode_507.output.metadata}}`. The node is configured with `primaryKeys` set to `file_name` and `duplicateOperation` set to `overwrite`, meaning repeated indexing of the same file key replaces the previous indexed version rather than creating duplicates.
 *
 * 8. `addNode` (`addNode`) is only a studio placeholder marking where additional downstream nodes could be added. It does not contribute meaningful runtime transformation in the documented pipeline.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication fails at the trigger step | The selected `credentials` are missing, expired, or do not have permission to access the specified SharePoint site | Reconfigure `credentials`, verify tenant and site access, and confirm the account can browse the target `site_url` |
 * | No documents are indexed even though the flow runs | The selected site is empty, the wrong `site_url` was chosen, or documents do not match the configured file globs | Verify the site path, confirm files exist under the accessible scope, and check that file types are among `pdf`, `docx`, `txt`, `pptx`, or `md` |
 * | The flow runs but returns little or no text to embed | Source files may be unreadable, empty, or not extractable by the SharePoint connector | Test with known-good documents, inspect source file contents, and confirm the connector supports those files in your environment |
 * | Vectorization fails | `embeddingModelName` was not selected, is unavailable, or the provider backing that model is misconfigured | Select a valid text embedding model and verify the workspace has access to the model provider |
 * | Index write fails | `vectorDB` is missing, unreachable, or incompatible with the metadata or vector payload shape | Select a valid vector database, confirm connectivity, and validate that the destination index accepts the record schema being written |
 * | Re-indexing appears to replace prior records unexpectedly | The index node is configured with `duplicateOperation` `overwrite` using `file_name` as the primary key | If version retention is required, change key strategy or duplicate handling in the flow before deployment |
 * | Metadata fields are missing or malformed in the index | The transformation script did not receive the expected upstream fields or the source records lacked those values | Verify the trigger output contains `document_key`, `_ab_source_file_last_modified`, and `_ab_source_file_url`, and review the custom metadata script |
 * | The chatbot cannot retrieve SharePoint content later | This ingestion flow did not run successfully, wrote to the wrong `vectorDB`, or indexed under an unexpected schema | Re-run the flow with the same vector store used by the retrieval flow and confirm records are present after indexing |
 * | Incremental sync does not capture expected historical content | The trigger is configured for incremental sync and may depend on connector state/history behaviour | For first-time full ingestion, review connector sync behaviour and adjust sync settings if a broader historical import is needed |
 *
 * ## Notes
 * - The flow is scheduled with `cronExpression` `0 0 00 ? * 1 * UTC`, indicating a recurring run pattern is intended in addition to manual execution.
 * - The connector uses `strategy` `auto`, `syncMode` `incremental`, and `days_to_sync_if_history_is_full` `3`, so behavior on repeat runs is optimized for recent changes rather than guaranteed full reprocessing.
 * - Chunking is character-based rather than semantic or token-based. This is simple and reliable, but chunk boundaries may not always align with document structure.
 * - The index primary key is configured as `file_name`. If multiple SharePoint locations can produce identical file names, collisions are possible unless the metadata script disambiguates records.
 * - This flow depends on two referenced custom scripts. Their exact internal logic is not exposed in the flow definition, so any schema assumptions made by downstream systems should be validated against those scripts before hard-coding integrations.
 */

// Flow: sharepoint
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Sharepoint",
  "description": "Sharepoint Indexation",
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
  "IndexNode_622": [
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
      "description": "Select the credentials for Onedrive authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "site_url",
      "type": "resourceLocator",
      "label": "Sharepoint Site",
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
      "description": "URL of SharePoint site to search for files. Example: https://lamatic.sharepoint.com/sites/test",
      "placeholder": "https://lamatic.sharepoint.com/sites/test",
      "typeOptions": {
        "loadOptionsMethod": "getSiteUrls"
      },
      "airbyteInputName": "source/configuration.site_url",
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    }
  ],
  "vectorizeNode_639": [
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
    "sharepoint_get_chunks": "@scripts/sharepoint_get-chunks.ts",
    "sharepoint_transform_metadata": "@scripts/sharepoint_transform-metadata.ts"
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
      "nodeId": "sharepointNode",
      "modes": {
        "site_url": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Sharepoint Business",
        "globs": [
          "**/*.pdf",
          "**/*.docx",
          "**/*.txt",
          "**/*.pptx",
          "**/*.md"
        ],
        "strategy": "auto",
        "syncMode": "incremental",
        "start_date": "",
        "folder_path": ".",
        "search_scope": "ALL",
        "cronExpression": "0 0 00 ? * 1 * UTC",
        "days_to_sync_if_history_is_full": "3"
      }
    }
  },
  {
    "id": "chunkNode_318",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{triggerNode_1.output.content}}",
        "numOfChars": 500,
        "separators": [
          "\n\n",
          "\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 50
      }
    }
  },
  {
    "id": "codeNode_254",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Get Chunks",
        "code": "@scripts/sharepoint_get-chunks.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_639",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_254.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_507",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Transform Metadata",
        "code": "@scripts/sharepoint_transform-metadata.ts"
      }
    }
  },
  {
    "id": "IndexNode_622",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index",
        "primaryKeys": [
          "file_name"
        ],
        "vectorsField": "{{vectorizeNode_639.output.vectors}}",
        "metadataField": "{{codeNode_507.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_960424",
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
    "id": "variablesNode_289",
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
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.document_key}}\"\n  },\n  \"last_modified\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output._ab_source_file_last_modified}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output._ab_source_file_url}}\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "variablesNode_289-chunkNode_318",
    "source": "variablesNode_289",
    "target": "chunkNode_318",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_318-codeNode_254",
    "source": "chunkNode_318",
    "target": "codeNode_254",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_254-vectorizeNode_639",
    "source": "codeNode_254",
    "target": "vectorizeNode_639",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_639-codeNode_507",
    "source": "vectorizeNode_639",
    "target": "codeNode_507",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_507-IndexNode_622",
    "source": "codeNode_507",
    "target": "IndexNode_622",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_622-plus-node-addNode_960424",
    "source": "IndexNode_622",
    "target": "plus-node-addNode_960424",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-variablesNode_289",
    "source": "triggerNode_1",
    "target": "variablesNode_289",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
