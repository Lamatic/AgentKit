/*
 * # Sharepoint
 * A flow that incrementally ingests documents from a SharePoint site, converts them into vector-ready chunks, and writes them into the knowledge base used by the wider Knowledge Chatbot system.
 *
 * ## Purpose
 * This flow is responsible for pulling supported files from a SharePoint site and turning them into indexed vector records that can be searched later by a retrieval-augmented chatbot. It solves the ingestion side of the problem for Microsoft SharePoint content specifically: authenticating to the source, discovering files within the configured site, extracting document content, splitting that content into chunk-sized units, embedding those chunks, attaching source metadata, and storing the results in a vector database.
 *
 * The outcome is a SharePoint-backed slice of the project knowledge base. That matters because the downstream chatbot depends on a populated vector index to retrieve relevant passages at question time. Without this ingestion step, SharePoint documents remain unavailable to retrieval and therefore cannot ground generated answers.
 *
 * Within the broader bundle, this is an entry-point indexation flow rather than a conversational runtime flow. In the overall plan-retrieve-synthesize chain described by the parent agent, it sits squarely in the preparation stage: it builds and refreshes the searchable corpus that the `Knowledge Chatbot` flow later queries during retrieval. It is one of several sibling indexation flows, and should be chosen when the source of truth lives in SharePoint rather than in Google Drive, OneDrive, S3, Postgres, a crawler, or another supported source.
 *
 * ## When To Use
 * - Use when documents to be indexed live in a SharePoint site and need to become searchable by the Knowledge Chatbot.
 * - Use when you want recurring or scheduled synchronization of SharePoint documents into a vector database.
 * - Use when incremental sync is preferred over a full historical reindex, especially for ongoing document updates.
 * - Use when the target corpus consists of supported file types such as `pdf`, `docx`, `txt`, `pptx`, or `md`.
 * - Use when you already have SharePoint credentials and a vector database selected in Lamatic.
 * - Use when the broader system has been configured to answer questions over internal knowledge rather than public web content.
 *
 * ## When Not To Use
 * - Do not use when the source content is stored outside SharePoint; use the sibling indexation flow for the actual source system instead.
 * - Do not use when no SharePoint credentials are available or the configured account cannot access the target site.
 * - Do not use when no vector database has been configured, because the flow’s end result is an indexed vector store write.
 * - Do not use when the content to ingest is not document-based or is stored as database rows; a structured-source flow such as Postgres is more appropriate.
 * - Do not use when you need live question answering directly from a user query; this flow prepares data, while the `Knowledge Chatbot` flow handles retrieval and response generation.
 * - Do not use when the target files are outside the configured supported glob patterns, unless you first modify the flow to include those file types.
 * - Do not use when a one-off manual export or file upload process is sufficient and a scheduled SharePoint sync is unnecessary.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | SharePoint/OneDrive authentication credentials used by the trigger connector to access the site. |
 * | `site_url` | `resourceLocator` | Yes | The SharePoint site to ingest from. It can be selected from a discovered list or provided directly as a URL. |
 * | `embeddingModelName` | `model` | Yes | The text embedding model used to convert chunk text into vector representations. |
 * | `vectorDB` | `select` | Yes | The destination vector database where embeddings and metadata will be indexed. |
 *
 * Notable constraints and assumptions:
 * - `site_url` must point to a valid SharePoint site that the supplied `credentials` can access.
 * - The flow is configured to scan from `folder_path` `.` with `search_scope` set to `ALL`, so ingestion is intended to cover the configured site broadly rather than a narrowly scoped path.
 * - Supported file matching is limited to the configured glob set: `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`.
 * - The connector runs with `syncMode` set to `incremental` and a history window of `3` days if full history is unavailable, so operators should expect update-oriented synchronization rather than unconditional full reprocessing.
 * - The embedding model must be compatible with Lamatic’s `embedder/text` model type.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Vector representations generated for the extracted text chunks and passed into the indexing step. |
 * | `metadata` | `array` | Normalized metadata records aligned to the generated chunks and stored with the vectors. |
 * | `indexing_result` | `object` | The effective result of writing chunk vectors and metadata into the selected vector database. |
 *
 * The flow’s practical output is an indexed set of SharePoint-derived chunk records in the configured vector store rather than a user-facing prose response. Internally, the pipeline produces chunk text, embeddings, and metadata objects, then commits them to the vector database with overwrite semantics for duplicate primary keys. Depending on how the flow is invoked in Lamatic, the visible response may be minimal compared with the actual side effect, which is the persisted index update.
 *
 * A caveat is that the exported flow definition does not explicitly declare a final response-mapping schema. The most reliable interpretation of success is that the `Index` node completes and the vector database contains updated records for the ingested content.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow for the Knowledge Chatbot bundle.
 * - In operational terms, it does require prior workspace configuration rather than a prior flow run: valid SharePoint credentials, an embedding model selection, and a target vector database must already exist.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` — consumes the vector index populated by this flow during retrieval. It does not typically read a direct API payload from this flow; instead, it depends on the persisted indexed chunks and metadata being present in the shared vector database.
 * - Any other retrieval or orchestration flow in the same workspace that queries the same vector database can also consume the indexed records written here.
 *
 * ### External Services
 * - Microsoft SharePoint via the SharePoint/OneDrive connector — used to authenticate, enumerate, and read documents from the configured site — requires selected `credentials`.
 * - Embedding model provider selected in `embeddingModelName` — used to convert chunk text into vector embeddings — requires the model integration configured in the Lamatic workspace.
 * - Vector database selected in `vectorDB` — used to store embeddings and associated metadata for retrieval — requires the chosen database integration configured in the Lamatic workspace.
 *
 * ### Environment Variables
 * - No explicit environment variables are referenced in the exported flow definition.
 * - External service authentication is supplied through Lamatic-managed private inputs such as `credentials`, `embeddingModelName`, and `vectorDB` rather than named environment variables in this flow file.
 *
 * ## Node Walkthrough
 * 1. `Sharepoint Business` (`triggerNode`) starts the flow by connecting to the configured SharePoint site using the selected `credentials` and `site_url`. It searches the site with `search_scope` set to `ALL`, begins from `folder_path` `.`, filters to supported document globs, and runs in `incremental` sync mode on the configured schedule. For each discovered document, it emits the document content plus source fields such as `document_key`, `_ab_source_file_last_modified`, and `_ab_source_file_url`.
 *
 * 2. `Variables` (`variablesNode`) creates a normalized working metadata object from the trigger output. It maps `title` from `{{triggerNode_1.output.document_key}}`, `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`, and `source` from `{{triggerNode_1.output._ab_source_file_url}}`. This gives later steps a cleaner metadata shape tied to each document.
 *
 * 3. `Chunking` (`chunkNode`) splits `{{triggerNode_1.output.content}}` into smaller text segments using a recursive character splitter. It targets chunks of `500` characters with `50` characters of overlap and uses separators in the order `\n\n`, `\n`, and space. This prepares document text for embedding in sizes more suitable for retrieval.
 *
 * 4. `Get Chunks` (`codeNode`) runs the script referenced as `@scripts/sharepoint_get-chunks.ts`. Its role is to transform the chunking output into the exact text collection expected by the vectorization step. In this flow, `Vectorize` consumes `{{codeNode_254.output}}`, so this script is effectively the adapter between raw chunk node output and embedding input.
 *
 * 5. `Vectorize` (`vectorizeNode`) sends the prepared chunk text to the selected `embeddingModelName` and generates vector embeddings. It reads its input from `{{codeNode_254.output}}` and produces a `vectors` output that remains aligned to the chunk sequence.
 *
 * 6. `Transform Metadata` (`codeNode`) runs the script referenced as `@scripts/sharepoint_transform-metadata.ts`. This step reshapes document-level and chunk-level context into the final metadata payload expected by the indexing node. It likely combines the normalized variables and the chunk/vector alignment into metadata records suitable for retrieval.
 *
 * 7. `Index` (`IndexNode`) writes the embeddings and metadata into the selected `vectorDB`. It uses `{{vectorizeNode_639.output.vectors}}` as `vectorsField` and `{{codeNode_507.output.metadata}}` as `metadataField`. Duplicate handling is set to `overwrite`, and `primaryKeys` is configured as `file_name`, so records with the same key are replaced rather than duplicated.
 *
 * 8. The trailing add node is only a canvas placeholder and does not contribute runtime logic. Execution effectively ends after `Index` completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication fails at startup | `credentials` are missing, expired, or do not permit access to the SharePoint site | Reconfigure the SharePoint credentials in Lamatic, verify tenant permissions, and confirm the account can open the target `site_url` manually |
 * | No documents are ingested | `site_url` is wrong, the site contains no matching files, or the configured account cannot see the relevant content | Verify the exact site URL, confirm file visibility under the same account, and check that the site actually contains supported files matching the configured glob patterns |
 * | Flow runs but indexes fewer files than expected | Incremental sync only picked up recent changes, or history backfill is limited | Run a fuller initial ingestion strategy if available, inspect connector sync state, and confirm whether older files fall outside the `days_to_sync_if_history_is_full` window |
 * | Chunking produces empty or poor-quality chunks | Source documents have little extractable text, unsupported formatting, or parsing issues upstream in the connector | Test with known-good text documents, inspect raw trigger output content, and consider adjusting source file selection or preprocessing |
 * | Embedding step fails | `embeddingModelName` was not configured correctly or the selected model integration is unavailable | Select a valid `embedder/text` model, verify model credentials/provider setup in the workspace, and retry |
 * | Indexing fails | `vectorDB` is missing, unreachable, or incompatible with the payload being written | Verify the vector database integration, ensure the destination index exists if required, and confirm the workspace has permission to write |
 * | Records overwrite unexpectedly | `duplicateOperation` is `overwrite` and `primaryKeys` is set to `file_name`, which may not uniquely identify chunks across documents or versions | Review the primary key design and update the flow if chunk-level uniqueness is required rather than file-level replacement |
 * | Metadata is malformed or missing | The `Transform Metadata` script or prior variable mapping does not match the actual trigger payload shape | Inspect the script expectations, validate fields like `document_key` and `_ab_source_file_url`, and update the mapping logic as needed |
 * | Downstream chatbot returns no relevant answers after a successful run | The flow completed but the chatbot is pointed at a different vector database, collection, or namespace | Confirm that this flow and the `Knowledge Chatbot` flow are configured against the same vector store and retrieval scope |
 * | Flow appears not to run automatically | The schedule is not appropriate for the environment or deployment is incomplete | Check the configured cron expression, deployment state, and whether the runtime supports scheduled execution for this trigger |
 *
 * ## Notes
 * - The trigger is configured with cron expression `0 0 00 ? * 1 * UTC`, indicating a scheduled weekly execution pattern in addition to its role as the ingestion entry point.
 * - The flow uses two custom scripts, `sharepoint_get-chunks` and `sharepoint_transform-metadata`, so part of the business logic lives outside the visual node configuration. Any change to chunk packaging or metadata shape should be validated against those scripts.
 * - Duplicate management is intentionally destructive for matching primary keys because the indexer uses `overwrite`. This is suitable for keeping the knowledge base current, but it may discard prior versions unless version-aware keys are introduced.
 * - Although the flow title is `Sharepoint`, the trigger node label is `Sharepoint Business` and its credential description references OneDrive authentication. Operators should treat this as a Microsoft ecosystem connector detail, but verify the exact connector behavior in the workspace before production rollout.
 * - Because the visible output is primarily a side effect in the vector database, operational monitoring should focus on ingestion counts, embedding success, and index write confirmation rather than expecting a rich final response payload.
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
