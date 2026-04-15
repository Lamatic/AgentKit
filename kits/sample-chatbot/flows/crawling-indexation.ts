/*
 * # Crawling Indexation
 * A crawl-driven ingestion flow that fetches website content, chunks and vectorizes it, and writes it into the shared knowledge index used by the broader Knowledge Chatbot system.
 *
 * ## Purpose
 * This flow is responsible for turning public website content into indexed vector records that can be retrieved later by the chatbot. It accepts one or more seed URLs, crawls those pages with Firecrawl, extracts the main markdown content from each discovered page, splits that content into manageable chunks, generates embeddings for those chunks, and stores both vectors and normalized metadata in a configured vector database.
 *
 * The outcome of the flow is a populated or updated knowledge base derived from web pages. That matters because the chatbot flow in this kit depends on a searchable vector index rather than raw URLs. Without this indexing step, website content remains inaccessible to retrieval and cannot be grounded into answers during runtime.
 *
 * Within the broader bundle, this is an entry-point ingestion flow in the indexation stage of the pipeline. In the overall plan-retrieve-synthesize pattern described by the parent agent, this flow sits firmly in the preparation and retrieval-enablement layer: it does not answer user questions itself, but produces the vectorized corpus that the downstream `Knowledge Chatbot` flow queries when synthesizing grounded responses.
 *
 * ## When To Use
 * - Use when you want to ingest documentation sites, marketing sites, help centers, or other publicly reachable web content into the knowledge base.
 * - Use when your source of truth is a set of URLs rather than files, database rows, or cloud storage objects.
 * - Use when you need to build or refresh the vector index before running the downstream chatbot flow.
 * - Use when the content should be discovered by crawling from one or more seed URLs instead of being manually uploaded.
 * - Use when the desired knowledge source is web-native content that Firecrawl can fetch and convert into markdown.
 *
 * ## When Not To Use
 * - Do not use this flow when your source data lives in Google Drive, Google Sheets, OneDrive, SharePoint, Amazon S3, Postgres, or another structured connector handled by a sibling indexation flow.
 * - Do not use this flow when no vector database has been configured, because indexing cannot complete without a target store.
 * - Do not use this flow when Firecrawl credentials are unavailable or invalid.
 * - Do not use this flow when the input is not a URL list or when the target content is behind authentication that the configured crawler credentials cannot access.
 * - Do not use this flow to answer end-user questions directly; use the downstream `Knowledge Chatbot` retrieval flow after indexation has completed.
 * - Do not use this flow for highly dynamic, transactional, or real-time web data when you need live answers from the source on every request rather than periodic indexing.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `urls` | `string[]` | Yes | List of seed URLs to crawl and index. The flow test input shows a typical value such as `https://lamatic.ai/docs`. |
 *
 * Below the trigger-level payload, the flow also requires private configuration inputs bound to internal nodes:
 *
 * - `vectorDB` | `select` | Yes | The vector database connection used by the `Index` node to write embeddings and metadata.
 * - `credentials` | `select` | Yes | The Firecrawl credential used by the `Firecrawl` node for crawler authentication.
 * - `embeddingModelName` | `model` | Yes | The embedding model used by the `Vectorize` node to convert text chunks into vectors.
 *
 * Input constraints and assumptions:
 *
 * - `urls` is expected to be a non-empty array of valid, fully qualified URLs.
 * - The trigger is configured as an `API Request` and references both `url` and `urls`, but the documented test input and crawl mode indicate the intended public interface is `urls` as a list.
 * - Firecrawl is configured in synchronous mode with list input semantics, so all crawling and extraction must complete within the configured timeout envelope for a single request lifecycle.
 * - Query parameters are ignored during crawling, which may collapse multiple URL variants into the same effective page path.
 * - Crawl behavior is bounded by internal limits such as crawl depth and crawl limit; callers should not assume unrestricted site traversal.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | Status message returned by the API response node. The configured value is `Records indexed successfully`. |
 *
 * The response is a small structured object containing a single human-readable success string. It is not a detailed indexing report and does not return crawled pages, chunk counts, vector IDs, or per-record status. A successful response therefore confirms completion at a high level, but does not provide completeness metrics or diagnostics for partial ingestion.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow and is intended to be invoked directly via its `API Request` trigger.
 * - Operationally, it does depend on prior configuration rather than another flow: a vector database must be selected, Firecrawl credentials must be configured, and an embedding model must be available.
 *
 * ### Downstream Flows
 * - `Knowledge Chatbot` — consumes the indexed vector records produced by this flow from the shared vector database. It does not consume the API response message directly; instead it depends on the persisted vectors and metadata written by the `Index` node.
 * - Any other retrieval or orchestration flow in the same kit that queries the shared vector index can benefit from the records this flow creates, provided it targets the same vector store and collection configuration.
 *
 * ### External Services
 * - Firecrawl — crawls seed URLs, discovers pages, and extracts page content as markdown — required credential: `credentials` on the `Firecrawl` node
 * - Embedding model provider — converts chunked text into vector embeddings — required configuration: `embeddingModelName` on the `Vectorize` node
 * - Vector database — stores vectors and metadata for retrieval — required configuration: `vectorDB` on the `Index` node
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Any provider-specific secrets are expected to be supplied through Lamatic credentials or model/database configuration attached to the `Firecrawl`, `Vectorize`, and `Index` nodes rather than named environment variables in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - The flow begins with an API-triggered request that accepts the crawl payload. In practice, the key runtime input is `urls`, a list of seed pages to crawl. The trigger is configured for realtime response handling, so the flow runs synchronously from invocation through indexing and then returns an API response.
 *
 * 2. `Firecrawl` (`dynamicNode`)
 *    - The `Firecrawl` node receives the seed URLs from `triggerNode_1.output.urls` and performs a synchronous crawl. It is configured to extract only the main content, ignore query parameters, avoid subdomains, and avoid external links. Internal crawl parameters cap the operation with values such as `crawlDepth` `5`, `crawlLimit` `10`, per-node `limit` `10`, `waitFor` `2000`, and `timeout` `30000`. The result is a list of crawled page objects exposed on `firecrawlNode_785.output.data`.
 *
 * 3. `Loop` (`forLoopNode`)
 *    - The `Loop` node iterates over the list of page results returned by Firecrawl. Each loop iteration works on one current page object from `firecrawlNode_785.output.data`. This is the per-document processing boundary for metadata extraction, chunking, vectorization, and indexing.
 *
 * 4. `Variables` (`dynamicNode`)
 *    - For each crawled page, the `Variables` node normalizes a small metadata set into working fields:
 *    - `title` comes from `currentValue.metadata.title`
 *    - `description` comes from `currentValue.metadata.description`
 *    - `source` comes from `currentValue.metadata.url`
 *    - These fields become the canonical metadata inputs for later transformation and indexing.
 *
 * 5. `Chunking` (`dynamicNode`)
 *    - The `Chunking` node takes the page markdown from `forLoopNode_370.output.currentValue.markdown` and splits it into chunks using a recursive character text splitter. It uses `500` characters per chunk with `50` characters of overlap, and prefers splitting on paragraph breaks, then line breaks, then spaces. This step turns each page into smaller retrieval-sized text segments suitable for embedding.
 *
 * 6. `Extract Chunks` (`dynamicNode`)
 *    - The `Extract Chunks` code node runs the script referenced at `@scripts/crawling-indexation_extract-chunks.ts`. Its role is to reshape the chunking output into the plain text array or structure expected by the embedding step. The node output is passed directly into `Vectorize`, so this script is effectively the contract adapter between Lamatic chunk output and embedding input.
 *
 * 7. `Vectorize` (`dynamicNode`)
 *    - The `Vectorize` node sends the extracted chunk text to the configured embedding model via `inputText: {{codeNode_794.output}}`. It produces vector embeddings for each chunk using the selected `embeddingModelName`. At this point the flow has chunk text and corresponding numerical vectors, but not yet the final index-ready metadata payload.
 *
 * 8. `Transform Metadata` (`dynamicNode`)
 *    - The `Transform Metadata` code node runs `@scripts/crawling-indexation_transform-metadata.ts`. It combines the vectors from `Vectorize` with the normalized page metadata prepared earlier, producing two outputs consumed by the indexing step:
 *    - `vectors` for the vector payload
 *    - `metadata` for the associated metadata records
 *    - This is where the final index write shape is assembled.
 *
 * 9. `Index` (`dynamicNode`)
 *    - The `Index` node writes the prepared vectors and metadata into the selected vector database. It is configured with action `index`, duplicate handling `overwrite`, and `primaryKeys` set to `title`. The vectors come from `codeNode_305.output.vectors`, and metadata comes from `codeNode_305.output.metadata`. Because overwrite behavior is enabled and the primary key is only `title`, records with the same title may replace earlier entries.
 *
 * 10. `Loop End` (`forLoopEndNode`)
 *     - After each page is indexed, execution passes to `Loop End`, which returns control to the `Loop` node until all crawled pages have been processed. Once iteration is complete, the flow exits the loop and proceeds to the final response.
 *
 * 11. `API Response` (`dynamicNode`)
 *     - The flow finishes by returning a static success payload containing `output: Records indexed successfully`. This confirms that the flow reached the response stage after processing the crawl results.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | The flow fails before crawling starts | `credentials` for `Firecrawl` are missing, invalid, or not authorized for the target content | Reconfigure the `Firecrawl` credential in Lamatic, verify access scope, and retest with a known public URL |
 * | The flow starts but no pages are indexed | `urls` is empty, malformed, unreachable, blocked by robots or site protections, or the crawl returns no `data` | Provide a valid non-empty list of reachable URLs, confirm the site is crawlable by Firecrawl, and test with a simpler seed page |
 * | The response says success but the knowledge base appears empty | The crawl may have returned no usable markdown, the chunk extraction/metadata scripts may have produced empty payloads, or writes may have targeted the wrong vector database | Inspect `Firecrawl` output, validate the script outputs, and confirm the selected `vectorDB` is the same store queried by the chatbot |
 * | Embedding generation fails | `embeddingModelName` is not configured, unavailable, or incompatible with the account/provider setup | Select a valid embedding model, verify provider access, and rerun the flow |
 * | Indexing fails at the `Index` node | `vectorDB` is not configured, the target index is unavailable, or the vector and metadata payloads are malformed | Reconfigure the vector database connection, confirm the target index exists and is writable, and inspect the transformed payload shape |
 * | Records unexpectedly overwrite each other | `primaryKeys` is set to `title`, so pages sharing the same title collide under `duplicateOperation: overwrite` | Change the indexing key strategy if possible, or ensure metadata transformation includes a more unique identifier such as source URL |
 * | Some expected subpages are missing | Crawl settings restrict traversal: subdomains are excluded, external links are disallowed, sitemap-only mode is off, and crawl limits are capped | Adjust the flow configuration to broaden crawl scope, increase limits, or provide more seed URLs |
 * | The request times out on large sites | The flow runs synchronously with `timeout` `30000` and finite crawl limits, which can be insufficient for broad sites | Reduce scope, provide narrower seed URLs, lower crawl breadth, or redesign for asynchronous ingestion if needed |
 * | The downstream chatbot cannot answer from newly crawled content | This flow has not been run successfully against the same vector store used by the chatbot, or ingestion completed with empty/partial data | Run this flow first, verify vectors exist in the shared index, and ensure the chatbot is configured to query the same backend |
 * | Trigger payloads behave inconsistently between `url` and `urls` | The `Firecrawl` node references both a singular `url` and plural `urls`, but the effective crawl mode is list-based | Standardize callers on the `urls` array and avoid relying on the singular field unless the trigger schema is explicitly extended and tested |
 *
 * ## Notes
 * - The flow is designed as one of several sibling indexation flows in the Knowledge Chatbot bundle. Only one source-specific ingestion flow typically needs to run for a given content source, but all of them feed the same general retrieval layer.
 * - The response is intentionally minimal. If operators need observability such as crawled page count, chunk count, failed URLs, or indexed record IDs, the flow would need additional response mapping or logging nodes.
 * - The chunking configuration favors relatively small chunks with light overlap. This is usually good for retrieval precision, but it may fragment highly structured pages such as API references or large tables.
 * - `onlyMainContent` is enabled, which helps remove boilerplate but may also omit useful navigation-linked context or side-panel content that some documentation sites treat as meaningful.
 * - Because duplicate handling is `overwrite` and the primary key is `title`, this flow is best suited to sites with stable, unique page titles. Sites with many repeated titles can cause accidental replacement unless the metadata transform script introduces stronger uniqueness downstream.
 */

