/*
 * # Onedrive
 * A flow that ingests documents from Microsoft OneDrive Business, chunks and embeds their contents, and indexes them into a vector database for downstream internal retrieval in the wider Deep Research system.
 *
 * ## Purpose
 * This flow is responsible for turning files stored in a Microsoft OneDrive Business drive into searchable vectorized knowledge. It connects to OneDrive, reads supported document types from the configured drive and folder scope, breaks document content into retrieval-friendly chunks, generates embeddings for those chunks, attaches normalized metadata, and writes the result into a selected vector database. Its job is not to answer user questions directly, but to prepare internal content so other retrieval and reasoning flows can use it reliably.
 *
 * The outcome is an indexed corpus of internal documents, keyed and stored in a way that supports semantic search over enterprise content. That matters because the overall Deep Research agent depends on grounded retrieval from internal data sources when answering questions that should reflect an organization’s own files rather than only public web information. Without this flow, OneDrive content remains outside the retrieval layer and cannot contribute evidence to later reasoning or synthesis.
 *
 * In the broader pipeline described by the parent agent, this flow sits in the indexing branch rather than the live reasoning branch. It is part of the system’s “build and maintain searchable internal knowledge” capability. Operators typically run it on a schedule or when they need to refresh OneDrive-backed knowledge. Downstream retrieval flows can then query the populated vector index during the plan-retrieve-synthesize cycle used for end-user research requests.
 *
 * ## When To Use
 * - Use when your organization stores reference documents in Microsoft OneDrive Business and you want those documents available for semantic retrieval.
 * - Use when setting up internal knowledge before enabling question answering over private enterprise content.
 * - Use when a OneDrive folder has been updated and the vector index needs to be refreshed incrementally.
 * - Use when you need scheduled synchronization of supported file types such as `pdf`, `docx`, `txt`, `pptx`, and `md` from a specified drive or folder.
 * - Use when downstream internal search or data-source retrieval flows depend on a vector database containing OneDrive-derived content.
 *
 * ## When Not To Use
 * - Do not use when the target content lives on another source system such as Google Drive, SharePoint, S3, or Postgres; use the corresponding connector flow instead.
 * - Do not use when the task is to answer a user query directly; this flow indexes data and does not produce a research answer.
 * - Do not use when no vector database has been configured, because the flow’s end state is writing embeddings and metadata into a vector store.
 * - Do not use when valid OneDrive credentials are unavailable or the selected drive/folder cannot be accessed.
 * - Do not use when the desired input is ad hoc free-text or a user question; this flow expects documents fetched from OneDrive rather than interactive query text.
 * - Do not use when you need current public web information rather than internal document indexing; in that case the web retrieval flow is the better fit.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | select | Yes | OneDrive authentication credentials used by the trigger connector to access Microsoft OneDrive Business. |
 * | `drive_name` | text | Yes | Name of the Microsoft OneDrive drive to read from. For most accounts this is `OneDrive`. |
 * | `folder_path` | text | Yes | Folder path to search within the drive. Use `.` to search broadly, or an absolute-style path such as `./FolderName/SubfolderName`. |
 * | `vectorDB` | select | Yes | Target vector database where chunk embeddings and metadata will be indexed. |
 * | `embeddingModelName` | model | Yes | Embedding model used to convert chunk text into vector representations. |
 *
 * The trigger is configured to process only files matching the glob patterns `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`. The flow assumes `drive_name` resolves to a valid accessible drive and that `folder_path` is formatted the way the connector expects. Sync behavior is incremental, so the connector is optimized for ongoing ingestion rather than one-time full exports only.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | array | Vector embeddings generated from the document chunks and passed into the indexing step. |
 * | `metadata` | array | Normalized metadata records associated with each indexed chunk. |
 * | `indexing_result` | implementation-dependent | Result of the vector database write operation performed by the `Index` node. |
 *
 * This flow is primarily operational: its meaningful outcome is that OneDrive content has been written into the configured vector database. It does not expose a user-facing prose response. The effective output is a batch indexing operation composed of chunk vectors plus metadata, with the final persisted state living in the vector store rather than in a rich API payload. Exact write-result details depend on the selected vector database implementation and how Lamatic surfaces index node responses.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is not chained from another flow in the Deep Research runtime pipeline. It is a standalone indexing flow triggered directly by its OneDrive connector configuration.
 * - Operationally, it should be run before any downstream internal retrieval flow that expects OneDrive-derived documents to already exist in the vector database.
 *
 * ### Downstream Flows
 * - Internal data-source retrieval flows in the Deep Research kit consume the indexed corpus produced by this flow via the shared vector database.
 * - Those downstream flows depend on the persisted vector records and metadata written by the `Index` node, rather than on a direct structured API response from this flow.
 * - The final synthesis flow depends indirectly on this flow whenever relevant evidence must come from OneDrive documents that were previously indexed.
 *
 * ### External Services
 * - Microsoft OneDrive Business connector — used to enumerate and read supported files from a configured drive and folder path — requires selected `credentials`
 * - Embedding model provider — used to convert chunked text into embeddings — requires the model backing the selected `embeddingModelName`
 * - Vector database — used to persist embeddings and metadata for semantic retrieval — requires selected `vectorDB`
 *
 * ### Environment Variables
 * - No flow-specific environment variables are declared in this flow definition — connector authentication, model access, and vector database access are supplied through Lamatic-managed credentials and resource selections — used across `Onedrive Business`, `Vectorize`, and `Index`
 *
 * ## Node Walkthrough
 * 1. `Onedrive Business` (`triggerNode`) starts the flow by connecting to Microsoft OneDrive Business with the selected `credentials`. It scans the configured `drive_name` and `folder_path`, applies the allowed file globs for `pdf`, `docx`, `txt`, `pptx`, and `md`, and synchronizes content in `incremental` mode. For each discovered file, it emits document content plus connector metadata such as the document key, source URL, and last modified timestamp.
 *
 * 2. `Variables` (`variablesNode`) maps selected trigger outputs into a cleaner metadata scaffold for later indexing. It creates `title` from `{{triggerNode_1.output.document_key}}`, `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`, and `source` from `{{triggerNode_1.output._ab_source_file_url}}`. This step standardizes the fields the metadata transformation stage will work with.
 *
 * 3. `Chunking` (`dynamicNode`) takes `{{triggerNode_1.output.content}}` and splits the raw document text into overlapping chunks. It uses a recursive character splitter with `500` characters per chunk, `50` characters of overlap, and separators prioritizing paragraph breaks, then line breaks, then spaces. The goal is to preserve semantic continuity while producing chunk sizes suitable for embedding and retrieval.
 *
 * 4. `Get Chunks` (`codeNode`) runs the script referenced at `@scripts/onedrive_get-chunks.ts`. In this flow, that script sits between chunk generation and embedding, so its purpose is to reshape, extract, or normalize the chunk output into the exact text array expected by the embedding step. The `Vectorize` node consumes this node’s direct output as its `inputText`.
 *
 * 5. `Vectorize` (`dynamicNode`) submits the processed chunk text from `{{codeNode_254.output}}` to the selected `embeddingModelName`. It returns vector embeddings for each chunk as `{{vectorizeNode_639.output.vectors}}`, creating the numerical representations needed for semantic search.
 *
 * 6. `Transform Metadata` (`codeNode`) runs the script referenced at `@scripts/onedrive_transform-metadata.ts`. This step prepares the metadata objects that will be stored alongside the vectors. It likely aligns source document metadata with the chunk structure so each embedding has the correct provenance, title, timestamps, and source reference when written to the vector database.
 *
 * 7. `Index` (`dynamicNode`) writes the embeddings and metadata into the selected `vectorDB`. It uses `{{vectorizeNode_639.output.vectors}}` as the vector payload and `{{codeNode_507.output.metadata}}` as the metadata payload. The node is configured with `primaryKeys` set to `file_name` and `duplicateOperation` set to `overwrite`, meaning existing records matching that primary key are replaced rather than duplicated.
 *
 * 8. The trailing add node is only a canvas placeholder and does not contribute runtime behavior.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow cannot connect to OneDrive | Missing, expired, or misconfigured `credentials` | Re-authorize the OneDrive credential in Lamatic and confirm the selected credential has access to the target drive. |
 * | No files are indexed | `drive_name` or `folder_path` is incorrect, the folder is empty, or files do not match supported globs | Verify the drive name, confirm the folder path format, and ensure the target files have supported extensions: `pdf`, `docx`, `txt`, `pptx`, or `md`. |
 * | Trigger runs but produces empty content | Files were discovered but connector extraction returned no usable text, or the files are unsupported/corrupted | Check file integrity, confirm the source documents contain extractable text, and test with a known-good plain text or PDF file. |
 * | Embedding step fails | `embeddingModelName` is not selected correctly or the backing model/provider is unavailable | Select a valid embedding model in the flow configuration and verify provider access in the Lamatic project. |
 * | Indexing step fails | `vectorDB` is missing, unreachable, or incompatible with the payload being written | Confirm the vector database resource is configured, available, and selected on the `Index` node input. |
 * | Existing records are unexpectedly replaced | `duplicateOperation` is set to `overwrite` and records share the same `file_name` primary key | If replacement is undesired, change the duplicate handling strategy or adjust the primary key design to include chunk-level uniqueness. |
 * | Metadata appears incomplete or misaligned with chunks | The metadata transform script or chunk extraction script is producing structures that do not line up | Review `@scripts/onedrive_get-chunks.ts` and `@scripts/onedrive_transform-metadata.ts` together to ensure chunk counts and metadata counts align. |
 * | Downstream retrieval finds nothing from OneDrive | This indexing flow has not been run yet, or the wrong vector database was selected | Run the flow successfully, then verify downstream retrieval is pointed at the same vector database populated by this flow. |
 *
 * ## Notes
 * - The trigger is configured for incremental sync, which is appropriate for recurring refreshes and lowers reprocessing overhead compared with repeated full ingestion.
 * - The primary key configuration uses only `file_name`. In environments where different folders can contain the same filename, this may cause overwrites across logically distinct documents.
 * - Chunk size and overlap are fixed in the current flow definition at `500` and `50` characters respectively. These settings are a retrieval-quality tradeoff and may need tuning for very dense or highly structured documents.
 * - Two custom scripts are central to this flow’s correctness: `@scripts/onedrive_get-chunks.ts` and `@scripts/onedrive_transform-metadata.ts`. If indexing behavior looks wrong, inspect those scripts before changing the surrounding nodes.
 * - Although this flow belongs to the broader Deep Research kit, it is an operational ingestion flow rather than an end-user-facing reasoning endpoint.
 */

