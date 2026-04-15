/*
 * # Sharepoint
 * A flow that ingests documents from a SharePoint site, converts them into vector embeddings, and indexes them for use by the wider internal RAG assistant system.
 *
 * ## Purpose
 * This flow is responsible for turning SharePoint-hosted business documents into searchable vector data. It connects to a configured SharePoint site, reads supported files from that site, extracts document content, chunks the text into retrieval-friendly segments, generates embeddings for those chunks, and writes the resulting vectors plus metadata into a selected vector database.
 *
 * The outcome is a populated or updated vector index containing SharePoint-derived knowledge that can later be retrieved by assistant flows. That matters because the assistant side of the bundle depends on high-quality indexed content to ground answers in internal sources rather than generating responses from model priors alone. Without this ingestion step, SharePoint content remains invisible to downstream retrieval.
 *
 * In the broader bundle, this is an entry-point indexation flow in the ingest phase of the plan-retrieve-synthesize lifecycle described by the parent agent. It does not answer user questions directly. Instead, it prepares one slice of the organization’s knowledge base so that downstream web, Slack, or Teams assistant flows can retrieve relevant chunks during RAG execution.
 *
 * ## When To Use
 * - Use when the organization’s source of truth or a meaningful portion of it lives in SharePoint sites and document libraries.
 * - Use when you need to ingest or refresh internal documents such as `PDF`, `DOCX`, `TXT`, `PPTX`, or `MD` files from SharePoint into a vector store.
 * - Use when you are setting up the internal assistant bundle and want SharePoint content to be available to downstream RAG assistants.
 * - Use when incremental synchronization is preferred over full reindexing and the SharePoint connector credentials are already configured.
 * - Use when operators want a scheduled, repeatable indexation path for SharePoint Business content.
 *
 * ## When Not To Use
 * - Do not use when the content source is not SharePoint; use the sibling indexation flow that matches the actual source such as Google Drive, OneDrive, S3, Postgres, or web crawling.
 * - Do not use when no vector database has been selected or provisioned, because the flow’s terminal action is vector indexing.
 * - Do not use when SharePoint credentials are missing, expired, or do not have access to the target site.
 * - Do not use when the required content is outside the configured site scope or stored in unsupported file formats.
 * - Do not use this flow to answer end-user questions directly; assistant flows are the correct entry point for conversational retrieval and synthesis.
 * - Do not use when you need ad hoc live document browsing rather than scheduled or ingestion-oriented indexing.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | SharePoint or OneDrive authentication credentials used by the trigger connector to access the target site. |
 * | `site_url` | `resourceLocator` | Yes | The SharePoint site to index. Can be selected from a discovered list or supplied directly as a URL such as `https://lamatic.sharepoint.com/sites/test`. |
 * | `vectorDB` | `select` | Yes | The target vector database where generated embeddings and metadata will be indexed. |
 * | `embeddingModelName` | `model` | Yes | The text embedding model used to convert extracted chunk text into vectors. |
 *
 * Below the table, the main validation assumptions are connector-specific. `site_url` must point to an accessible SharePoint site and is expected either as a valid URL or as a value resolved from the connector’s site listing method. The flow is configured to process files matching the glob patterns `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`. The trigger is set to incremental sync with automatic extraction strategy, root folder path `.`, search scope `ALL`, and a weekly cron expression of `0 0 00 ? * 1 * UTC`.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | The embedding vectors generated from the prepared SharePoint text chunks and passed into the index node. |
 * | `metadata` | `array` | The transformed metadata records associated with the vectors, prepared for indexing. |
 * | `index_result` | `object` | The effective write outcome from the indexing step into the selected vector database. Exact shape depends on the backing vector store implementation. |
 *
 * The flow’s output is operational rather than conversational. Internally it works with lists of chunks, vectors, and metadata records, then writes them to the vector database. There is no explicit custom response-mapping node in the exported flow, so the externally observed response is typically the terminal indexing outcome from `Index`, potentially accompanied by provider-specific status details. Completeness depends on what the SharePoint connector returns during the incremental sync window and what files match the configured patterns.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow.
 * - In bundle terms, it sits at the start of the SharePoint ingestion path and does not require another Lamatic flow to run first.
 *
 * ### Downstream Flows
 * - Assistant flows in the parent bundle consume the indexed data produced by this flow indirectly through the shared vector database.
 * - The downstream web, Slack, or Teams RAG assistants rely on the vectors and metadata written by this flow so retrieval can surface SharePoint-derived chunks at question time.
 * - Those downstream flows do not consume a direct API payload from this flow; they depend on the persisted vector records in `vectorDB`.
 *
 * ### External Services
 * - SharePoint Business connector — reads documents and metadata from the configured SharePoint site — requires configured `credentials` input.
 * - Vector embedding model — converts prepared text chunks into numerical vector representations — requires the selected `embeddingModelName` model.
 * - Vector database — stores vectors plus metadata for later retrieval — requires the selected `vectorDB` destination.
 * - Lamatic script runtime — executes `sharepoint_get-chunks.ts` and `sharepoint_transform-metadata.ts` to reshape chunk and metadata payloads — uses the platform runtime, with no explicit environment variable shown in the flow export.
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow configuration.
 * - Credentials and model or database selections are supplied as private flow inputs rather than named environment variables.
 *
 * ## Node Walkthrough
 * 1. `Sharepoint Business` (`triggerNode`) starts the flow by connecting to the configured SharePoint site using the selected `credentials` and `site_url`. It is configured for incremental sync, scans from folder path `.`, searches scope `ALL`, and considers files matching `PDF`, `DOCX`, `TXT`, `PPTX`, and `MD` glob patterns. It emits document content and source metadata for each matched file.
 *
 * 2. `Variables` (`variablesNode`) normalizes a small metadata envelope from the trigger output. It maps `title` from `{{triggerNode_1.output.document_key}}`, `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`, and `source` from `{{triggerNode_1.output._ab_source_file_url}}`. This creates a consistent metadata base for downstream processing.
 *
 * 3. `Chunking` (`dynamicNode`) splits `{{triggerNode_1.output.content}}` into retrieval-sized pieces. It uses a recursive character text splitter with `500` characters per chunk, `50` characters of overlap, and separators in descending priority order of double newline, newline, then space. This balances semantic continuity with chunk size suitable for embeddings and later retrieval.
 *
 * 4. `Get Chunks` (`dynamicNode`) runs the script reference `@scripts/sharepoint_get-chunks.ts`. Its role is to take the chunking output and reshape or extract exactly the chunk text array required by the vectorization node. This is an adaptation step between generic chunk output and the embedder’s expected input format.
 *
 * 5. `Vectorize` (`dynamicNode`) takes `{{codeNode_254.output}}` as `inputText` and sends those prepared chunk strings to the selected `embeddingModelName`. It returns vector representations under `output.vectors` for each chunk.
 *
 * 6. `Transform Metadata` (`dynamicNode`) runs the script reference `@scripts/sharepoint_transform-metadata.ts`. It combines the existing context from prior nodes into the metadata structure expected by the indexer, producing `output.metadata` aligned with the generated vectors.
 *
 * 7. `Index` (`dynamicNode`) writes the vectors and metadata into the selected `vectorDB`. It uses `{{vectorizeNode_639.output.vectors}}` as `vectorsField` and `{{codeNode_507.output.metadata}}` as `metadataField`. The configured `primaryKeys` value is `file_name`, and duplicate handling is set to `overwrite`, meaning reindexed records with the same primary key replace earlier entries.
 *
 * 8. The trailing add node is only a canvas placeholder and does not perform runtime business logic. The practical terminal behavior of the flow is the completion of the `Index` step.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | SharePoint trigger cannot connect or returns an authentication error | `credentials` are missing, expired, or do not authorize access to the target site | Reconfigure the SharePoint or OneDrive credentials, verify tenant permissions, and confirm the account can access the specified `site_url` |
 * | No files are indexed even though the flow runs successfully | The selected site has no matching files, the documents are outside the configured path or search scope, or file extensions do not match the configured glob patterns | Confirm the site contains supported file types, verify document placement under the searched scope, and adjust source content or connector settings if needed |
 * | `site_url` selection fails or the site is not found | The URL is malformed, points to an inaccessible site, or the connector cannot enumerate sites for the current credentials | Use a valid SharePoint site URL, test the URL directly, and ensure the credential has permission to list or access the site |
 * | Chunking or vectorization fails on specific documents | Extracted content is empty, malformed, or too noisy for downstream processing | Inspect the source document, verify the trigger emitted usable `content`, and retry with cleaner or supported files |
 * | Metadata indexing fails or records are rejected by the vector database | The transformed metadata schema does not match the target vector store expectations, or required keys such as `file_name` are missing from the final metadata | Review the metadata transformation script output, ensure the primary key field exists, and align metadata fields with the target vector store schema |
 * | Existing indexed records are unexpectedly replaced | `duplicateOperation` is configured as `overwrite` and documents share the same `file_name` primary key | Change key strategy if uniqueness must be finer-grained, or ensure filenames are unique within the indexed corpus |
 * | Downstream assistants cannot retrieve SharePoint knowledge after a successful run | The flow indexed into the wrong `vectorDB`, the assistant flows are pointed at a different index, or retrieval configuration excludes these records | Verify the selected vector database matches the one used by the assistant flows and confirm retrieval settings include this indexed corpus |
 * | Incremental sync misses older documents | The connector is configured for incremental sync and may only process items within its sync logic or recent history window | Run a fuller backfill strategy if available, review connector sync behavior, and validate historical content ingestion requirements before relying on incremental-only runs |
 *
 * ## Notes
 * - The flow is configured on a schedule with cron expression `0 0 00 ? * 1 * UTC`, which indicates a recurring weekly run on Mondays at midnight UTC.
 * - The connector strategy is `auto`, so extraction behavior depends partly on the connector’s built-in handling of supported file types.
 * - Duplicate handling is intentionally destructive for matching primary keys because `overwrite` is enabled; this is useful for refreshes but requires confidence that `file_name` is a stable and sufficiently unique identifier.
 * - The variables step defines `title`, `last_modified`, and `source`, but the final indexed metadata shape is ultimately controlled by the `Transform Metadata` script.
 * - Because this flow persists data for later retrieval rather than returning end-user prose, observability should focus on indexed record counts, vector store write success, and metadata quality rather than response text.
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
