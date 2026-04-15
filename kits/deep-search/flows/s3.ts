/*
 * # S3
 * A flow that incrementally ingests files from an Amazon S3 bucket, converts them into vectorized chunks with metadata, and stores them in a vector database for downstream internal retrieval in the wider Deep Research system.
 *
 * ## Purpose
 * This flow is responsible for turning raw documents stored in Amazon S3 into searchable vector index entries. It solves the ingestion side of the internal knowledge pipeline: detecting bucket content through the S3 trigger, extracting file text, chunking that text into retrieval-friendly segments, embedding those segments with an embedding model, and indexing both vectors and metadata into a selected vector database.
 *
 * The outcome is a persistent internal knowledge index keyed by document identity and enriched with source metadata. That matters because the broader agent pipeline depends on searchable enterprise content when answering research questions grounded in an organization’s own files. Without this flow, S3-hosted documents remain opaque blobs rather than retrievable evidence.
 *
 * Within the larger Deep Research architecture, this flow sits before retrieval and synthesis. It is not part of the end-user question-answering path directly; instead, it prepares one internal data source so that later retrieval flows can search indexed content during the plan-retrieve-synthesize cycle. Operators typically run it on a schedule or when onboarding new S3 content, and downstream reasoning flows benefit from the resulting vectorized corpus.
 *
 * ## When To Use
 * - Use when documents stored in an Amazon S3 bucket need to become searchable through vector retrieval.
 * - Use when onboarding a new S3-backed internal knowledge source into the Deep Research system.
 * - Use when the S3 bucket changes over time and incremental append synchronization is desired rather than a one-time static import.
 * - Use when downstream retrieval flows are expected to answer user questions from organization-owned documents that live in S3.
 * - Use when you need chunk-level embeddings plus metadata records in a configured vector database.
 *
 * ## When Not To Use
 * - Do not use when the source content lives in a different system such as Google Drive, OneDrive, SharePoint, or Postgres; use the matching indexation flow for that connector instead.
 * - Do not use when the goal is to answer a user query directly; reasoning and answer synthesis belong to downstream research flows, not this ingestion flow.
 * - Do not use when S3 credentials or bucket access have not been configured; the trigger cannot enumerate or read documents without them.
 * - Do not use when no vector database has been selected or provisioned; the flow can generate embeddings but cannot persist them without the `vectorDB` input.
 * - Do not use for non-file or unsupported object content that cannot be meaningfully parsed into text.
 * - Do not use when you need ad hoc one-document extraction output returned to a caller; this flow is designed for indexation, not document preview or direct API response payloads.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | S3 authentication credentials used by the trigger to access Amazon S3. |
 * | `bucket` | `select` | Yes | The S3 bucket to sync and ingest documents from. |
 * | `mapping` | `variablesInput` | Yes | Metadata mapping used to populate flow-level variables, specifically `title` and `source`. |
 * | `embeddingModelName` | `model` | Yes | The embedding model used to convert chunk text into vectors. |
 * | `vectorDB` | `select` | Yes | The target vector database where vectors and metadata will be indexed. |
 *
 * Below the table, several constraints are implicit in the flow configuration. The `bucket` field is loaded dynamically from the selected S3 credentials, so valid values depend on accessible buckets. The `mapping` input must provide values for `title` and `source`; by default, `title` is derived from `{{triggerNode_1.output.document_key}}` and `source` is the literal `AWS S3 Bucket`. The embedding model must be compatible with `embedder/text`. The flow assumes the trigger yields file objects with a readable `document_url` and `document_key`, and it assumes bucket contents can be parsed into extractable text by the file extraction stage.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `title` | `string` | The primary document identifier used for indexing, typically the S3 object key. |
 * | `source` | `string` | Source label attached to metadata, defaulting to `AWS S3 Bucket`. |
 * | `metadata` | `array<object>` | Transformed metadata records aligned to the generated chunks. |
 * | `vectors` | `array<number[]>` | Embedding vectors generated from chunk text. |
 * | `indexResult` | `object` | The resulting write operation into the selected vector database. Exact shape depends on the database connector. |
 *
 * The flow’s effective output is an indexing side effect rather than a rich end-user response payload. In plain English, it reads files, breaks them into chunks, creates embeddings, pairs them with metadata, and writes them into the vector store. Any returned result is typically operational in nature, such as write status or record counts, and may vary based on the backing vector database implementation.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This flow has no required upstream Lamatic flow dependency. It is an ingestion entry point for S3 content.
 * - Its practical prerequisites are infrastructure rather than upstream flow outputs: valid S3 credentials, access to the chosen bucket, a configured embedding model, and a provisioned vector database.
 * - In the broader kit context, it exists to prepare internal content before retrieval-oriented reasoning flows run. Those downstream flows depend on the indexed data created here, but they do not invoke this flow inline during a user query.
 *
 * ### Downstream Flows
 * - Internal data-source retrieval flows in the Deep Research kit consume the vector index produced by this flow.
 * - Those downstream retrieval steps depend on the indexed vectors and metadata written by `Index`, especially the chunk embeddings in `vectors`, the transformed metadata in `metadata`, and the primary key represented by `title`.
 * - Final synthesis flows do not consume this flow directly; they rely indirectly on retrieval outputs that are only possible once this flow has populated the vector store.
 *
 * ### External Services
 * - Amazon S3 — source system for file discovery and document access — requires selected S3 `credentials` on `triggerNode_1`.
 * - Embedding model provider — converts chunk text into embeddings — requires the selected `embeddingModelName` on `vectorizeNode_639`.
 * - Vector database — stores vectors and metadata for later retrieval — requires the selected `vectorDB` on `IndexNode_622`.
 * - Lamatic file extraction capability — parses the S3 file at `document_url` into text or structured content — used by `extractFromFileNode_944`.
 * - Lamatic script runtime — executes custom transformation logic for text extraction, chunk shaping, and metadata transformation — used by `codeNode_315`, `codeNode_254`, and `codeNode_507`.
 *
 * ### Environment Variables
 * - No flow-specific environment variables are declared in the flow source.
 * - Platform-level Lamatic credentials and connector configuration may still be required by the deployment environment, but they are not referenced by name inside this flow’s node definitions.
 *
 * ## Node Walkthrough
 * 1. `S3` (`triggerNode`) starts the flow by connecting to Amazon S3 with the selected `credentials`, watching the chosen `bucket`, and emitting file records using an automatic strategy with `incremental_append` sync behavior. It is configured to consider all object paths through the glob `**` and to run on the defined daily cron schedule.
 * 2. `Variables` (`dynamicNode`) creates normalized metadata variables for the rest of the flow. In this configuration, it maps `title` to `{{triggerNode_1.output.document_key}}`, making the S3 object key the document identity, and sets `source` to the constant `AWS S3 Bucket`.
 * 3. `Extract from File` (`dynamicNode`) reads the file located at `{{triggerNode_1.output.document_url}}` and extracts its textual content. The node is set to auto-detect format, join pages where relevant, preserve whitespace trimming defaults, and avoid returning raw text blobs in base64 form.
 * 4. `Extract Text` (`dynamicNode`) runs the script `@scripts/s3_extract-text.ts` to normalize the extraction result into the text payload expected by downstream chunking. This step exists because the file extraction node can produce format-dependent structures, and the script consolidates them into usable text.
 * 5. `Chunking` (`dynamicNode`) splits the extracted text into retrieval-sized segments using a recursive character text splitter. It targets 500-character chunks with 50 characters of overlap and prefers to split on paragraph breaks, then line breaks, then spaces.
 * 6. `Get Chunks` (`dynamicNode`) runs the script `@scripts/s3_get-chunks.ts` to transform the chunking node’s output into the exact chunk list expected by the embedding stage. This is where chunk objects are typically flattened or reshaped into plain text entries.
 * 7. `Vectorize` (`dynamicNode`) sends the prepared chunk texts from `{{codeNode_254.output}}` to the selected embedding model and produces vector embeddings. Its output includes `vectors`, which are later written to the vector database.
 * 8. `Transform Metadata` (`dynamicNode`) runs the script `@scripts/s3_transform-metadata.ts` to build per-chunk metadata records that align with the generated embeddings. This step typically combines variable values such as `title` and `source` with chunk-level context so the index can support traceable retrieval.
 * 9. `Index` (`dynamicNode`) writes the embeddings from `{{vectorizeNode_639.output.vectors}}` and metadata from `{{codeNode_507.output.metadata}}` into the selected `vectorDB`. It treats `title` as the primary key and uses `overwrite` as the duplicate handling strategy, so repeated ingestion for the same title replaces prior indexed records.
 * 10. `addNode` (`addNode`) is the terminal placeholder after indexing. It does not introduce additional business logic in the provided configuration; it marks the end of the flow graph after the index write completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at startup or cannot list buckets | Missing or invalid `credentials` for S3 | Reconfigure the S3 credential selection with valid AWS access and confirm the account can list and read the target bucket. |
 * | Trigger runs but no files are processed | Incorrect `bucket`, no matching objects, or no newly detected objects under incremental sync | Verify the selected bucket contains files, confirm object visibility under the configured credentials, and check whether incremental append has already consumed existing history. |
 * | File extraction returns empty or unusable text | Unsupported file format, inaccessible `document_url`, encrypted file, or parser limitations | Confirm the object is a supported document type, ensure the file is readable without an unresolved password, and test extraction on a known-good file. |
 * | Chunking produces no chunks | Upstream extraction script returned empty text | Inspect the output of `Extract from File` and `Extract Text`, then adjust source files or script logic so meaningful text is emitted. |
 * | Embedding step fails | `embeddingModelName` is not configured, unavailable, or incompatible | Select a valid `embedder/text` model and confirm provider access in the Lamatic project. |
 * | Index write fails | Missing `vectorDB` selection, unreachable vector store, or schema mismatch between vectors and metadata | Select a valid vector database, verify connector health, and ensure metadata transformation returns records aligned with the chunk/vector count. |
 * | Records appear duplicated or unexpectedly replaced | `duplicateOperation` is set to `overwrite` with `title` as the primary key | If versioned coexistence is needed, change key strategy or duplicate handling so distinct documents or revisions do not share the same primary key. |
 * | Retrieval flows cannot find S3 content after ingestion | This flow did not run successfully, indexed the wrong bucket, or wrote to the wrong vector database | Confirm a successful index operation, validate `title` and metadata values, and ensure downstream retrieval flows query the same vector store populated here. |
 * | Metadata is missing expected document identity | `mapping` was altered incorrectly or `document_key` was unavailable from the trigger output | Restore the `title` mapping to a valid trigger field and verify the S3 trigger emits `document_key` for each object. |
 *
 * ## Notes
 * - The trigger is configured for `incremental_append`, which favors ongoing ingestion of new or changed content rather than full historical reprocessing on every run.
 * - The default primary key is `title`, sourced from the S3 object key. This is simple and effective, but it also means object-key reuse can overwrite prior indexed content.
 * - Chunk size and overlap are fixed in the current configuration at 500 and 50 characters. These values are reasonable for general retrieval but may need tuning for very dense technical documents or very short files.
 * - Three custom scripts are central to correctness: `s3_extract-text`, `s3_get-chunks`, and `s3_transform-metadata`. If ingestion quality is poor, those scripts are the first place to inspect.
 * - Although the README focuses on user-facing reasoning flows, this flow supports that experience indirectly by building the internal knowledge base those flows search against.
 */

