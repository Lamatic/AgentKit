/*
 * # Sharepoint
 * A scheduled SharePoint indexation flow that ingests supported files from a SharePoint site, chunks and vectorizes their contents, and writes them into the shared semantic search index used by the wider retrieval system.
 *
 * ## Purpose
 * This flow is responsible for turning documents stored in SharePoint into searchable vector records. It solves the source-specific ingestion problem for SharePoint Business content by authenticating against a configured site, syncing files incrementally, extracting document text, splitting that text into retrieval-sized chunks, generating embeddings, and indexing both vectors and metadata into a selected vector database.
 *
 * The outcome is a persistent, queryable semantic representation of SharePoint documents. That matters because the broader Semantic Search agent relies on a unified vector index across many enterprise sources. Without this flow, documents that live in SharePoint would remain invisible to downstream semantic retrieval even if the rest of the search stack is correctly configured.
 *
 * Within the larger agent architecture, this is an indexation flow, not a retrieval or synthesis flow. It sits on the ingestion side of the pipeline described in the parent agent: source-specific extraction first, then normalization into chunks, then embedding, then indexing. Downstream retrieval flows can then search over the vectors this flow produces alongside vectors created by sibling indexers for OneDrive, Google Drive, S3, Postgres, web crawling, and other supported sources.
 *
 * ## When To Use
 * - Use when your organization stores knowledge documents in SharePoint and you want them included in the semantic search index.
 * - Use when you need scheduled, recurring synchronization from a SharePoint site rather than one-off manual file uploads.
 * - Use when the source files are in supported document formats such as `pdf`, `docx`, `txt`, `pptx`, or `md`.
 * - Use when a vector database has already been selected or provisioned for the semantic search system.
 * - Use when you want incremental sync behavior so only new or changed SharePoint content is reprocessed.
 * - Use when this flow should act as one of several ingestion pipelines feeding a shared retrieval layer.
 *
 * ## When Not To Use
 * - Do not use when the content source is not SharePoint; use the sibling indexation flow that matches the actual source such as OneDrive, Google Drive, S3, Postgres, or web crawling.
 * - Do not use when no valid SharePoint or OneDrive-compatible credentials have been configured for the trigger.
 * - Do not use when the target SharePoint site URL is unknown, inaccessible, or outside the credential scope.
 * - Do not use when the content you need indexed is not file-based document content or is stored in a system better handled by another source connector.
 * - Do not use when you need live semantic search results directly from a user query; this flow prepares the index but does not perform retrieval.
 * - Do not use when no vector database destination has been configured, because indexing cannot complete without it.
 * - Do not use when you require exact preservation of whole documents in a single vector record; this flow intentionally splits content into chunks for retrieval quality.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | SharePoint/OneDrive authentication credentials used by the trigger connector to access the target site. |
 * | `site_url` | `resourceLocator` | Yes | SharePoint site to sync. Can be chosen from a discovered list or provided directly as a URL such as `https://<tenant>.sharepoint.com/sites/<site>`. |
 * | `embeddingModelName` | `model` | Yes | Text embedding model used to convert chunked document text into vector representations. Must support `embedder/text`. |
 * | `vectorDB` | `select` | Yes | Target vector database where vectors and metadata will be indexed. |
 *
 * Below the table, note these constraints and assumptions:
 * - `site_url` is required and is expected to identify a SharePoint site, not an arbitrary file URL.
 * - The trigger is configured in `list` mode by default for `site_url`, but the input definition also allows direct URL entry.
 * - The connector only considers files matching the configured globs: `**\/*.pdf`, `**\/*.docx`, `**\/*.txt`, `**\/*.pptx`, and `**\/*.md`.
 * - The flow is configured for incremental sync with automatic extraction strategy and a default folder path of `.`.
 * - The embedding model must be a text embedding model compatible with the vectorization node.
 * - The chosen vector database must be writable by the indexing node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Embedding vectors generated from the SharePoint document chunks and passed into indexing. |
 * | `metadata` | `array` | Normalized metadata records associated with the generated chunks, prepared for indexing. |
 * | indexed records | `write result` | The durable effect of the flow: chunk vectors and metadata stored in the configured vector database. |
 *
 * The flow is primarily an ingestion pipeline rather than a response-oriented API flow, so its meaningful output is the indexed state written to the vector database. Internally, the data moves as structured arrays of chunk text, vector values, and metadata objects. There is no dedicated final response-mapping node in the exported graph, so operators should treat successful completion of the indexing step as the canonical outcome.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point indexation flow.
 * - It does not require another Lamatic flow to execute first, but it does depend on operator configuration having already provided valid `credentials`, `site_url`, `embeddingModelName`, and `vectorDB` values.
 *
 * ### Downstream Flows
 * - The bundle's semantic retrieval flow consumes the vector index populated by this flow.
 * - Downstream search depends on the records written by the `Index` node, specifically the stored chunk embeddings from `vectors` and the associated metadata from `metadata`.
 * - Sibling retrieval or UI-oriented flows do not call this flow directly at runtime; they rely on its side effect of having populated the shared vector database.
 *
 * ### External Services
 * - SharePoint Business connector — used to enumerate and sync documents from the configured SharePoint site — required credential: `credentials`
 * - SharePoint site discovery API — used when `site_url` is selected from the list mode — required credential: `credentials`
 * - Embedding model provider — used to transform chunk text into embeddings — required configuration: `embeddingModelName`
 * - Vector database — used to persist vectors and metadata for later semantic search — required configuration: `vectorDB`
 * - Lamatic script runtime — used to reshape chunk output and metadata through `sharepoint_get-chunks.ts` and `sharepoint_transform-metadata.ts` — no user-supplied environment variable declared in this flow export
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the exported flow configuration.
 * - Credential-backed access is handled through the private `credentials` input on `triggerNode_1`.
 * - Model and vector store selection are handled through private inputs on `vectorizeNode_639` and `IndexNode_622` rather than named environment variables.
 *
 * ## Node Walkthrough
 * 1. `Sharepoint Business` (`triggerNode`) starts the flow by connecting to the configured SharePoint site and synchronizing files from the root folder path `.` within the full search scope. It is configured for incremental sync, uses an automatic extraction strategy, and only emits files whose paths match the supported document globs for `pdf`, `docx`, `txt`, `pptx`, and `md`.
 *
 * 2. `Variables` (`variablesNode`) maps selected trigger output fields into normalized variables used downstream for metadata construction. It captures `title` from `triggerNode_1.output.document_key`, `last_modified` from `triggerNode_1.output._ab_source_file_last_modified`, and `source` from `triggerNode_1.output._ab_source_file_url`.
 *
 * 3. `Chunking` (`chunkNode`) takes the raw document content from `triggerNode_1.output.content` and splits it into smaller text segments. It uses a recursive character splitter with `500` characters per chunk, `50` characters of overlap, and separator preference order of double newline, newline, then space. This produces chunk-sized text units better suited for semantic embedding and retrieval.
 *
 * 4. `Get Chunks` (`codeNode`) runs the referenced script `sharepoint_get-chunks.ts` to transform the chunking node's output into the exact structure expected by the embedding step. This is a source-specific normalization step that bridges the chunker output format and the vectorizer input contract.
 *
 * 5. `Vectorize` (`vectorizeNode`) sends the prepared chunk text from `codeNode_254.output` to the selected embedding model. The result is a collection of embedding vectors under `vectorizeNode_639.output.vectors`, aligned to the chunked SharePoint content.
 *
 * 6. `Transform Metadata` (`codeNode`) runs the referenced script `sharepoint_transform-metadata.ts` to build the metadata payload that will be stored alongside the vectors. This step combines upstream context into a normalized metadata array under `codeNode_507.output.metadata`, ensuring the indexed records remain traceable back to source document identity and location.
 *
 * 7. `Index` (`IndexNode`) writes the vectors and metadata into the chosen vector database. It reads vectors from `vectorizeNode_639.output.vectors`, metadata from `codeNode_507.output.metadata`, uses `file_name` as the primary key, and is configured with `duplicateOperation` set to `overwrite`, meaning existing indexed records with the same key are replaced rather than duplicated.
 *
 * 8. The trailing add node is only a canvas placeholder and does not contribute runtime behavior.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Authentication fails at the trigger | `credentials` are missing, expired, revoked, or do not grant access to the target SharePoint site | Reconfigure the `credentials` input with a valid account or app credential that can access the specified `site_url` |
 * | No files are processed | The site exists but contains no files matching the configured glob patterns, or the relevant files are outside the current folder/scope | Verify the SharePoint site contents, confirm file extensions are among the supported globs, and adjust source placement if needed |
 * | The trigger cannot locate the site | `site_url` is malformed, points to the wrong tenant/site, or is not accessible under the selected credentials | Provide a valid SharePoint site URL or choose the site from the connector's list mode |
 * | Chunking runs but embeddings are empty or fail | `embeddingModelName` is unset, incompatible, unavailable, or rate-limited | Select a valid `embedder/text` model and verify model availability and account access |
 * | Indexing fails after vectorization | `vectorDB` is not configured, unreachable, or rejects writes | Select a valid writable vector database and confirm connectivity and permissions |
 * | Duplicate or stale records appear in search | Primary key choice and overwrite behavior may replace records by `file_name`, which can collide across folders or sites | Ensure file naming conventions are unique enough for your corpus, or revise the indexing design if collisions are possible |
 * | Metadata is missing or malformed | One of the code scripts produced an unexpected structure, often due to unexpected upstream connector output | Inspect the outputs feeding `Get Chunks` and `Transform Metadata`, and update the scripts to match the actual trigger payload shape |
 * | Search flow returns no SharePoint content later | This indexing flow never ran successfully, indexed into the wrong vector database, or used a collection not queried by retrieval | Re-run the flow with the same vector database target expected by the downstream search flow and verify successful indexing |
 *
 * ## Notes
 * - The flow is scheduled with cron expression `0 0 00 ? * 1 * UTC`, which indicates a weekly run on Monday at 00:00 UTC unless overridden by platform scheduling controls.
 * - Sync mode is `incremental`, so the flow is designed for recurring refresh rather than full historical reindex on every run.
 * - The trigger includes `days_to_sync_if_history_is_full` set to `3`, suggesting the connector falls back to a recent synchronization window when full history cannot be obtained.
 * - Metadata mapping explicitly captures source URL and last modified timestamp, which is important for downstream result display and source attribution.
 * - The indexing node uses `file_name` as its primary key. **Be careful** if multiple documents from different folders or sites can share the same file name, because overwrite semantics may replace previously indexed content.
 * - Two custom scripts are central to this flow's correctness: `sharepoint_get-chunks.ts` and `sharepoint_transform-metadata.ts`. Any change to upstream connector payload shape or desired index schema should be reflected there.
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