// Flow: crawling-indexation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Crawling Indexation",
  "description": "Crawling Indexation",
  "tags": [],
  "testInput": {
    "urls": [
      "https://lamatic.ai/docs"
    ]
  },
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
  "vectorNode_157": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Vector DB",
      "required": true,
      "isPrivate": true,
      "description": "Select the vector database where the action will be performed.",
      "defaultValue": ""
    }
  ],
  "firecrawlNode_785": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for crawler authentication.",
      "defaultValue": "",
      "isCredential": true
    }
  ],
  "vectorizeNode_314": [
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
    "crawling_indexation_extract_chunks": "@scripts/crawling-indexation_extract-chunks.ts",
    "crawling_indexation_transform_metadata": "@scripts/crawling-indexation_transform-metadata.ts"
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "firecrawlNode_785",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "firecrawlNode",
      "modes": {
        "webhook": "list"
      },
      "values": {
        "nodeName": "Firecrawl",
        "url": "{{triggerNode_1.output.url}}",
        "mode": "sync",
        "urls": "{{triggerNode_1.output.urls}}",
        "delay": 0,
        "limit": 10,
        "mobile": false,
        "search": "",
        "timeout": 30000,
        "waitFor": 2000,
        "crawlDepth": "5",
        "crawlLimit": "10",
        "excludePath": [],
        "excludeTags": [],
        "includePath": [],
        "includeTags": [],
        "sitemapOnly": false,
        "crawlSubPages": false,
        "ignoreSitemap": false,
        "webhookEvents": [
          "completed",
          "failed",
          "page",
          "started"
        ],
        "changeTracking": false,
        "webhookHeaders": "",
        "onlyMainContent": true,
        "webhookMetadata": "",
        "includeSubdomains": false,
        "maxDiscoveryDepth": "10",
        "allowBackwardLinks": false,
        "allowExternalLinks": false,
        "skipTlsVerification": false,
        "ignoreQueryParameters": true
      }
    }
  },
  {
    "id": "forLoopNode_370",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "modes": {},
      "values": {
        "nodeName": "Loop",
        "wait": 0,
        "endValue": "10",
        "increment": "1",
        "connectedTo": "forLoopEndNode_301",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{firecrawlNode_785.output.data}}"
      }
    }
  },
  {
    "id": "forLoopEndNode_301",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "modes": {},
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_370"
      }
    }
  },
  {
    "id": "variablesNode_658",
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
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.title}}\"\n  },\n  \"description\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.description}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.url}}\"\n  }\n}"
      }
    }
  },
  {
    "id": "chunkNode_968",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "modes": {},
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{forLoopNode_370.output.currentValue.markdown}}",
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
    "id": "codeNode_794",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Extract Chunks",
        "code": "@scripts/crawling-indexation_extract-chunks.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_314",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "modes": {},
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_794.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_305",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Transform Metadata",
        "code": "@scripts/crawling-indexation_transform-metadata.ts"
      }
    }
  },
  {
    "id": "vectorNode_157",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "modes": {},
      "values": {
        "nodeName": "Index",
        "limit": 20,
        "action": "index",
        "filters": "",
        "primaryKeys": [
          "title"
        ],
        "vectorsField": "{{codeNode_305.output.vectors}}",
        "metadataField": "{{codeNode_305.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "graphqlResponseNode_532",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"Records indexed successfully\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-firecrawlNode_785",
    "source": "triggerNode_1",
    "target": "firecrawlNode_785",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_785-forLoopNode_370",
    "source": "firecrawlNode_785",
    "target": "forLoopNode_370",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_370-variablesNode_658",
    "source": "forLoopNode_370",
    "target": "variablesNode_658",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    }
  },
  {
    "id": "forLoopNode_370-forLoopEndNode_301",
    "source": "forLoopNode_370",
    "target": "forLoopEndNode_301",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": false
    }
  },
  {
    "id": "vectorNode_157-forLoopEndNode_301",
    "source": "vectorNode_157",
    "target": "forLoopEndNode_301",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_301-forLoopNode_370",
    "source": "forLoopEndNode_301",
    "target": "forLoopNode_370",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": true
    }
  },
  {
    "id": "variablesNode_658-chunkNode_968",
    "source": "variablesNode_658",
    "target": "chunkNode_968",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_968-codeNode_794",
    "source": "chunkNode_968",
    "target": "codeNode_794",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_794-vectorizeNode_314",
    "source": "codeNode_794",
    "target": "vectorizeNode_314",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_314-codeNode_305",
    "source": "vectorizeNode_314",
    "target": "codeNode_305",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_305-vectorNode_157",
    "source": "codeNode_305",
    "target": "vectorNode_157",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_301-graphqlResponseNode_532",
    "source": "forLoopEndNode_301",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_532",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
