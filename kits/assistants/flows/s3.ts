/*
 * # S3
 * Indexes documents from an Amazon S3 bucket into a vector database so they can be retrieved later by the broader Internal Assistant RAG system.
 *
 * ## Purpose
 * This flow is responsible for ingesting file-based knowledge that already exists in Amazon S3 and turning it into searchable vector records. It solves the specific sub-task of connecting to a configured bucket, discovering files through the S3 trigger connector, extracting text from each document, splitting that text into retrieval-friendly chunks, generating embeddings, and writing the resulting vectors plus metadata into the selected vector store.
 *
 * The outcome is a persistent, queryable index of S3-hosted content. That matters because the assistant flows in this kit depend on a populated vector database to retrieve relevant chunks at question time. Without this ingestion step, the downstream assistants would have no S3-backed knowledge to ground their answers in.
 *
 * Within the wider agent architecture, this is an indexation flow rather than a conversational or synthesis flow. In the plan-retrieve-synthesize chain, it sits entirely on the ingestion side: it prepares knowledge before user queries arrive. The parent agent uses one or more indexation flows like this to build the shared knowledge base, and assistant flows for web chat, Slack, or Teams later perform retrieval over the vectors created here.
 *
 * ## When To Use
 * - Use when the documents you want the assistant to know about are stored in an Amazon S3 bucket.
 * - Use when you need to build or refresh vector embeddings for S3-hosted files so downstream RAG assistants can answer from them.
 * - Use when incremental syncing from S3 is desired rather than manually uploading files one by one.
 * - Use when you have valid S3 credentials, a target bucket, an embedding model, and a vector database already configured in Lamatic.
 * - Use when the source material is primarily document-like content that can be parsed into text by the file extraction step.
 *
 * ## When Not To Use
 * - Do not use when the source content lives in another system such as Google Drive, SharePoint, OneDrive, Postgres, or a website; use the corresponding sibling indexation flow instead.
 * - Do not use when no vector database has been selected or provisioned, because the flow’s final indexing step requires one.
 * - Do not use when S3 credentials or bucket access are missing, invalid, or do not include permission to list and read objects.
 * - Do not use when the files are not suitable for text extraction or are encrypted in a way the extractor cannot open.
 * - Do not use when you are trying to answer a user question directly; this flow prepares knowledge and does not generate end-user responses.
 * - Do not use when you need ad hoc retrieval over already-indexed content; an assistant flow is the correct runtime entry point for that.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | S3 authentication credentials used by the trigger connector to access Amazon S3. |
 * | `bucket` | `select` | Yes | Name of the S3 bucket to sync and ingest documents from. |
 * | `mapping` | `variablesInput` | Yes | Variable mapping used to derive metadata fields, specifically `title` and `source`, for downstream indexing. |
 * | `embeddingModelName` | `model` | Yes | Embedding model used to convert chunk text into vectors. Must be an `embedder/text` model. |
 * | `vectorDB` | `select` | Yes | Target vector database where embeddings and metadata will be indexed. |
 *
 * The flow assumes the selected S3 bucket contains files that the extraction pipeline can read and convert into text. The `mapping` input is preconfigured to set `title` from `{{triggerNode_1.output.document_key}}` and `source` to `AWS S3 Bucket`, but operators can remap these values if needed. The embedding model must be compatible with text embedding, and the vector database must support the indexing schema expected by the `Index` node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `vectors` | `array` | Vector embeddings generated from the document chunks and passed into the indexing step. |
 * | `metadata` | `array` | Chunk-level or document-level metadata prepared for each indexed record, including at minimum the mapped `title` and `source`. |
 * | `indexResult` | `object` | The effective result of the `Index` operation that writes or overwrites records in the configured vector database. |
 *
 * The practical output of this flow is an indexing side effect more than a rich API payload: documents are transformed into vector records stored in the configured vector database. Internally, the flow produces chunk text, embeddings, and metadata objects, then writes them to the index using `title` as the primary key with overwrite semantics for duplicates. Depending on runtime and connector behavior, the externally visible response may be minimal even when indexing succeeds.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone ingestion entry-point flow.
 * - In the broader kit, it is one of several alternative indexation flows that can be run to populate the shared vector store used by assistant flows.
 *
 * ### Downstream Flows
 * - Assistant flows in the parent Internal Assistant kit consume the vector records created here during retrieval.
 * - Those downstream flows depend on the vector store being populated with embeddings and metadata generated by this flow; in practice they retrieve over indexed chunk content and associated metadata such as `title` and `source`.
 * - No other direct Lamatic flow-to-flow handoff is encoded inside this flow itself; the dependency is via the shared vector database.
 *
 * ### External Services
 * - Amazon S3 — source content store used to list and read bucket objects — requires configured `credentials` on `triggerNode_1`.
 * - File extraction service within Lamatic — parses the S3 object located at `document_url` into structured or raw textual content — used by `extractFromFileNode_944`.
 * - Embedding model provider — converts chunk text into vector embeddings — requires the selected `embeddingModelName` on `vectorizeNode_639`.
 * - Vector database — stores embeddings and metadata for later retrieval — requires the selected `vectorDB` on `IndexNode_622`.
 * - Custom Lamatic code scripts — normalize extracted text, chunk payloads, and metadata — used by `codeNode_315`, `codeNode_254`, and `codeNode_507`.
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Any provider-level secrets needed for the selected embedding model or vector database are managed through Lamatic’s private model and connector configuration rather than named directly in this flow.
 *
 * ## Node Walkthrough
 * 1. `S3` (`triggerNode`) starts the flow by connecting to Amazon S3 with the selected `credentials` and `bucket`. It is configured to match all files via the `**` glob, uses `auto` strategy, and runs in `incremental_append` sync mode on a daily cron schedule. For each discovered object, it exposes source fields such as `document_url` and `document_key` for downstream nodes.
 * 2. `Variables` (`dynamicNode`) creates normalized metadata fields for the current S3 object. In this flow, it maps `title` to `{{triggerNode_1.output.document_key}}`, which means the object key becomes the primary human-readable identifier, and sets `source` to the fixed string `AWS S3 Bucket`.
 * 3. `Extract from File` (`dynamicNode`) reads the file located at `{{triggerNode_1.output.document_url}}` and attempts to extract its textual contents automatically based on file format. It is configured to join pages, preserve whitespace trimming defaults, and return parsed content rather than raw base64 text.
 * 4. `Extract Text` (`dynamicNode`) runs the custom script `@scripts/s3_extract-text.ts` to normalize the extractor’s output into the text shape expected by the chunking stage. This step exists because different file types can produce different extraction structures, and the downstream splitter needs a clean text payload.
 * 5. `Chunking` (`dynamicNode`) splits the normalized text from `{{codeNode_315.output}}` into chunks of 500 characters with 50 characters of overlap using a recursive character text splitter. It prefers paragraph breaks, then line breaks, then spaces as separators so chunks stay as semantically coherent as possible.
 * 6. `Get Chunks` (`dynamicNode`) runs `@scripts/s3_get-chunks.ts` to reshape the chunking node’s output into the exact list of plain text chunks expected by the embedding node. This is a formatting bridge between Lamatic’s chunker output and the vectorizer input contract.
 * 7. `Vectorize` (`dynamicNode`) sends the chunk list from `{{codeNode_254.output}}` to the selected text embedding model and generates vector representations. Its output includes the `vectors` that the indexer will store.
 * 8. `Transform Metadata` (`dynamicNode`) runs `@scripts/s3_transform-metadata.ts` to build the metadata payload aligned to the generated vectors. This step incorporates the earlier variable mapping, ensuring each vector record has consistent metadata such as `title` and `source`.
 * 9. `Index` (`dynamicNode`) writes `{{vectorizeNode_639.output.vectors}}` and `{{codeNode_507.output.metadata}}` into the selected vector database. It uses `title` as the `primaryKeys` field and `overwrite` for `duplicateOperation`, so re-indexing the same S3 object key replaces previous records instead of creating duplicates.
 * 10. `addNode` (`addNode`) is the terminal placeholder after indexing. It does not introduce new business logic in the exported flow but marks the end of the execution path.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | S3 trigger fails before processing any files | Missing, invalid, or expired `credentials`; wrong bucket selection; insufficient S3 permissions | Reconfigure `credentials`, verify the selected `bucket`, and ensure IAM permissions allow listing and reading objects. |
 * | Flow runs but no documents are indexed | Bucket is empty, sync found no new files, or glob/sync behavior excluded expected objects | Confirm the bucket contains files, verify incremental sync expectations, and rerun after adding or modifying source files if necessary. |
 * | File extraction returns empty or unusable content | Source file format is unsupported, corrupted, image-only, password-protected, or otherwise not extractable as text | Validate the file type, remove unsupported encryption, provide text-readable formats, or pre-process files before ingestion. |
 * | Chunking or vectorization receives malformed input | The extraction output shape did not match what the custom normalization scripts expect | Review `@scripts/s3_extract-text.ts` and `@scripts/s3_get-chunks.ts` against the actual extractor output for the file type being ingested. |
 * | Embedding generation fails | No `embeddingModelName` selected, selected model is unavailable, or model/provider access is not configured | Choose a valid `embedder/text` model and verify model provider access in Lamatic. |
 * | Indexing fails at the final step | No `vectorDB` selected, vector database is unreachable, schema is incompatible, or credentials are misconfigured | Select a valid vector database, verify connectivity and credentials, and confirm it supports the metadata/vector payload being written. |
 * | Expected metadata fields are missing or incorrect | `mapping` configuration was changed incorrectly or metadata transform script does not align with the mapping | Reset or correct the `mapping` input and verify `@scripts/s3_transform-metadata.ts` uses `title` and `source` as expected. |
 * | Re-indexing overwrites prior records unexpectedly | `duplicateOperation` is set to `overwrite` and `title` is used as the primary key | If overwrite behavior is not desired, change the indexing strategy or use a more granular unique key than `document_key`. |
 * | Assistant flow cannot answer from S3 content after this flow ran | Indexation did not complete successfully, data was written to the wrong vector database, or downstream assistant is pointed at a different store | Verify successful indexing logs, confirm the correct `vectorDB` was used, and ensure assistant flows retrieve from the same vector store. |
 * | Upstream flow not having run | An operator expects conversational answers without first populating the vector store through an indexation flow | Run this or another appropriate indexation flow before testing the assistant flows. |
 *
 * ## Notes
 * - This flow is designed for ingestion and synchronization, not direct question answering.
 * - The trigger is configured for scheduled incremental ingestion with `incremental_append`, which is appropriate for ongoing bucket updates but means unchanged historical files may not be reprocessed automatically.
 * - Chunk size is fixed at 500 characters with 50-character overlap. This is a reasonable default for general retrieval, but teams with highly structured or very long documents may want to tune chunking for better recall and precision.
 * - The indexer uses `title` as the primary key, and in this flow `title` defaults to the S3 object key. If object keys are reused or renamed inconsistently, overwrite behavior can affect record history.
 * - Because metadata preparation relies on custom scripts, any change to extractor output formats or desired metadata schema should be validated end to end before deploying at scale.
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
