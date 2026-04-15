/*
 * # S3
 * This flow ingests documents from an AWS S3 bucket, converts them into vector embeddings, and writes them into the shared semantic search index used by the wider retrieval system.
 *
 * ## Purpose
 * This flow is responsible for the S3-specific branch of the kit’s indexation layer. Its job is to detect or receive files from an S3 bucket, extract usable text from each file, split that text into retrieval-friendly chunks, generate embeddings for those chunks, and persist both vectors and metadata into a configured vector database. That solves the sub-problem of turning raw object storage content into searchable knowledge.
 *
 * The outcome of the flow is an indexed representation of S3-hosted documents keyed by document title and enriched with metadata such as source information. This matters because the broader semantic search agent relies on a unified vector index built from many heterogeneous sources. Without this preprocessing step, S3 documents would remain opaque files rather than searchable content.
 *
 * In the larger agent pipeline, this is an entry-point ingestion flow, not a retrieval or synthesis flow. It sits on the indexing side of the system described in the parent agent: sibling flows ingest from other systems such as Google Drive, SharePoint, Postgres, or crawled websites, while the downstream semantic retrieval flow queries the combined vector store. In other words, this flow prepares S3 content so later query-time flows can retrieve it.
 *
 * ## When To Use
 * - Use when documents already live in an AWS S3 bucket and need to become searchable through the kit’s semantic search experience.
 * - Use when you want incremental synchronization from S3 rather than a one-off manual import.
 * - Use when the source material is file-based content such as PDFs, text files, CSVs, or other formats supported by the extraction node.
 * - Use when a vector database has already been chosen as the shared search index for this bundle.
 * - Use when you want S3 object keys captured as document titles in the index.
 * - Use when this flow should contribute content alongside other indexation flows into the same retrieval layer.
 *
 * ## When Not To Use
 * - Do not use when the source content is stored in another system with a dedicated sibling flow, such as Google Drive, OneDrive, SharePoint, Postgres, or a web crawl source.
 * - Do not use when no S3 credentials are available or the target bucket cannot be accessed.
 * - Do not use when no vector database has been configured, because the flow’s final indexing step is mandatory.
 * - Do not use when the content is not file-based or cannot be represented as extractable document text.
 * - Do not use when you need query-time semantic retrieval; this flow only builds the index and does not answer user search requests.
 * - Do not use when exact object-level preservation is required without chunking, because this flow always splits extracted text before embedding.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | `select` | Yes | S3 authentication credentials used by the trigger connection. |
 * | `bucket` | `select` | Yes | Name of the S3 bucket to sync and ingest from. |
 * | `mapping` | `variablesInput` | Yes | Metadata mapping for document variables, specifically `title` and `source`. |
 * | `embeddingModelName` | `model` | Yes | Embedding model used to convert chunked text into vectors. |
 * | `vectorDB` | `select` | Yes | Target vector database where embeddings and metadata are indexed. |
 *
 * Below the table, there are several important constraints. The `bucket` value must come from the authenticated S3 account and is loaded dynamically through the connector. The `mapping` input must provide values for both `title` and `source`; by default, `title` is derived from `triggerNode_1.output.document_key` and `source` is set to `AWS S3 Bucket`. The embedding model must be compatible with `embedder/text`. The flow assumes the trigger can produce a resolvable `document_url` for each object and that the file format is supported by the file extraction stage.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `title` | `string` | The document identifier used as the primary key in the vector index, derived from the S3 object key. |
 * | `source` | `string` | Source label attached to the indexed metadata, defaulting to `AWS S3 Bucket`. |
 * | `metadata` | `object` | Transformed metadata payload associated with the indexed chunks. |
 * | `vectors` | `array` | Embedding vectors generated from the chunked document text. |
 * | `indexResult` | `object` | The effective result of writing vectors and metadata to the configured vector database. |
 *
 * The flow’s effective output is a structured indexing result rather than a human-readable response. Internally it builds a list of text chunks, converts them into embeddings, couples them with transformed metadata, and writes them to the vector store. Because the terminal node is an index operation followed by an empty `addNode`, the exact API response shape may depend on runtime conventions, but the canonical materialized outputs are the indexed vectors plus associated metadata keyed by `title`. Completeness depends on successful extraction and chunk generation; empty or unsupported files may yield little or no indexable content.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow within the Semantic Search bundle.
 * - It does not require another flow to run first, but it does require preconfigured infrastructure: valid S3 access, a selected embedding model, and a target vector database.
 *
 * ### Downstream Flows
 * - The bundle’s semantic retrieval flow consumes the vector records created by this flow from the shared vector database.
 * - Downstream consumers rely on the indexed `vectors` and attached `metadata`, especially the `title` primary key and source-related metadata, to retrieve and present relevant search results.
 * - Sibling orchestration or UI layers may also depend on the presence of these indexed records, but they do not consume this flow by direct node-to-node invocation; they query the shared index after this flow completes.
 *
 * ### External Services
 * - AWS S3 — source system for files and bucket enumeration — required credential: selected `credentials` input on `triggerNode_1`
 * - Embedding model provider via Lamatic model registry — generates text embeddings for chunks — required configuration: `embeddingModelName` on `vectorizeNode_639`
 * - Vector database selected in Lamatic — stores vectors and metadata for later semantic retrieval — required configuration: `vectorDB` on `IndexNode_622`
 * - Lamatic file extraction capability — reads and parses content from the S3-provided `document_url` — no separate user-supplied credential beyond S3 access
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Any provider-specific secrets for the selected embedding model or vector database are managed through Lamatic-connected credentials or workspace configuration rather than flow-level environment variable declarations.
 *
 * ## Node Walkthrough
 * 1. `S3` (`triggerNode`) starts the flow by connecting to AWS S3 with the selected `credentials`, enumerating content from the selected `bucket`, and emitting per-document fields such as `document_url` and `document_key`. Its sync settings indicate broad file matching with `globs` set to `**`, `strategy` set to `auto`, and `syncMode` set to `incremental_append`, so it is intended to keep appending newly detected content over time rather than rebuilding from scratch on each run.
 *
 * 2. `Variables` (`dynamicNode`) creates normalized metadata variables for downstream indexing. In this flow, it maps `title` to `{{triggerNode_1.output.document_key}}`, which means the S3 object key becomes the document identifier, and sets `source` to the constant string `AWS S3 Bucket`.
 *
 * 3. `Extract from File` (`dynamicNode`) reads the file located at `{{triggerNode_1.output.document_url}}` and extracts its textual or structured contents. The node is configured for automatic format detection, joins pages when relevant, preserves whitespace without trimming, and attempts to parse a broad range of file types without requiring manual file-format routing in the flow.
 *
 * 4. `Extract Text` (`dynamicNode`) runs the referenced script `@scripts/s3_extract-text.ts` to normalize the extraction output into the text payload expected by the chunking stage. This script is important because raw file extraction can vary by format, and the script likely flattens or selects the correct text-bearing fields so the downstream splitter receives coherent document text.
 *
 * 5. `Chunking` (`dynamicNode`) splits the extracted text from `{{codeNode_315.output}}` into smaller passages suitable for embedding and retrieval. It uses a recursive character-based splitter with `500` characters per chunk, `50` characters of overlap, and separator preference order of paragraph break, newline, then space. This improves retrieval quality by preserving local context while preventing chunks from becoming too large for efficient embedding.
 *
 * 6. `Get Chunks` (`dynamicNode`) runs `@scripts/s3_get-chunks.ts` to transform the chunking node’s output into the exact list of chunk texts expected by the vectorization step. This script acts as the adapter between Lamatic’s chunk node output structure and the embedder’s `inputText` contract.
 *
 * 7. `Vectorize` (`dynamicNode`) sends the chunk list from `{{codeNode_254.output}}` to the selected embedding model. It returns vector representations in `output.vectors`, which encode the semantic meaning of each chunk for later similarity search.
 *
 * 8. `Transform Metadata` (`dynamicNode`) runs `@scripts/s3_transform-metadata.ts` after vectorization to build the metadata payload that will be stored alongside the vectors. This step likely combines the normalized variables such as `title` and `source` with chunk- or document-level context into an index-ready `metadata` structure.
 *
 * 9. `Index` (`dynamicNode`) writes the embeddings and metadata into the selected vector database. It uses `{{vectorizeNode_639.output.vectors}}` as `vectorsField`, `{{codeNode_507.output.metadata}}` as `metadataField`, and declares `title` as the primary key. With `duplicateOperation` set to `overwrite`, repeated indexing of the same `title` replaces prior records rather than creating uncontrolled duplicates.
 *
 * 10. The terminal `addNode` is effectively a placeholder end node with no additional business logic. It marks completion after indexing has succeeded.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at startup or cannot list buckets | Missing or invalid S3 `credentials` | Reconfigure the `credentials` input with a working AWS connection that has permission to list and read the target bucket. |
 * | Bucket cannot be selected or sync returns no documents | Incorrect `bucket`, insufficient IAM access, or empty bucket | Verify the bucket name, ensure the credential can access it, and confirm that matching objects exist. |
 * | `Extract from File` returns empty content | Unsupported file format, inaccessible `document_url`, encrypted file, or binary-only content | Confirm the object type is supported, verify the generated URL is readable by the flow runtime, and test with a known text-bearing file. |
 * | Chunking or vectorization receives empty input | The extraction script produced no text or the source file had no extractable text | Inspect the outputs of `Extract from File` and `Extract Text`, then adjust source documents or script logic to handle the file format. |
 * | Vectorization fails | No `embeddingModelName` selected, model access not configured, or provider-side quota/auth issue | Select a valid text embedding model and verify model provider credentials or workspace access. |
 * | Index step fails | No `vectorDB` selected, database connection issue, or schema incompatibility | Choose a valid vector database in `vectorDB`, verify connectivity, and ensure the index accepts the provided vectors and metadata. |
 * | Indexed records overwrite unexpectedly | `title` primary key collides across documents because multiple files resolve to the same object key | Use a more unique metadata mapping for `title`, such as a full path or another stable identifier, if collisions are possible. |
 * | Retrieval flow cannot find S3 content later | This flow did not complete, indexed zero chunks, or wrote to a different vector database than retrieval expects | Confirm the run succeeded end-to-end, verify chunks and vectors were produced, and ensure both indexing and retrieval use the same vector store. |
 * | Incremental sync misses historical content | Trigger sync settings or connector state only pick up recent changes | Review the trigger configuration and run an initial backfill or reset connector state if a complete historical load is required. |
 *
 * ## Notes
 * - The flow is designed around incremental ingestion with `syncMode` set to `incremental_append`, so it is optimized for ongoing updates rather than guaranteed full reindex on every execution.
 * - File matching is extremely broad because `globs` is `**`. In buckets containing mixed operational artifacts, logs, binaries, or unsupported assets, you may want to narrow source contents upstream or clone the flow with stricter filtering.
 * - Metadata quality matters. Since `title` is the primary key and duplicate handling is `overwrite`, poor identifier choice can silently replace previously indexed records.
 * - The text extraction, chunk adaptation, and metadata transformation logic partly live in referenced scripts rather than inline node configuration. If indexing behavior appears unusual, inspect `@scripts/s3_extract-text.ts`, `@scripts/s3_get-chunks.ts`, and `@scripts/s3_transform-metadata.ts` first.
 * - The flow performs no query-time ranking, answer generation, or response synthesis. Its sole responsibility is preparing S3 content for the bundle’s downstream semantic retrieval experience.
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
