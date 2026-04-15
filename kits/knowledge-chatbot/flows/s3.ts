/*
 * # S3
 * A flow that ingests documents from an Amazon S3 bucket, converts them into vector embeddings, and writes them into the shared knowledge index used by the wider RAG system.
 *
 * ## Purpose
 * This flow is responsible for the S3-specific ingestion and indexation part of the knowledge pipeline. Its job is to connect to a configured Amazon S3 bucket, detect files, extract readable text from each file, split that text into retrieval-friendly chunks, generate embeddings for those chunks, and store both vectors and metadata in a configured vector database. It solves the document preparation problem for content that lives in object storage rather than in databases, web pages, or office-suite connectors.
 *
 * The outcome of a successful run is an indexed corpus derived from S3 objects, keyed by file path and enriched with source metadata. That outcome matters because the downstream question-answering flow depends on a populated vector store to retrieve relevant context at query time. Without this ingestion step, documents in S3 remain opaque to the retrieval layer and cannot contribute grounded evidence to answers.
 *
 * In the broader agent architecture, this flow sits squarely in the ingestion side of the retrieve-and-synthesize chain described by the parent `RAG` agent. It is one of several sibling indexation flows that normalize different source systems into a common vector representation. It does not answer user questions directly; instead, it prepares knowledge so the `Knowledge Chatbot` flow can later retrieve semantically relevant chunks and generate grounded responses.
 *
 * ## When To Use
 * - Use when the source material you want in the knowledge base is stored as files in an Amazon S3 bucket.
 * - Use when you are setting up or refreshing the retrieval corpus for the broader RAG system.
 * - Use when incremental sync from S3 is desired rather than a one-off manual file upload.
 * - Use when documents need to be chunked and embedded into a shared vector database for semantic search.
 * - Use when the downstream `Knowledge Chatbot` or another retrieval flow should be able to answer questions based on S3-hosted content.
 * - Use when S3 credentials and a target vector database have already been configured in Lamatic.
 *
 * ## When Not To Use
 * - Do not use when the content source is not S3; use the sibling indexation flow that matches the source system such as Google Drive, SharePoint, OneDrive, Postgres, web crawling, or another supported connector.
 * - Do not use when no vector database has been selected, because the flow has no place to persist embeddings.
 * - Do not use when valid S3 credentials or bucket access are unavailable.
 * - Do not use when you need direct question answering or retrieval; this flow only prepares indexed knowledge and does not synthesize answers.
 * - Do not use when the source data is already pre-chunked and embedded elsewhere and only needs querying.
 * - Do not use when the required input is a live API payload from an upstream application; this flow is a source-triggered ingestion flow, not an API-facing chat or orchestration endpoint.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | S3 authentication credentials used by the trigger to access Amazon S3. |
 * | `bucket` | `select` | Yes | Name of the S3 bucket to sync and ingest files from. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used to define metadata values for `title` and `source`. |
 * | `embeddingModelName` | `model` | Yes | Embedding model used to convert chunk text into vector representations. |
 * | `vectorDB` | `select` | Yes | Target vector database where vectors and metadata are indexed. |
 *
 * Below the table, the main constraints are operational rather than schema-heavy. The `bucket` value must refer to a bucket accessible through the selected `credentials`. The `mapping` input must provide values for both `title` and `source`; in the shipped configuration, `title` is derived from `{{triggerNode_1.output.document_key}}` and `source` is the constant string `AWS S3 Bucket`. The embedding model must be compatible with `embedder/text`, and the vector database must support the index operation used by the `Index` node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Vector embeddings generated from the chunked document text and passed into indexing. |
 * | `metadata` | `array` | Metadata records produced for the indexed chunks, including at least the mapped `title` and `source`. |
 * | `indexResult` | `object` | The effective result of the final index operation written to the configured vector database. |
 *
 * Below the table, this flow behaves like an ingestion pipeline rather than a user-facing response formatter. Its effective output is a structured indexing result produced by the final `Index` node after vectors and metadata have been assembled. The exact response envelope depends on the runtime and connector implementation, but conceptually it represents one or more S3 files having been processed into chunk-level vector records. Completeness depends on what the S3 trigger discovers and what the extraction script can successfully parse from each file.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is an entry-point ingestion flow. No upstream Lamatic flow must run before it.
 * - The only prerequisites are source-side and configuration-side: an accessible S3 bucket, valid `credentials`, a selected `embeddingModelName`, and a selected `vectorDB`.
 * - Within the broader RAG system, it contributes content to the shared retrieval corpus but does not consume outputs from another flow.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` — consumes the indexed vector corpus produced by this flow through the shared vector database, using the stored vectors and metadata for semantic retrieval.
 * - Any other retrieval or orchestration flow built on the same knowledge base — consumes the indexed records indirectly via the configured vector store rather than via a direct field-to-field API handoff.
 * - No downstream flow is wired directly in this flow definition; the dependency is through persistent storage in the vector database.
 *
 * ### External Services
 * - Amazon S3 — source file discovery and access for ingestion — required credential: selected `credentials` input on `triggerNode_1`
 * - Embedding model provider — converts chunk text into embeddings — required credential or model access: selected `embeddingModelName` on `vectorizeNode_639`
 * - Vector database — stores vectors and metadata for retrieval — required credential/configuration: selected `vectorDB` input on `IndexNode_622`
 * - Lamatic file extraction capability — parses file contents from the S3-provided `document_url` — no separate flow-level credential shown beyond S3 access
 * - Custom Lamatic scripts — transforms extracted text, chunk lists, and metadata via `s3_extract_text`, `s3_get_chunks`, and `s3_transform_metadata` — no separate credential shown in the flow definition
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow definition.
 * - If the selected embedding model, vector database, or S3 credential binding relies on workspace-level secrets, those are configured outside this flow and are not named in the exported source.
 *
 * ## Node Walkthrough
 * 1. `S3` (`triggerNode`) starts the flow by connecting to Amazon S3 and discovering files in the configured `bucket` using the selected `credentials`. It is configured with glob `**`, so it can consider all files in the bucket, and it uses `incremental_append` sync mode with automatic strategy selection and a scheduled cron expression for recurring sync.
 *
 * 2. `Variables` (`dynamicNode`) creates normalized metadata variables for downstream indexing. In the default mapping, it sets `title` from `{{triggerNode_1.output.document_key}}`, which is effectively the S3 object key or path, and sets `source` to `AWS S3 Bucket`.
 *
 * 3. `Extract from File` (`dynamicNode`) reads the file located at `{{triggerNode_1.output.document_url}}` and attempts format-aware extraction. It is configured with `format` set to `auto`, page joining enabled, headers enabled for tabular formats, and `returnRawText` disabled, so it aims to produce parsed content rather than a raw binary or base64 payload.
 *
 * 4. `Extract Text` (`dynamicNode`) runs the custom script `@scripts/s3_extract-text.ts` against the extracted file output. This script is responsible for normalizing the extractor output into the text representation that should be chunked. It exists because different file formats often yield different extraction shapes, and the flow needs a consistent text payload for the next stage.
 *
 * 5. `Chunking` (`dynamicNode`) splits the normalized text from `{{codeNode_315.output}}` into overlapping chunks suitable for embedding and retrieval. It uses the `recursiveCharacterTextSplitter` strategy with `500` characters per chunk, `50` characters of overlap, and separator preference order of paragraph break, newline, then space.
 *
 * 6. `Get Chunks` (`dynamicNode`) runs the custom script `@scripts/s3_get-chunks.ts` to transform the chunking output into the exact text list expected by the embedding node. This step likely flattens or selects the chunk payload from the chunker’s richer output structure.
 *
 * 7. `Vectorize` (`dynamicNode`) sends the chunk text from `{{codeNode_254.output}}` to the selected embedding model and generates vector representations. Its output includes `vectors`, which are then passed directly into the indexing step.
 *
 * 8. `Transform Metadata` (`dynamicNode`) runs the custom script `@scripts/s3_transform-metadata.ts` after vectorization to produce the metadata array aligned to the generated chunk vectors. This step uses the established variables such as `title` and `source` and likely expands them to the per-chunk metadata shape required by the vector store.
 *
 * 9. `Index` (`dynamicNode`) writes the vectors from `{{vectorizeNode_639.output.vectors}}` and metadata from `{{codeNode_507.output.metadata}}` into the selected vector database. It uses `title` as the primary key and is configured with `duplicateOperation` set to `overwrite`, so re-indexing the same title replaces existing records rather than creating duplicates.
 *
 * 10. The terminal `addNode` is simply the flow endpoint after indexing. It does not add business logic in the exported definition; it marks the end of execution after the index operation completes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at startup or cannot list files | Missing or invalid S3 `credentials`, or the selected credentials do not have access to the `bucket` | Reconfigure the `credentials` input, verify IAM permissions for bucket listing and object read, and confirm the correct bucket was selected |
 * | Flow runs but no documents are indexed | The bucket is empty, the sync found no new files, or discovered files do not match expected readable formats | Confirm files exist in the selected bucket, check whether incremental sync is suppressing already-seen objects, and test with a known supported document type |
 * | Extraction step returns empty or unusable text | The file format is unsupported, encrypted, malformed, or not correctly parsed by `Extract from File` or `s3_extract_text` | Validate the source file format, remove password protection where applicable, inspect extraction behavior with a sample file, and update the extraction script if custom parsing is required |
 * | Chunking produces poor retrieval quality | Source text is too noisy, too short, or chunk settings are not appropriate for the document structure | Adjust preprocessing in `s3_extract_text`, or tune chunk size and overlap to better fit the document types being indexed |
 * | Vectorization fails | No `embeddingModelName` was configured, the selected model is unavailable, or model access permissions are missing | Select a valid embedding model compatible with `embedder/text` and verify workspace/model provider access |
 * | Indexing fails | No `vectorDB` is configured, the vector database connection is invalid, or metadata/vector dimensions do not match store expectations | Select a valid vector database, verify its credentials and schema, and ensure the embedding output and metadata transformation match the store’s requirements |
 * | Re-indexing overwrites prior content unexpectedly | `duplicateOperation` is set to `overwrite` and `title` is used as the primary key | Change the primary key strategy or metadata mapping if multiple distinct records share the same S3 object key and should coexist |
 * | Downstream chatbot cannot answer from newly added S3 documents | This flow has not run successfully, indexing failed silently, or the chatbot is pointed at a different vector store/index | Verify this flow completed through the `Index` node, confirm records exist in the selected vector database, and ensure the retrieval flow uses the same index configuration |
 * | Metadata appears incomplete or wrong | The `mapping` input was changed incorrectly or the transform script does not align metadata with chunks | Revisit the `mapping` values for `title` and `source`, and validate the logic in `s3_transform_metadata.ts` against the expected per-chunk schema |
 *
 * ## Notes
 * - The trigger is scheduled with cron expression `0 0 00 1/1 * ? * UTC`, indicating a daily recurring sync cadence in UTC unless reconfigured.
 * - The flow uses `incremental_append` sync mode, which is appropriate for ongoing ingestion but means operators should understand how the connector determines new or changed files.
 * - The default primary key is `title`, which is mapped from the S3 object key. This is convenient for idempotent updates, but it also means key collisions are possible if separate logical documents share the same object key across environments or prefixes.
 * - Retrieval quality depends heavily on the custom scripts. The flow’s core behavior is not just connector-driven; `s3_extract_text`, `s3_get_chunks`, and `s3_transform_metadata` are critical shaping layers and should be reviewed when troubleshooting data quality.
 * - Because globbing is set to `**`, the flow is broad by default and may ingest all reachable files in the selected bucket. Narrower scoping, if needed, would require trigger reconfiguration rather than downstream filtering.
 * - The exported flow does not expose explicit response fields for external API consumers because its primary contract is side-effectful: it populates the vector index used by retrieval flows.
 */

// Flow: s3
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

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