// Flow: onedrive

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Onedrive",
  "description": "Onedrive",
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
      "name": "drive_name",
      "type": "text",
      "label": "Drive Name",
      "required": true,
      "isPrivate": true,
      "description": "Name of the Microsoft OneDrive drive where the file(s) exist. For most accounts, this is \"OneDrive\".",
      "defaultValue": "OneDrive",
      "airbyteInputName": "source/configuration.drive_name"
    },
    {
      "name": "folder_path",
      "type": "text",
      "label": "Folder Path",
      "required": true,
      "isPrivate": true,
      "description": "Path to a specific folder within the drives to search for files. Leave \".\" to search all folders of the drives. This does not apply to shared items. For a folder absolute path, use the format \"./FolderName/SubfolderName\"",
      "defaultValue": ".",
      "airbyteInputName": "source/configuration.folder_path"
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
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "onedrive_get_chunks": "@scripts/onedrive_get-chunks.ts",
    "onedrive_transform_metadata": "@scripts/onedrive_transform-metadata.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "onedriveNode",
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "Onedrive Business",
        "globs": [
          "**/*.pdf",
          "**/*.docx",
          "**/*.txt",
          "**/*.pptx",
          "**/*.md"
        ],
        "strategy": "auto",
        "syncMode": "incremental",
        "drive_name": "OneDrive",
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
        "code": "@scripts/onedrive_get-chunks.ts"
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
        "code": "@scripts/onedrive_transform-metadata.ts"
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
