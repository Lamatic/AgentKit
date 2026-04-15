/*
 * # Scraping Indexation
 * A flow that scrapes one or more public web pages, converts their contents into embeddings, and indexes them into a vector database for use by the wider internal knowledge assistant pipeline.
 *
 * ## Purpose
 * This flow is responsible for turning website content into searchable vector records. It accepts a list of URLs, uses Firecrawl to scrape page content, normalizes page metadata, splits the resulting markdown into retrieval-sized chunks, generates embeddings for those chunks, and writes the vectors plus metadata into a configured vector database. In practical terms, it is the website-ingestion path for the kit when knowledge lives on public or reachable web pages rather than in cloud drives, databases, or other enterprise sources.
 *
 * The outcome is an indexed corpus of web-derived knowledge that can be retrieved later by assistant flows. That matters because the assistant side of the kit depends on a populated vector store to ground answers in actual source material instead of relying on model memory alone. By producing chunked, embedded, and metadata-attached records, this flow creates the retrieval layer needed for accurate RAG responses.
 *
 * Within the broader system described by the parent agent, this flow sits squarely in the ingestion stage of the retrieve-then-synthesize chain. It is an entry-point indexation flow, not an answering flow. Operators run it before deploying or querying a web, Slack, or Teams assistant so those downstream assistant flows can retrieve relevant chunks from the vector store and synthesize grounded responses.
 *
 * ## When To Use
 * - Use when you need to ingest content from one or more web pages into the shared vector index.
 * - Use when the source material is available as public or otherwise Firecrawl-accessible URLs rather than files, drives, or database rows.
 * - Use when you are preparing or refreshing the knowledge base that downstream RAG assistant flows will query.
 * - Use when you want a simple scrape-and-index path for a finite list of URLs rather than a broader site crawl flow.
 * - Use when a developer or operator has already configured valid Firecrawl credentials, an embedding model, and a target vector database.
 *
 * ## When Not To Use
 * - Do not use when the source content lives in Google Drive, OneDrive, SharePoint, S3, Postgres, or another system that has a dedicated sibling indexation flow in the kit.
 * - Do not use when you need conversational question answering; this flow only ingests and indexes content, it does not retrieve or generate answers.
 * - Do not use when no vector database has been configured, because the flow has nowhere to write indexed records.
 * - Do not use when Firecrawl credentials are missing or the target pages are inaccessible to the crawler.
 * - Do not use when the input is not a URL list or comma-separated URL string compatible with the `Firecrawl` node's batch scrape mode.
 * - Do not use when you need recursive site crawling behavior across many discovered pages; the sibling crawling-oriented flow is the better fit for that use case.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `urls` | `string[]` or `string` | Yes | One or more target URLs to scrape. The configured `Firecrawl` node accepts either an array of URLs or a comma-separated string of URLs. |
 *
 * Below the trigger-level input, the flow also requires private runtime configuration to execute successfully:
 *
 * - `credentials` | `select` | Yes | Firecrawl authentication credential used by `Firecrawl`.
 * - `embeddingModelName` | `model` | Yes | Embedding model selected by `Vectorize` to convert chunks into vector representations.
 * - `vectorDB` | `select` | Yes | Target vector database selected by `Index` for record storage.
 *
 * The main validation assumption is that `urls` resolves to valid, reachable web addresses. The flow is configured for `syncBatchScrape`, so the payload should be appropriate for batch scraping rather than a crawl job definition. Although the loop node has an internal `endValue` of `10`, iteration is driven by the returned list from `Firecrawl`, so the effective workload is the scraped result set. Large pages may produce many chunks, and only main content is requested from Firecrawl.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | Fixed success message: `Records indexed successfully`. |
 *
 * The API response is a small structured object containing a single confirmation string. It does not return the indexed vectors, chunk count, record IDs, or per-URL status details. A successful response indicates the flow reached its response node, but operational systems should rely on node logs or vector store inspection if they need deeper observability into what was indexed.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow. No upstream Lamatic flow must run before it.
 *
 * Operationally, however, the broader kit assumes foundational setup has already happened:
 *
 * - A vector database must already exist and be selectable by the `Index` node.
 * - Firecrawl credentials must already be configured and available to the `Firecrawl` node.
 * - An embedding-capable model must already be available for selection by the `Vectorize` node.
 *
 * ### Downstream Flows
 * This flow does not hand off directly to another flow at runtime, but it produces indexed data consumed indirectly by the kit's assistant flows.
 *
 * - Web assistant flows consume the indexed records via vector retrieval from the configured vector store.
 * - Slack assistant flows consume the same indexed records via their retrieval step.
 * - Microsoft Teams assistant flows consume the same indexed records via their retrieval step.
 *
 * Those downstream flows do not read this flow's API response field. They depend on the side effect produced by `Index`: persisted vectors and metadata in the shared vector database.
 *
 * ### External Services
 * - Firecrawl — scrapes the provided URLs and returns page content plus metadata — requires configured Firecrawl `credentials` in the `Firecrawl` node.
 * - Embedding model provider — generates vector embeddings from extracted text chunks — requires the selected `embeddingModelName` in the `Vectorize` node and whatever provider credentials are associated with that model in the workspace.
 * - Vector database — stores vectors and metadata for later retrieval — requires the selected `vectorDB` connection in the `Index` node.
 *
 * ### Environment Variables
 * No explicit environment variables are declared in the flow source.
 *
 * This flow instead relies on Lamatic-managed private inputs and connector configuration:
 *
 * - `credentials` — Firecrawl authentication configuration — used by `Firecrawl`.
 * - `embeddingModelName` — embedding model selection — used by `Vectorize`.
 * - `vectorDB` — vector database selection — used by `Index`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - The flow starts from an API-triggered request.
 *    - It expects the incoming payload to provide `urls`, which become available as `triggerNode_1.output.urls`.
 *    - The response type is configured as realtime, so the caller receives a direct API response once processing completes.
 *
 * 2. `Firecrawl` (`dynamicNode` using `firecrawlNode`)
 *    - `Firecrawl` receives `{{triggerNode_1.output.urls}}` and runs in `syncBatchScrape` mode.
 *    - It scrapes up to the configured batch limits, requesting only main page content and ignoring query parameters.
 *    - The node returns a list of scraped page objects in `firecrawlNode_785.output.data`, including markdown content and metadata such as title, description, and URL.
 *
 * 3. `Loop` (`forLoopNode`)
 *    - The loop iterates over the list returned by `Firecrawl`.
 *    - For each scraped page, the current item is exposed as `forLoopNode_370.output.currentValue`.
 *    - This allows the downstream branch to process one scraped document at a time before returning to the loop controller.
 *
 * 4. `Variables` (`dynamicNode` using `variablesNode`)
 *    - For the current scraped page, this node extracts three normalized metadata fields:
 *      - `title` from `currentValue.metadata.title`
 *      - `description` from `currentValue.metadata.description`
 *      - `source` from `currentValue.metadata.url`
 *    - These values are prepared for later attachment to each indexed chunk.
 *
 * 5. `Chunking` (`dynamicNode` using `chunkNode`)
 *    - This node reads the page markdown from `forLoopNode_370.output.currentValue.markdown`.
 *    - It splits the text using a recursive character strategy with `500` characters per chunk and `50` characters of overlap.
 *    - Preferred separators are paragraph breaks, then line breaks, then spaces, which helps keep chunks reasonably readable and retrieval-friendly.
 *
 * 6. `Extract Chunks` (`dynamicNode` using `codeNode`)
 *    - This custom script at `@scripts/scraping-indexation_extract-chunks.ts` reshapes the chunking output into the exact text list expected by the vectorization step.
 *    - Functionally, it bridges the raw chunk node output and the `Vectorize` node's `inputText` requirement.
 *
 * 7. `Vectorize` (`dynamicNode` using `vectorizeNode`)
 *    - `Vectorize` receives the extracted chunk text from `{{codeNode_794.output}}`.
 *    - Using the selected `embeddingModelName`, it generates embeddings for each chunk.
 *    - The resulting vectors are passed downstream for packaging with metadata before indexing.
 *
 * 8. `Transform Metadata` (`dynamicNode` using `codeNode`)
 *    - This custom script at `@scripts/scraping-indexation_transform-metadata.ts` prepares the final indexing payload.
 *    - It combines the embeddings from `Vectorize`, the normalized metadata from `Variables`, and likely the chunk-level structure needed by the vector database.
 *    - Its outputs are explicitly consumed as `codeNode_305.output.vectors` and `codeNode_305.output.metadata` by the indexing node.
 *
 * 9. `Index` (`dynamicNode` using `vectorNode`)
 *    - `Index` performs the actual write into the selected `vectorDB`.
 *    - It uses action `index`, writes the transformed vectors and metadata, and applies `overwrite` as the duplicate handling strategy.
 *    - The node's `primaryKeys` setting is `title`, which means records sharing the same title may overwrite one another depending on the vector database's behavior and connector implementation.
 *
 * 10. `Loop End` (`forLoopEndNode`)
 *     - After each page has been indexed, control returns to `Loop End`, which either advances to the next scraped page or exits the loop once the list is exhausted.
 *     - This node is the bridge between per-document processing and completion of the whole batch.
 *
 * 11. `API Response` (`dynamicNode` using `graphqlResponseNode`)
 *     - After all loop iterations finish, the flow returns a fixed response object.
 *     - The response maps `output` to `Records indexed successfully`.
 *     - This confirms completion at the API layer, though it does not enumerate how many records or chunks were actually written.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | The flow fails immediately when `Firecrawl` runs | Missing or invalid `credentials` for Firecrawl | Reconfigure the Firecrawl credential selection and verify the underlying API key or connector setup in Lamatic. |
 * | The flow returns success but little or nothing appears in the vector store | The provided URLs produced empty content, inaccessible pages, or pages with minimal main content after extraction | Verify the URLs manually, confirm they are reachable by Firecrawl, and test whether page content is available when `onlyMainContent` is enabled. |
 * | The flow fails before scraping begins | `urls` is missing, malformed, or not compatible with the expected array or comma-separated string format | Pass a valid list of absolute URLs or a properly formatted comma-separated string in the API request. |
 * | The embedding step fails | `embeddingModelName` is not configured, unavailable, or lacks provider credentials | Select a valid embedding model in the private inputs and ensure its provider credentials are configured in the workspace. |
 * | Indexing fails at `Index` | No `vectorDB` has been selected or the target vector connector is misconfigured | Choose a valid vector database connection and verify the connector is healthy and writable. |
 * | Pages appear to overwrite one another in the vector store | Duplicate handling is set to `overwrite` and `primaryKeys` uses only `title` | Use unique page titles where possible, or revise the indexing configuration to use a more stable unique key such as source URL if customization is available. |
 * | Some expected pages are not processed | Firecrawl batch settings or source-site behavior limited the returned results | Review scrape limits, source accessibility, and whether the requested URLs redirect, block bots, or require additional handling. |
 * | The flow succeeds but downstream assistants cannot answer from the new content | The assistant flow is pointed at a different vector store, index namespace, or environment | Confirm that this flow and the assistant flow share the same vector database and retrieval configuration. |
 * | A caller expects detailed indexing stats in the API response | The response node returns only a fixed message and no operational metrics | Inspect execution logs or extend the flow if you need per-URL results, chunk counts, or inserted record identifiers. |
 * | The flow is invoked as if it were answering a user question | Upstream orchestration routed a query to an ingestion flow instead of an assistant flow | Update the orchestrator or router so user questions go to a RAG assistant flow, while content-loading jobs go to this indexation flow. |
 *
 * ## Notes
 * - This flow is optimized for scraping a provided list of URLs, not for deep site discovery. Its Firecrawl configuration uses `syncBatchScrape`, not a full crawl workflow.
 * - `onlyMainContent` is enabled, which generally improves retrieval quality by reducing boilerplate but can omit useful navigation or sidebar content if that content is important.
 * - The chunking configuration uses relatively small chunks with overlap, which is typically good for retrieval accuracy but can increase embedding volume and indexing cost for long pages.
 * - Because the API response is intentionally minimal, production operators should monitor node-level logs and vector-store state for observability.
 * - The referenced custom scripts are central to payload shaping. If this flow is modified, validate that `Extract Chunks` and `Transform Metadata` still produce structures compatible with `Vectorize` and `Index`.
 */