// Flow: s3

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "S3",
  "description": "S3 Indexation",
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
      "description": "Select the credentials for S3 authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "bucket",
      "type": "select",
      "label": "Bucket",
      "required": true,
      "isPrivate": true,
      "description": "Name of the S3 bucket where the file(s) exist.",
      "typeOptions": {
        "loadOptionsMethod": "getBuckets"
      },
      "defaultValue": "",
      "isAirbyteStream": true,
      "airbyteInputName": "source/configuration.bucket"
    }
  ],
  "variablesNode_954": [
    {
      "keys": [
        "title",
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
    "s3_extract_text": "@scripts/s3_extract-text.ts",
    "s3_get_chunks": "@scripts/s3_get-chunks.ts",
    "s3_transform_metadata": "@scripts/s3_transform-metadata.ts"
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
      "nodeId": "s3Node",
      "trigger": true,
      "values": {
        "nodeName": "S3",
        "globs": [
          "**"
        ],
        "strategy": "auto",
        "syncMode": "incremental_append",
        "start_date": "",
        "cronExpression": "0 0 00 1/1 * ? * UTC",
        "days_to_sync_if_history_is_full": "3"
      }
    }
  },
  {
    "id": "addNode_290",
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
    "id": "extractFromFileNode_944",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "nodeName": "Extract from File",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "auto",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.document_url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    }
  },
  {
    "id": "codeNode_315",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Extract Text",
        "code": "@scripts/s3_extract-text.ts"
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
        "chunkField": "{{codeNode_315.output}}",
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
        "code": "@scripts/s3_get-chunks.ts"
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
        "code": "@scripts/s3_transform-metadata.ts"
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
          "title"
        ],
        "vectorsField": "{{vectorizeNode_639.output.vectors}}",
        "metadataField": "{{codeNode_507.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "variablesNode_954",
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
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.document_key}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"AWS S3 Bucket\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "IndexNode_622-addNode_290",
    "source": "IndexNode_622",
    "target": "addNode_290",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "variablesNode_954-extractFromFileNode_944",
    "source": "variablesNode_954",
    "target": "extractFromFileNode_944",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_944-codeNode_315",
    "source": "extractFromFileNode_944",
    "target": "codeNode_315",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_315-chunkNode_318",
    "source": "codeNode_315",
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
    "id": "triggerNode_1-variablesNode_954",
    "source": "triggerNode_1",
    "target": "variablesNode_954",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
