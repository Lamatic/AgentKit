/*
 * # Onedrive
 * A scheduled OneDrive Business indexation flow that ingests supported files, chunks and vectorizes their contents, and writes them into the shared semantic search index used by the wider retrieval system.
 *
 * ## Purpose
 * This flow is responsible for turning documents stored in Microsoft OneDrive Business into searchable vector records. It connects to a configured drive, scans a target folder scope on an incremental schedule, extracts supported file content, breaks that content into retrieval-friendly chunks, generates embeddings for those chunks, and indexes the resulting vectors together with normalized metadata. In practical terms, it is the OneDrive-specific ingestion path in the kit's broader enterprise knowledge indexing strategy.
 *
 * The outcome of this flow is an updated vector collection containing semantic representations of OneDrive documents plus enough metadata to identify and trace those documents back to their source. That matters because the downstream semantic retrieval flow depends on these indexed vectors to answer natural-language queries over internal content. Without this ingestion step, OneDrive documents remain invisible to search even if the rest of the search stack is correctly configured.
 *
 * Within the broader agent pipeline, this flow sits on the indexing side of the plan-retrieve-synthesize pattern described in the parent kit. It is an entry-point ingestion flow rather than a retrieval or answer-generation flow. Its job ends once source content has been normalized, embedded, and stored in the vector database, after which sibling retrieval flows can search across the shared index alongside content ingested from other sources such as SharePoint, Google Drive, S3, Postgres, or web crawling.
 *
 * ## When To Use
 * - Use when your searchable knowledge source lives in Microsoft OneDrive Business.
 * - Use when you need to keep a vector index synchronized with documents stored in a specific OneDrive drive or folder.
 * - Use when your source files are primarily `pdf`, `docx`, `txt`, `pptx`, or `md` documents.
 * - Use when you want incremental synchronization instead of rebuilding the entire index on every run.
 * - Use when the semantic retrieval flow should be able to search OneDrive-hosted internal documents together with content from other ingestion flows.
 * - Use when operators need a scheduled background sync rather than an on-demand user-triggered indexing request.
 *
 * ## When Not To Use
 * - Do not use when the content source is not OneDrive Business; use the sibling flow for SharePoint, Google Drive, Google Sheets, S3, Postgres, or web crawling as appropriate.
 * - Do not use when no vector database has been configured, because the flow's terminal purpose is indexing embeddings into a vector store.
 * - Do not use when OneDrive credentials are unavailable or invalid.
 * - Do not use when the documents you need are outside the configured drive or folder path.
 * - Do not use when you need immediate query-time retrieval; this flow prepares the index but does not perform search.
 * - Do not use when your source material is an unsupported file type outside the configured glob patterns.
 * - Do not use when you need a bespoke API-style ingestion entry point for ad hoc payloads rather than connector-based scheduled sync.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | OneDrive authentication credentials used by the trigger connector to access Microsoft OneDrive Business. |
 * | `drive_name` | `text` | Yes | Name of the Microsoft OneDrive drive to scan. For most accounts this is `OneDrive`. |
 * | `folder_path` | `text` | Yes | Folder path within the drive to search. Use `.` to search broadly, or an absolute-style relative path such as `./FolderName/SubfolderName`. |
 * | `embeddingModelName` | `model` | Yes | Text embedding model used to convert extracted chunks into vector representations. |
 * | `vectorDB` | `select` | Yes | Target vector database where embeddings and metadata will be indexed. |
 *
 * Below the trigger-level inputs, the flow also has fixed internal configuration that shapes execution:
 *
 * - The connector is configured for `incremental` sync mode.
 * - The file match pattern is limited to `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`.
 * - The trigger uses `auto` strategy and `ALL` search scope.
 * - The scheduled cron expression is `0 0 00 ? * 1 * UTC`, which represents a weekly run.
 * - If historical sync state is full, the connector is configured to sync the last `3` days.
 *
 * Input assumptions and constraints:
 *
 * - `drive_name` must match the actual OneDrive drive name accessible to the provided credentials.
 * - `folder_path` should use the connector's expected path format; `.` means broad scanning, while nested folders should be written like `./Folder/Subfolder`.
 * - Only files matching the configured glob patterns will be processed.
 * - The selected embedding model must be compatible with `embedder/text` usage.
 * - The selected vector database must be writable by the indexing node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Embedding vectors generated from the extracted text chunks and passed into the indexing node. |
 * | `metadata` | `array` | Normalized metadata records aligned to the vectorized chunks for indexing. |
 * | `indexing_result` | `object` | The effective result of the `Index` node: records written or updated in the configured vector database. |
 *
 * The flow's effective output is a structured indexing operation rather than a user-facing prose response. Internally, chunk text is produced, converted to embeddings, paired with metadata, and written to the vector store. The exact response envelope depends on the runtime and indexing backend, but conceptually this flow returns the result of a successful index write, not a search result set. Because the flow terminates at the indexing node and has no explicit response-shaping node, developers should treat persisted vectors and metadata in the target vector database as the canonical outcome.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow.
 * - It does not require another Lamatic flow to run first; instead, it is triggered by the OneDrive connector on its own schedule using the configured credentials and source settings.
 *
 * ### Downstream Flows
 * - The kit's semantic retrieval flow consumes the vector records produced by this flow indirectly through the shared vector database.
 * - Downstream search components depend on this flow having populated the index with embeddings and source metadata derived from OneDrive documents.
 * - The fields that matter downstream are the stored vectors and associated metadata, including source-identifying fields such as document title, last modified timestamp, and source URL.
 *
 * ### External Services
 * - Microsoft OneDrive Business connector — used to enumerate and extract supported files from a configured drive and folder path — requires configured `credentials` on `triggerNode_1`.
 * - Embedding model provider — used to convert chunked text into embeddings — requires a selected `embeddingModelName` on `vectorizeNode_639` and whatever provider credentials that model requires in the Lamatic workspace.
 * - Vector database — used to store vectors and metadata for later semantic retrieval — requires configured `vectorDB` access on `IndexNode_622`.
 * - Custom Lamatic code scripts — used to reshape chunk payloads and metadata into the exact structures expected by later nodes — referenced by `codeNode_254` and `codeNode_507`.
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Provider-specific secrets may still be required implicitly by the selected embedding model or vector database integration, but they are not named in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `Onedrive Business` (`triggerNode`) starts the flow by connecting to Microsoft OneDrive Business with the selected `credentials`. It scans the configured `drive_name` and `folder_path`, applies the file globs for supported document types, and emits document content plus source metadata for each discovered or changed file under incremental sync rules.
 *
 * 2. `Variables` (`variablesNode`) reshapes key source fields from the trigger output into a simpler metadata scaffold. It maps `title` from `document_key`, `last_modified` from `_ab_source_file_last_modified`, and `source` from `_ab_source_file_url`, making these values easier to use consistently downstream.
 *
 * 3. `Chunking` (`chunkNode`) splits `triggerNode_1.output.content` into smaller text segments suitable for embedding and retrieval. It uses a recursive character strategy with a target chunk size of `500` characters, `50` characters of overlap, and separators of paragraph break, newline, and space. This balances recall and context retention for semantic search.
 *
 * 4. `Get Chunks` (`codeNode`) runs the `@scripts/onedrive_get-chunks.ts` script to transform the chunking node's output into the exact list or structure expected by the vectorization node. This is a source-specific adaptation layer between generic chunking and embedding.
 *
 * 5. `Vectorize` (`vectorizeNode`) sends the transformed chunk text from `codeNode_254.output` to the selected text embedding model. It returns vector representations for each chunk as `output.vectors`, which become the semantic search substrate stored in the vector database.
 *
 * 6. `Transform Metadata` (`codeNode`) runs the `@scripts/onedrive_transform-metadata.ts` script to assemble indexing metadata aligned with the generated vectors. This step is where chunk-level or document-level metadata is normalized into the shape expected by the indexing node.
 *
 * 7. `Index` (`IndexNode`) writes the generated vectors and transformed metadata into the configured `vectorDB`. It uses `file_name` as the primary key and `overwrite` as the duplicate handling strategy, meaning matching records are replaced rather than duplicated when the same file is reindexed.
 *
 * 8. The trailing add node is only a placeholder in the studio graph and does not add runtime behavior. The practical completion point of the flow is the successful execution of `Index`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication or connector startup fails | `credentials` are missing, expired, or do not authorize access to the target OneDrive Business account | Reconfigure the OneDrive credentials in Lamatic and verify they can access the specified drive and folder |
 * | Flow runs but no documents are indexed | `folder_path` points to the wrong location, the drive name is incorrect, or no files match the configured globs | Confirm `drive_name`, verify the folder path format, and ensure the target files are one of `pdf`, `docx`, `txt`, `pptx`, or `md` |
 * | Flow completes with empty embeddings or indexing payloads | Trigger returned files without usable `content`, or the chunk extraction script produced an empty result | Inspect connector output for content extraction, then validate the behavior of `@scripts/onedrive_get-chunks.ts` on the returned payload |
 * | Embedding step fails | `embeddingModelName` is unset, incompatible, unavailable, or lacks provider access | Select a valid `embedder/text` model and confirm the underlying model provider is configured in the workspace |
 * | Indexing step fails | `vectorDB` is not configured correctly, is unreachable, or rejects the metadata/vector payload | Verify the vector database connection, collection configuration, and expected field formats for vectors and metadata |
 * | Reindexed files do not create separate historical versions | Duplicate handling is set to `overwrite` with `file_name` as the primary key | Change keying strategy or duplicate policy if versioned retention is required instead of in-place replacement |
 * | Some expected OneDrive files never appear in search | The files are outside the configured folder scope, are in unsupported formats, or have not changed under incremental sync conditions | Expand the folder scope, add or change supported patterns in the flow, or force a broader resync if needed |
 * | Downstream semantic search returns no OneDrive matches even though this flow ran | The retrieval flow is pointed at a different vector database or collection, or this flow has not successfully written records | Confirm both indexing and retrieval flows target the same vector store and verify records exist after indexing |
 * | Metadata fields are missing or malformed in the vector index | Source metadata fields from the connector differ from what the variable mapping or metadata transform script expects | Validate trigger output field names and update the variable mapping or `@scripts/onedrive_transform-metadata.ts` accordingly |
 * | Upstream flow not having run | The retrieval layer is querying an index that has not yet been populated by this ingestion flow | Run this flow successfully first, then retry retrieval after confirming indexed records are present |
 *
 * ## Notes
 * - This flow is designed as one of several sibling ingestion paths in the semantic search kit. It follows the shared ingestion pattern of source extraction, chunking, vectorization, and indexing, but with OneDrive-specific connector and metadata handling.
 * - The scheduled trigger is weekly by default. If fresher search results are required, operators should adjust the schedule in the flow configuration.
 * - The primary key for indexing is `file_name`, which is simple but may be insufficient if different folders can contain files with the same name. Review the metadata transform script and indexing key strategy if collision risk exists.
 * - Because chunk and metadata shaping rely on custom scripts, those scripts are part of the flow's functional contract even though their internal logic is not shown here. Any changes to chunk structure or metadata schema should be coordinated with the vector database schema and downstream retrieval expectations.
 * - The flow indexes content for later search; it does not itself answer questions, rank results for end users, or synthesize responses.
 */

// Flow: onedrive
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "onedrive_get_chunks": "@scripts/onedrive_get-chunks.ts",
    "onedrive_transform_metadata": "@scripts/onedrive_transform-metadata.ts"
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