// Flow: scraping-indexation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Scraping Indexation",
  "description": "Scraping Indexation",
  "tags": [],
  "testInput": {
    "urls": [
      "https://thelabmiami.com"
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
    },
    {
      "name": "urls",
      "type": "monacoText",
      "label": "URLs",
      "required": true,
      "isPrivate": true,
      "actionField": "mode",
      "actionValue": [
        "asyncBatchScrape",
        "syncBatchScrape"
      ],
      "description": "Configure the URLs array to be scraped.Can be array of URLs or a string of URLs separated comma, E.g. urlA,urlB",
      "defaultValue": ""
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
    "scraping_indexation_extract_chunks": "@scripts/scraping-indexation_extract-chunks.ts",
    "scraping_indexation_transform_metadata": "@scripts/scraping-indexation_transform-metadata.ts"
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
        "url": "",
        "mode": "syncBatchScrape",
        "urls": "{{triggerNode_1.output.urls}}",
        "delay": 0,
        "limit": 10,
        "mobile": false,
        "search": "",
        "timeout": 30000,
        "waitFor": 2000,
        "crawlDepth": 1,
        "crawlLimit": 10,
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
        "maxDiscoveryDepth": 1,
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
        "code": "@scripts/scraping-indexation_extract-chunks.ts"
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
        "code": "@scripts/scraping-indexation_transform-metadata.ts"
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
