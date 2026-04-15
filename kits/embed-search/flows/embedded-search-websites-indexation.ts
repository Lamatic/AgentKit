/*
 * # 1B. Embedded Search - Websites Indexation
 * A flow that crawls website content, converts it into vector embeddings, and writes those records into the shared search index used by the wider embedded search system.
 *
 * ## Purpose
 * This flow is responsible for ingesting website content into the embedded search stack. Its job is to take one or more URLs, scrape their main page content, break that content into retrieval-friendly chunks, generate embeddings for those chunks, and store the resulting vectors plus metadata in a configured vector database. In practice, this is the website ingestion path for the broader kit.
 *
 * The outcome is a searchable vector index of web pages that can later be queried by the search flow. That matters because the downstream retrieval experience depends on content being preprocessed into chunk-sized records with stable metadata such as `title`, `description`, and `source`. Without this ingestion step, the search experience would have no website knowledge to retrieve from.
 *
 * In the broader agent pipeline, this flow sits on the ingestion side of the lifecycle. The parent kit separates responsibilities across indexing, search, and deletion: this flow handles website acquisition and indexing, sibling flows handle PDFs and resource deletion, and the search flow performs retrieval over the stored vectors. It is therefore an entry-point flow for operators or applications that need to add website knowledge into the system before any search can succeed against that content.
 *
 * ## When To Use
 * - Use when you need to index one or more website URLs so they become searchable through the embedded search experience.
 * - Use when the content source is a webpage or docs site rather than an uploaded PDF.
 * - Use when an operator, admin tool, or application integration is performing content ingestion through Lamatic API or GraphQL.
 * - Use when the search flow should be able to retrieve answers grounded in website content that is not yet present in the vector store.
 * - Use when you want Firecrawl to scrape the main content of the supplied pages and ignore most query-string variation during indexing.
 *
 * ## When Not To Use
 * - Do not use this flow for PDF ingestion; the sibling `1A. Embedded Search - PDF Indexation` flow is the correct path for document files.
 * - Do not use this flow when the goal is to query existing indexed data; use the search flow instead.
 * - Do not use this flow when the goal is to remove previously indexed content; use the resource deletion flow instead.
 * - Do not use this flow if you do not have valid Firecrawl credentials, an embedding model selection, and a configured vector database.
 * - Do not use this flow when the input is not a URL list or comma-separated URL string.
 * - Do not use this flow if the target pages require access patterns the configured crawler cannot satisfy, or if the pages return no usable main content.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `urls` | `string[]` or `string` | Yes | The website URLs to scrape and index. The flow accepts either an array of URLs or a comma-separated string of URLs. |
 * | `credentials` | `select` | Yes | Firecrawl crawler credentials used to authenticate the scrape request. |
 * | `embeddingModelName` | `model` | Yes | The embedding model used to convert chunk text into vector representations. Must be an embedding-capable model of type `embedder/text`. |
 * | `vectorDB` | `select` | Yes | The vector database destination where indexed website chunks will be written. |
 *
 * The trigger payload meaningfully requires `urls`; the other fields are configured flow inputs bound to internal nodes and must be populated for successful execution. URL inputs are assumed to be valid, reachable web addresses. The crawler runs in `syncBatchScrape` mode, with `onlyMainContent` enabled, `ignoreQueryParameters` enabled, a per-request timeout of `30000` ms, and a crawl limit of `10`. Although Firecrawl supports broader crawl settings, this flow is configured for direct batch scraping of provided URLs rather than deep site discovery.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | Static success message returned by the API response node: `Records indexed successfully`. |
 *
 * The API response is a small structured object containing a single human-readable status field. It does not return the indexed vectors, per-URL status, chunk counts, or record identifiers. A successful response therefore confirms completion at a high level, but not detailed ingestion diagnostics.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is an entry-point ingestion flow. No other Lamatic flow must run before it.
 * - The calling application or operator must supply the input `urls` and ensure that Firecrawl credentials, an embedding model, and a vector database have been configured for this deployed flow.
 * - In the broader kit context, this flow is typically invoked by the application or admin-facing tooling that manages searchable content sources.
 *
 * ### Downstream Flows
 * - The embedded search retrieval flow consumes the vector records created by this flow from the shared vector database. It depends on this flow having produced indexed vectors and metadata for website content.
 * - The resource deletion flow may later remove records originating from indexed websites, but this flow does not emit explicit record IDs in its API response.
 * - No downstream flow consumes the response field `output` as operational data; downstream value comes from the persisted vector-store side effects.
 *
 * ### External Services
 * - Firecrawl — scrapes the supplied URLs and returns page content plus metadata — requires the `credentials` selection on node `firecrawlNode_785`
 * - Embedding model provider — generates vector embeddings from extracted chunk text — requires `embeddingModelName` on node `vectorizeNode_314`
 * - Vector database — stores vectors and associated metadata for later similarity retrieval — requires `vectorDB` on node `vectorNode_157`
 * - Lamatic GraphQL/API runtime — exposes the trigger and returns the final API response — used by `triggerNode_1` and `graphqlResponseNode_532`
 *
 * ### Environment Variables
 * - `LAMATIC_API_URL` — Lamatic runtime API endpoint used by the deployed flow interface — used by the flow runtime around `triggerNode_1`
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for invoking the deployed flow — used by the flow runtime around `triggerNode_1`
 * - `LAMATIC_API_KEY` — authentication key for Lamatic API access — used by the flow runtime around `triggerNode_1`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`, trigger) starts the flow through Lamatic’s API layer. The caller sends the website indexing request, most importantly the `urls` payload that identifies which pages should be scraped.
 *
 * 2. `Firecrawl` (`firecrawlNode`) performs a synchronous batch scrape of the provided URLs. In this flow it is configured to focus on main page content, ignore query parameters, avoid deep crawling, and return scraped page data in a single batch response. The result is a list of page records under `firecrawlNode_785.output.data`.
 *
 * 3. `Loop` (`forLoopNode`) iterates over each scraped page returned by Firecrawl. Each loop cycle handles one page record at a time so that chunking, embedding, metadata shaping, and indexing happen page by page.
 *
 * 4. `Variables` (`variablesNode`) extracts page-level metadata from the current Firecrawl record and normalizes it into three fields: `title` from `metadata.title`, `description` from `metadata.description`, and `source` from `metadata.url`. These values are carried forward to enrich every chunk created from that page.
 *
 * 5. `Chunking` (`chunkNode`) splits the current page’s markdown content from `forLoopNode_370.output.currentValue.markdown` into smaller text segments. It uses recursive character splitting with a target size of `500` characters, `50` characters of overlap, and separators of paragraph break, line break, and space. This prepares the page text for embedding and retrieval.
 *
 * 6. `Extract Chunks` (`codeNode`) runs the referenced script `@scripts/embedded-search-websites-indexation_extract-chunks.ts`. Its role is to transform the chunking node’s output into the exact text list expected by the vectorization step.
 *
 * 7. `Vectorize` (`vectorizeNode`) sends the extracted chunk texts to the selected embedding model. It receives the text input from `codeNode_794.output` and produces vector embeddings for each chunk.
 *
 * 8. `Transform Metadata` (`codeNode`) runs the referenced script `@scripts/embedded-search-websites-indexation_transform-metadata.ts`. This step combines the generated embeddings with the normalized page metadata so the final indexing payload contains both `vectors` and `metadata` in the shape required by the vector database node.
 *
 * 9. `Index` (`vectorNode`) writes the transformed records into the selected vector database using the `index` action. It indexes `codeNode_305.output.vectors` alongside `codeNode_305.output.metadata`, uses `title` as the configured primary key, and applies `overwrite` when duplicates are encountered.
 *
 * 10. `Loop End` (`forLoopEndNode`) closes the per-page processing cycle and routes execution back to `Loop` until all scraped pages have been processed.
 *
 * 11. `API Response` (`graphqlResponseNode`) returns the fixed response object with `output` set to `Records indexed successfully` after loop completion.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails before scraping starts | `credentials` for `Firecrawl` were not configured or are invalid | Configure valid Firecrawl credentials for `firecrawlNode_785` and redeploy or rerun the flow |
 * | Flow starts but no pages are indexed | `urls` input is empty, malformed, or resolves to pages Firecrawl cannot scrape | Provide valid, reachable URLs in array or comma-separated format and confirm the pages are accessible to the crawler |
 * | Flow completes with little or no searchable content | Target pages contain minimal main content, rely heavily on client-side rendering, or the content was filtered by `onlyMainContent` | Test the URLs directly in Firecrawl, confirm the rendered content is available, and adjust source pages or crawling strategy if needed |
 * | Embedding step fails | `embeddingModelName` is missing, incompatible, or unavailable in the environment | Select a valid embedding model of type `embedder/text` for `vectorizeNode_314` |
 * | Index step fails | `vectorDB` is not configured, unavailable, or rejects the payload shape | Configure a valid vector database connection for `vectorNode_157` and verify the database supports the expected index operation |
 * | Records overwrite unexpectedly | The vector index uses `title` as a primary key and `duplicateOperation` is set to `overwrite` | Ensure titles are unique enough for your corpus, or update the flow design to use a more stable unique key such as URL plus chunk identifier |
 * | Successful API response but downstream search finds nothing | Search is pointed at a different vector store, wrong collection, or indexing wrote fewer records than expected | Verify that the search flow is configured against the same vector database and inspect the indexed records directly |
 * | Caller expects detailed result data but only gets a message | The response node is configured to return a static `output` string only | Update the response mapping if you need counts, URLs processed, or failure details returned to the caller |
 * | Upstream flow not having run | The search flow is invoked before any website content has been indexed | Run this website indexation flow first, then perform retrieval once vectors exist in the shared store |
 *
 * ## Notes
 * - This flow is optimized for indexing explicitly provided URLs, not broad autonomous crawling of an entire website.
 * - Firecrawl is configured with `crawlDepth` `1`, `crawlLimit` `10`, `crawlSubPages` disabled, and `includeSubdomains` disabled, so operators should not expect recursive site ingestion from a single root URL.
 * - The chunking strategy is fixed at `500` characters with `50` characters overlap. This is a practical default for retrieval, but it may not be ideal for every content type.
 * - The response does not expose partial-failure details. If one page in a batch causes problems, operational observability may require checking node logs or enhancing the response contract.
 * - Using `title` as the sole primary key can create collisions across pages with the same title. This is the most important implementation caveat in the current configuration.
 */

