/*
 * # GDrive
 * A scheduled Google Drive indexation flow that ingests documents from a selected Drive folder, converts them into vector-searchable chunks, and stores them in the project’s vector database for downstream internal retrieval.
 *
 * ## Purpose
 * This flow is responsible for building and refreshing a searchable internal knowledge index from Google Drive content. It connects to a configured Drive folder, reads document content through the Google Drive trigger, splits that content into retrieval-friendly chunks, generates embeddings for those chunks, and writes both vectors and metadata into a selected vector database. Its core job is not to answer user questions directly, but to prepare organizational content so other reasoning flows can retrieve it efficiently later.
 *
 * The outcome of this flow is a persisted vector index keyed by document metadata, with duplicate handling configured to overwrite existing records that share the same primary key. That matters because the broader agent system depends on high-quality indexed internal sources to ground answers in enterprise documents rather than relying only on public web search. Without this flow, the internal data source branch of the research pipeline has nothing to search.
 *
 * Within the wider Deep Research architecture, this flow sits on the indexing side of the plan-retrieve-synthesize lifecycle described in the parent agent. It is an operational data-preparation flow, typically run on a schedule or on demand by an operator, before end-user research requests hit retrieval flows such as the internal data source search path. In other words, this flow feeds the retrieval layer; it is not itself part of the user-facing reasoning loop.
 *
 * ## When To Use
 * - Use when you need to ingest documents from a Google Drive folder into the project’s vector database.
 * - Use when an internal knowledge source should become searchable by downstream retrieval or reasoning flows.
 * - Use when Google Drive content has changed and the index must be refreshed.
 * - Use when onboarding a new Drive folder as an internal corpus for Deep Research.
 * - Use when scheduled incremental synchronization is desired for a Google Drive-backed knowledge source.
 *
 * ## When Not To Use
 * - Do not use when the source content lives outside Google Drive; use the sibling indexation flow for the correct connector such as Google Sheets, OneDrive, SharePoint, S3, or Postgres.
 * - Do not use when the goal is to answer a user’s research query directly; use the planning, retrieval, or final synthesis flows instead.
 * - Do not use when Google Drive credentials have not been configured, because the trigger cannot access the Drive API without them.
 * - Do not use when no target `vectorDB` has been provisioned or selected.
 * - Do not use when you need ad hoc web information rather than internal indexed content; the web-search branch of the kit is the correct path.
 * - Do not use when the input is an arbitrary file payload or free-form text rather than a Drive folder reference.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | Google Drive authentication credentials used by the trigger to access the Google Drive API. |
 * | `folderUrl` | `resourceLocator` | Yes | The Google Drive folder to ingest. Can be supplied either by selecting from a list of accessible folders or by providing a folder URL. |
 * | `mapping.source` | `string` | Yes | A variable-mapped source value carried through metadata generation. In this flow it represents the source location associated with indexed records. |
 * | `embeddingModelName` | `model` | Yes | The text embedding model used to convert extracted chunk text into vector representations. |
 * | `vectorDB` | `select` | Yes | The destination vector database where vectors and metadata will be indexed. |
 *
 * Below the table, notable constraints and assumptions apply:
 *
 * - `folderUrl` must point to a valid Google Drive folder that the selected `credentials` can access.
 * - `folderUrl` supports two modes: selecting from discovered folders or manually providing a URL.
 * - The flow assumes the Drive connector can produce textual document content in `triggerNode_1.output.content` and a document identifier in `triggerNode_1.output.document_key`.
 * - `embeddingModelName` must be an embedding-capable model of type `embedder/text`.
 * - `mapping.source` is exposed as a variable input, but the current node configuration also contains a fixed default source URL. Operators should ensure this value matches the actual folder or intended canonical source reference.
 * - No explicit maximum input length is declared here, but effective limits will depend on connector extraction limits, chunking behavior, embedding model constraints, and vector database payload limits.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | The vector representations generated from extracted text chunks and prepared for indexing. |
 * | `metadata` | `array` | The metadata records aligned to the generated vectors, including document identity and source information transformed by the metadata script. |
 *
 * The flow’s effective output is a successful indexing operation into the configured vector database rather than a rich end-user response payload. Internally, the last transformation step produces a structured object with `vectors` and `metadata`, and the index node consumes those fields to write records. In practice, callers should treat this flow as an ingestion job: success means the records were written or updated in the vector store, while completeness depends on what the Google Drive connector extracted and what duplicate records were overwritten.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone ingestion and trigger-based entry flow. No upstream Lamatic flow must run before it.
 *
 * Operational prerequisites still exist:
 *
 * - A Google Drive credential must already be configured in Lamatic and selected as `credentials`.
 * - A vector database connection must already exist and be selectable as `vectorDB`.
 * - An embedding model must already be available for `embeddingModelName`.
 *
 * ### Downstream Flows
 * This flow primarily feeds downstream retrieval flows indirectly through the vector database it populates.
 *
 * - Internal data source retrieval flows in the Deep Research kit depend on the indexed records created here.
 * - Those downstream retrieval flows consume the indexed vector entries and associated metadata, rather than calling this flow’s node outputs directly.
 * - The most important fields this flow contributes to downstream use are the stored embeddings and metadata derived from `codeNode_560.output.vectors` and `codeNode_560.output.metadata`.
 *
 * ### External Services
 * - Google Drive API — used to enumerate and ingest documents from the selected Drive folder — requires a configured Google Drive `credentials` input.
 * - Embedding model provider — used to transform chunk text into vector embeddings — requires the selected `embeddingModelName` model configuration.
 * - Vector database — used to persist embeddings and metadata for later retrieval — requires the selected `vectorDB` connection.
 * - Referenced script `@scripts/gdrive_extract-chunked-text.ts` — used to extract the chunk text payload that will be embedded — no separate credential declared in the flow itself.
 * - Referenced script `@scripts/gdrive_transform-metadata.ts` — used to align vectors with metadata before indexing — no separate credential declared in the flow itself.
 * - `webhook.site` URL configured on the index node — present as `webhookURL` in the node configuration, likely for operational callback or testing purposes — no additional credential shown here.
 *
 * ### Environment Variables
 * No flow-specific environment variables are declared in this flow definition.
 *
 * At the kit level, Lamatic deployment credentials and project configuration are required for invoking flows in the broader system, but no node in this flow directly references a named environment variable such as `LAMATIC_API_KEY` or `LAMATIC_PROJECT_ID`.
 *
 * ## Node Walkthrough
 * 1. `Google Drive` (`triggerNode`)
 *    - This is the entry point for the flow. It connects to Google Drive using the selected `credentials`, targets the chosen `folderUrl`, and runs with `syncMode` set to `incremental_append`.
 *    - The trigger is scheduled with the cron expression `0 0 00 ? * 1 * UTC`, which corresponds to a weekly run on Mondays at 00:00 UTC.
 *    - It emits document-level fields used later in the flow, including extracted file `content` and a `document_key` used as the record title.
 *
 * 2. `Variables` (`variablesNode`)
 *    - This node prepares simple mapped variables used by downstream scripts.
 *    - It sets `title` from `{{triggerNode_1.output.document_key}}`, so each indexed record inherits the Drive document key as its title.
 *    - It also sets `source` as a string value. The flow exposes `mapping.source` as an input, but the saved configuration currently contains a concrete Drive folder URL as the default mapped source.
 *
 * 3. `chunking` (`chunkNode`)
 *    - This node splits `{{triggerNode_1.output.content}}` into smaller text segments suitable for embedding and retrieval.
 *    - It uses recursive character splitting with `numOfChars` set to `500`, `overlapChars` set to `50`, and separators of paragraph break, newline, and space.
 *    - The chunking strategy is tuned for retrieval quality by preserving some context overlap between neighboring chunks.
 *
 * 4. `Extract Chunked Text` (`codeNode`)
 *    - This custom script step reads the chunking output and extracts the exact text payload that should be embedded.
 *    - Its purpose is to normalize or flatten the chunk structure into the input shape expected by the embedding node.
 *    - The next node consumes this step’s entire output as `inputText`.
 *
 * 5. `Get Vectors` (`vectorizeNode`)
 *    - This node generates embeddings from `{{codeNode_539.output}}` using the selected `embeddingModelName`.
 *    - It converts each extracted chunk into a vector representation suitable for similarity search in the target vector database.
 *    - The resulting embeddings are then passed forward for packaging with metadata.
 *
 * 6. `Transform Metadata` (`codeNode`)
 *    - This custom script combines the generated embeddings with document metadata so they can be indexed together.
 *    - It produces a structured object with at least two fields: `vectors` and `metadata`.
 *    - This is the key shaping step that aligns each vector with record-level metadata such as title and source before persistence.
 *
 * 7. `Index to DB` (`IndexNode`)
 *    - This node writes the prepared `vectors` and `metadata` into the selected `vectorDB`.
 *    - It uses `title` as the `primaryKeys` value for duplicate detection.
 *    - Duplicate handling is set to `overwrite`, so if a record with the same `title` already exists, the existing indexed record is replaced.
 *
 * 8. `addNode` (`addNode`)
 *    - This is only a canvas placeholder indicating a possible extension point in the visual flow.
 *    - It does not contribute operational behavior to the current execution path.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at the trigger before any documents are processed | Missing, expired, or misconfigured Google Drive `credentials` | Re-authenticate the Google Drive credential in Lamatic, confirm API access, and ensure the selected account can access the target folder. |
 * | Flow runs but ingests no documents | `folderUrl` is wrong, inaccessible, empty, or the incremental sync found nothing new | Verify the folder URL or folder selection, confirm the account has access, and check whether there are actually new or changed files since the last run. |
 * | Trigger returns metadata but no usable text content | The connector could not extract text from one or more files, or the files are unsupported/binary-only | Confirm file types are supported for text extraction and add preprocessing or alternate ingestion for unsupported formats. |
 * | Chunking produces empty or trivial chunks | `triggerNode_1.output.content` is empty or malformed | Inspect the upstream Drive extraction output and validate that the source files contain extractable text. |
 * | Embedding step fails | `embeddingModelName` is not configured, unavailable, or incompatible with the payload size | Select a valid text embedding model, confirm provider access, and reduce document size if provider limits are being exceeded. |
 * | Indexing step fails before persistence | `vectorDB` is not selected, misconfigured, unavailable, or rejects the payload schema | Verify the vector database connection, ensure the index exists if required, and confirm it accepts the vectors and metadata shape produced by the transform script. |
 * | Existing records are unexpectedly replaced | Duplicate key collisions on `title` with `duplicateOperation` set to `overwrite` | Use a more stable unique key if document titles are not unique, or adjust duplicate handling semantics in the flow configuration. |
 * | Indexed records have incorrect source links | `mapping.source` is set to a stale hard-coded URL rather than the intended folder reference | Update the variable mapping so `source` reflects the actual source folder or dynamic document source you want stored in metadata. |
 * | Downstream internal retrieval finds nothing after indexing | This flow did not run successfully, indexed the wrong folder, or wrote into the wrong `vectorDB` | Confirm this flow completed successfully, verify the selected folder and database, and ensure downstream retrieval is pointed at the same vector store. |
 * | Scheduled updates do not occur | The deployed trigger schedule is not active or the flow was not deployed after configuration changes | Check the deployment state in Lamatic, confirm the cron schedule is enabled, and redeploy the flow if needed. |
 *
 * ## Notes
 * - The flow name in metadata is `GDrive ` with a trailing space, but the operational intent is clearly Google Drive indexation. Prefer the normalized display name `GDrive` in documentation and orchestration references.
 * - The trigger is configured for `incremental_append`, so operators should expect append-style synchronization behavior between runs rather than a full destructive rebuild.
 * - Chunk size is `500` characters with `50` characters of overlap. This is a reasonable general-purpose retrieval setting, but it may need tuning for highly structured documents or very long-form narrative content.
 * - The index node uses `title` as the sole primary key. If `document_key` is not globally unique across the corpus, collisions may cause unintended overwrites.
 * - Two custom scripts are central to correctness: one for extracting chunked text and one for transforming metadata. Any change in their output shape can break the embedding or indexing steps.
 * - A `webhookURL` is configured on the indexing node, but the flow definition does not explain its production purpose. Treat it as implementation detail unless your deployment explicitly relies on it.
 */

// Flow: gdrive

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
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "gdrive_extract_chunked_text": "@scripts/gdrive_extract-chunked-text.ts",
    "gdrive_transform_metadata": "@scripts/gdrive_transform-metadata.ts"
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
