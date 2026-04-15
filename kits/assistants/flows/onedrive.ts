/*
 * # Onedrive
 * A scheduled OneDrive Business ingestion flow that reads supported files from a Microsoft OneDrive drive, chunks and vectorizes their contents, and writes them into the shared vector index used by the wider internal RAG system.
 *
 * ## Purpose
 * This flow is responsible for turning documents stored in Microsoft OneDrive into retrieval-ready vector records. It connects to a configured OneDrive Business account, scans the target drive and folder path for supported document types, extracts file content from incremental changes, enriches each document with source metadata, splits long content into chunks, generates embeddings, and indexes the resulting vectors into a selected vector database.
 *
 * The outcome is a searchable representation of OneDrive content inside the system’s knowledge base. That matters because the assistant flows in this kit depend on a populated vector store to retrieve relevant internal context before generating answers. Without this ingestion step, downstream assistants can only answer from whatever other sources have already been indexed, leaving OneDrive-hosted knowledge invisible to retrieval.
 *
 * Within the broader pipeline described by the parent agent, this is an entry-point indexation flow in the ingest phase of the retrieve-augment-answer lifecycle. It does not answer user questions directly. Instead, it feeds the shared retrieval layer that later assistant flows query during RAG execution across web chat, Slack, or Microsoft Teams channels.
 *
 * ## When To Use
 * - Use when your organisation stores knowledge documents in Microsoft OneDrive and you want those files searchable by the internal assistant.
 * - Use when you need to index or refresh content from a specific OneDrive drive, especially the default `OneDrive` drive for a business account.
 * - Use when the source files live in a known folder subtree and you want to limit ingestion with `folder_path`.
 * - Use when you want scheduled, incremental synchronisation rather than a one-off manual document upload flow.
 * - Use when supported document types such as `pdf`, `docx`, `txt`, `pptx`, or `md` should be converted into embeddings for a shared vector database.
 *
 * ## When Not To Use
 * - Do not use this flow if the source content lives in another system such as Google Drive, SharePoint, S3, Postgres, or a crawled website; use the corresponding sibling indexation flow instead.
 * - Do not use this flow if no OneDrive Business credentials have been configured; the trigger cannot authenticate without them.
 * - Do not use this flow when you need direct question answering or conversational interaction; an assistant flow should consume the indexed data later.
 * - Do not use this flow for file types outside the configured glob patterns if you expect those files to be ingested, because unsupported extensions will not be processed by this flow.
 * - Do not use this flow when no vector database or embedding model has been configured, because vector generation and indexing are mandatory downstream steps.
 * - Do not use this flow if you need exact preservation of whole-document structure without chunking; this flow always splits content into retrieval-oriented chunks.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | OneDrive authentication credential used by the trigger to access the Microsoft OneDrive source. |
 * | `drive_name` | `text` | Yes | Name of the Microsoft OneDrive drive to read from. For most accounts this is `OneDrive`. |
 * | `folder_path` | `text` | Yes | Folder path within the drive to search. Use `.` to search broadly, or a path like `./Folder/Subfolder` to scope ingestion. |
 * | `embeddingModelName` | `model` | Yes | Text embedding model used to convert extracted chunks into vector representations. |
 * | `vectorDB` | `select` | Yes | Target vector database where the generated vectors and metadata will be indexed. |
 *
 * Notable constraints and assumptions:
 * - `folder_path` is expected in OneDrive connector format. `.` means broad search, while absolute-style folder paths should begin with `./`.
 * - The flow is configured to scan only files matching the glob patterns `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`.
 * - The trigger uses incremental sync mode, so it assumes the connector can track changed content over time.
 * - The selected `embeddingModelName` must be compatible with `embedder/text` usage.
 * - The chosen `vectorDB` must be a writable vector store supported by the Lamatic indexing node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `document_key` | `string` | Source document identifier emitted by the OneDrive trigger and reused as the logical title during metadata construction. |
 * | `_ab_source_file_last_modified` | `string` | Last modified timestamp from the source file, captured into metadata. |
 * | `_ab_source_file_url` | `string` | Source URL of the ingested OneDrive file, captured into metadata. |
 * | `content` | `string` | Raw extracted document content from the trigger, before chunking. |
 * | `vectors` | `array` | Embedding vectors generated from the prepared chunk list. |
 * | `metadata` | `array` or `object` | Metadata payload produced for indexing, aligned to the vectorized chunks. |
 *
 * The flow primarily produces indexed side effects in the configured vector database rather than a rich end-user response payload. In practical terms, its most important output is a batch of vector records written to storage. Intermediate outputs are structured values passed between nodes: raw document text, chunk text arrays, embedding vectors, and transformed metadata objects. Completeness depends on what the OneDrive trigger returns during the incremental sync window; unchanged or unsupported files may not appear in a given run.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a standalone entry-point ingestion flow. No other Lamatic flow must run before it.
 * - Operationally, it does depend on prior platform configuration: valid OneDrive credentials, an available embedding model, and a provisioned vector database target.
 *
 * ### Downstream Flows
 * - Assistant flows in the parent kit consume the vector records this flow indexes, rather than calling this flow directly at runtime.
 * - The web chat, Slack, and Microsoft Teams assistant flows rely on the shared vector database populated here so their retrieval steps can fetch relevant chunks and metadata.
 * - The most important downstream artifacts are the indexed chunk vectors and associated metadata, especially source fields such as title, URL, and modification time used for grounded answers and citations.
 *
 * ### External Services
 * - Microsoft OneDrive Business connector — reads files and incremental updates from the configured drive and folder path — required credential: `credentials`
 * - Embedding model provider selected by `embeddingModelName` — converts chunk text into dense vectors — required credential or provider configuration depends on the chosen model
 * - Vector database selected by `vectorDB` — stores vectors plus metadata for later retrieval — required credential or connection depends on the selected database
 * - Script reference `@scripts/onedrive_get-chunks.ts` — reshapes chunking output into the format expected by vectorization — no direct user-supplied credential exposed in this flow
 * - Script reference `@scripts/onedrive_transform-metadata.ts` — reshapes metadata into the format expected by indexing — no direct user-supplied credential exposed in this flow
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow definition.
 * - Provider-specific secrets may still be required indirectly by the selected embedding model or vector database connection, but they are not named in this flow export.
 *
 * ## Node Walkthrough
 * 1. `Onedrive Business` (`triggerNode`) starts the flow by authenticating with the selected OneDrive credential and scanning the configured `drive_name` and `folder_path`. It is set to incremental sync mode with automatic strategy selection, a weekly cron schedule of `0 0 00 ? * 1 * UTC`, and supported file globs for `pdf`, `docx`, `txt`, `pptx`, and `md`. For each eligible file event, it emits the extracted `content` plus source fields such as `document_key`, `_ab_source_file_last_modified`, and `_ab_source_file_url`.
 *
 * 2. `Variables` (`variablesNode`) normalizes a small metadata object from the trigger output. It maps `title` from `{{triggerNode_1.output.document_key}}`, `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`, and `source` from `{{triggerNode_1.output._ab_source_file_url}}`. This creates a consistent metadata scaffold used later when the flow prepares records for indexing.
 *
 * 3. `Chunking` (`chunkNode`) splits `{{triggerNode_1.output.content}}` into retrieval-sized segments. It uses recursive character splitting with `500` characters per chunk, `50` characters of overlap, and separator preference order `\n\n`, `\n`, then space. This balances chunk readability with retrieval granularity and helps preserve context across adjacent segments.
 *
 * 4. `Get Chunks` (`codeNode`) runs the referenced script `@scripts/onedrive_get-chunks.ts`. Its job is to transform the chunking node’s output into the exact list or structure that the embedding node expects as `inputText`. This is a formatting bridge between Lamatic’s chunk output and the vectorization contract.
 *
 * 5. `Vectorize` (`vectorizeNode`) sends the prepared chunk list from `{{codeNode_254.output}}` to the selected text embedding model. It returns `vectors`, which are dense numeric representations of each chunk suitable for similarity search in the target vector store.
 *
 * 6. `Transform Metadata` (`codeNode`) runs `@scripts/onedrive_transform-metadata.ts`. It takes the normalized metadata context and aligns it with the vectorized chunk set so the indexer receives metadata in the right shape. This step is where document-level fields are typically expanded or repeated per chunk to preserve traceability in retrieval.
 *
 * 7. `Index` (`IndexNode`) writes the generated vectors and transformed metadata to the selected `vectorDB`. It reads vectors from `{{vectorizeNode_639.output.vectors}}`, metadata from `{{codeNode_507.output.metadata}}`, uses `file_name` as the declared primary key, and applies duplicate handling with `overwrite`, meaning newer ingested records replace existing entries for the same key.
 *
 * 8. `addNode` (`addNode`) is just the terminal placeholder in the exported graph. It does not add business logic; it marks the current end of the pipeline after indexing completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication failure at start of run | `credentials` is missing, expired, or does not grant access to the specified OneDrive Business drive | Reconfigure the OneDrive credential, confirm tenant and account access, and test access to the target drive outside the flow if needed |
 * | No files are ingested | `folder_path` points to the wrong location, the drive name is wrong, or no files match the configured globs | Verify `drive_name`, check that `folder_path` is correct, and confirm that target files use one of the supported extensions |
 * | Flow runs but produces little or no new index data | Incremental sync found no changed files during the current sync window | Trigger a source change, review sync history, or adjust connector settings if a backfill is required |
 * | Chunking or vectorization receives empty input | Source file content could not be extracted, or the trigger emitted an empty `content` field | Validate that the files are readable and supported, and inspect connector output for extraction issues |
 * | Embedding step fails | `embeddingModelName` is unset, incompatible, unavailable, or lacks provider credentials | Select a valid text embedding model and ensure the corresponding model provider is configured correctly in the workspace |
 * | Indexing step fails | `vectorDB` is not selected, is unreachable, or rejects the payload shape | Confirm vector database configuration, permissions, and schema expectations for vectors plus metadata |
 * | Metadata indexing is misaligned with vectors | The metadata transform script and chunk list are producing different counts or shapes | Review `@scripts/onedrive_transform-metadata.ts` and `@scripts/onedrive_get-chunks.ts` together to ensure one metadata record exists for each vectorized chunk |
 * | Duplicate documents overwrite unexpectedly | `duplicateOperation` is set to `overwrite` and `file_name` collisions occur | Adjust key strategy if unique chunk-level identities are needed, or accept overwrite behavior as the intended deduplication model |
 * | Expected assistant answers do not reflect OneDrive content | This ingestion flow has not run successfully, or downstream assistants are pointed at a different vector store | Run and verify this flow, then confirm assistant retrieval configuration uses the same indexed vector database |
 *
 * ## Notes
 * - The flow is scheduled by cron and configured for incremental sync, so it is best suited to ongoing refresh of a OneDrive-backed knowledge base rather than ad hoc one-time uploads.
 * - Although the trigger includes additional fields such as `search_scope`, `start_date`, and `days_to_sync_if_history_is_full`, only `drive_name` and `folder_path` are exposed as configurable private inputs in this export.
 * - Metadata fields explicitly normalized in-flow are `title`, `last_modified`, and `source`. If your retrieval or citation experience requires more fields, the transform script is the natural extension point.
 * - The index node declares `file_name` as its primary key, but that field is not visibly constructed in the exported variables mapping. Developers should verify how the metadata transform script materializes `file_name` to avoid key mismatches.
 * - Because chunking is character-based, very structured documents such as slide decks or heavily formatted files may yield chunks that are retrieval-friendly but not visually aligned to original page or slide boundaries.
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