// Flow: embedded-search-websites-indexation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1B. Embedded Search - Websites Indexation",
  "description": "",
  "tags": [],
  "testInput": {
    "urls": [
      "https://lamatic.ai/docs"
    ]
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "firecrawlNode_785": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "description": "Select the credentials for crawler authentication.",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    },
    {
      "name": "urls",
      "label": "URLs",
      "type": "monacoText",
      "required": true,
      "isPrivate": true,
      "description": "Configure the URLs array to be scraped. Can be array of URLs or a string of URLs separated comma",
      "defaultValue": "",
      "actionField": "mode",
      "actionValue": [
        "asyncBatchScrape",
        "syncBatchScrape"
      ]
    }
  ],
  "vectorizeNode_314": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "description": "Select the model to convert the texts into vector representations.",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "vectorNode_157": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "description": "Select the vector database where the action will be performed."
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
    "embedded_search_websites_indexation_extract_chunks": "@scripts/embedded-search-websites-indexation_extract-chunks.ts",
    "embedded_search_websites_indexation_transform_metadata": "@scripts/embedded-search-websites-indexation_transform-metadata.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "graphqlResponseNode_532",
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "graphqlResponseNode_532",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"Records indexed successfully\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1500
    },
    "selected": false
  },
  {
    "id": "firecrawlNode_785",
    "data": {
      "label": "dynamicNode node",
      "modes": {
        "webhook": "list"
      },
      "nodeId": "firecrawlNode",
      "values": {
        "url": "",
        "mode": "syncBatchScrape",
        "urls": "",
        "delay": 0,
        "limit": 10,
        "mobile": false,
        "search": "",
        "timeout": 30000,
        "waitFor": 2000,
        "webhook": "",
        "nodeName": "Firecrawl",
        "crawlDepth": 1,
        "crawlLimit": 10,
        "credentials": "",
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
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "forLoopNode_370",
    "data": {
      "label": "forLoopNode node",
      "modes": {},
      "nodeId": "forLoopNode",
      "values": {
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_301",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{firecrawlNode_785.output.data}}"
      }
    },
    "type": "forLoopNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "forLoopEndNode_301",
    "data": {
      "label": "forLoopEndNode node",
      "modes": {},
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_370"
      }
    },
    "type": "forLoopEndNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1350
    },
    "selected": false
  },
  {
    "id": "variablesNode_658",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "variablesNode",
      "values": {
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.title}}\"\n  },\n  \"description\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.description}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.url}}\"\n  }\n}",
        "nodeName": "Variables"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "chunkNode_968",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "chunkNode",
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
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_794",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-search-websites-indexation_extract-chunks.ts",
        "nodeName": "Extract Chunks"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "vectorizeNode_314",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_794.output}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "codeNode_305",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-search-websites-indexation_transform-metadata.ts",
        "nodeName": "Transform Metadata"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "vectorNode_157",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "vectorNode",
      "values": {
        "limit": 20,
        "action": "index",
        "filters": "",
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": [
          "title"
        ],
        "vectorsField": "{{codeNode_305.output.vectors}}",
        "metadataField": "{{codeNode_305.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-firecrawlNode_785-466",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "firecrawlNode_785",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "firecrawlNode_785-forLoopNode_370-691",
    "type": "defaultEdge",
    "source": "firecrawlNode_785",
    "target": "forLoopNode_370",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_370-variablesNode_658-623",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_370",
    "target": "variablesNode_658",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_658-chunkNode_968",
    "type": "defaultEdge",
    "source": "variablesNode_658",
    "target": "chunkNode_968",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "chunkNode_968-codeNode_794",
    "type": "defaultEdge",
    "source": "chunkNode_968",
    "target": "codeNode_794",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_794-vectorizeNode_314",
    "type": "defaultEdge",
    "source": "codeNode_794",
    "target": "vectorizeNode_314",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_314-codeNode_305",
    "type": "defaultEdge",
    "source": "vectorizeNode_314",
    "target": "codeNode_305",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_305-vectorNode_157",
    "type": "defaultEdge",
    "source": "codeNode_305",
    "target": "vectorNode_157",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorNode_157-forLoopEndNode_301",
    "type": "defaultEdge",
    "source": "vectorNode_157",
    "target": "forLoopEndNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_301-graphqlResponseNode_532-246",
    "type": "defaultEdge",
    "source": "forLoopEndNode_301",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-graphqlResponseNode_532",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  },
  {
    "id": "forLoopNode_370-forLoopEndNode_301-689",
    "data": {
      "condition": "Loop"
    },
    "type": "loopEdge",
    "source": "forLoopNode_370",
    "target": "forLoopEndNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_301-forLoopNode_370-476",
    "data": {
      "condition": "Loop",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "forLoopEndNode_301",
    "target": "forLoopNode_370",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
