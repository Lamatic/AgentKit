/*
 * # Index Articles
 * A flow that scrapes a reading-list of public article URLs, chunks and embeds their content, and indexes the resulting records into a vector database for downstream digest synthesis.
 *
 * ## Purpose
 * This flow is responsible for turning a list of articles into retrievable knowledge. It accepts one or more public URLs, uses Firecrawl to scrape the pages, extracts the main markdown content and page metadata, splits that content into retrieval-sized chunks, generates embeddings for those chunks, and writes both vectors and metadata into a configured vector database. In practice, it solves the web-ingestion part of preparing a reading list so the `Synthesize Digest` flow can retrieve grounded passages.
 *
 * The outcome is an indexed set of page chunks, each associated with metadata such as page title, description, source URL, `citation_id` (hostname), and `chunk_id`. That matters because downstream retrieval and citation numbering depend on semantically searchable, chunked records with stable primary keys rather than raw HTML or full-page text.
 *
 * In the broader agent architecture, this flow sits on the ingestion side of the reading-list pipeline. It is an entry-point flow used during corpus setup or refresh, before the `Synthesize Digest` flow is invoked. Its role is in the prepare-and-index stage: collect source material, normalize it, vectorize it, and store it so later synthesis can retrieve relevant context and produce cited digests.
 *
 * ## When To Use
 * - Use when you need to ingest content from one or more public article URLs into the shared vector collection used by this bundle.
 * - Use when the source material is best accessed by URL rather than pasted text or a chat widget.
 * - Use when you want a fixed reading list to become available for semantic retrieval and citation-backed synthesis.
 * - Use when operators are setting up or refreshing the article corpus before running digest queries.
 * - Use when the input is a list of concrete page URLs and synchronous scraping is acceptable.
 *
 * ## When Not To Use
 * - Do not use when no vector database has been configured; this flow cannot complete without a target index.
 * - Do not use when Firecrawl credentials are missing or invalid.
 * - Do not use when the input is not a URL list, such as raw document text, file uploads, or user questions.
 * - Do not use when you need live digest generation; this flow only prepares indexed knowledge and does not return summaries or contradictions.
 * - Do not use for deep multi-level site discovery or broad crawling campaigns; this flow is configured for batch scraping of the provided URLs rather than aggressive recursive crawling.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `urls` | array of strings or comma-separated string | Yes | One or more URLs to scrape and index. The trigger receives this payload and passes it to Firecrawl batch scraping. |
 *
 * Below the trigger-level payload, the flow also depends on private runtime configuration supplied to internal nodes:
 *
 * - `credentials` — required Firecrawl credential selection used by `Firecrawl` for crawler authentication.
 * - `vectorDB` — required vector database selection used by `Index` as the storage target (must match the Vector DB selected on `Synthesize Digest`).
 * - `embeddingModelName` — required embedding model used by `Vectorize` to convert text chunks into vectors.
 *
 * Notable input constraints and assumptions:
 *
 * - `urls` is expected to contain valid, fully qualified URLs such as `https://example.com/article`.
 * - The flow is configured to pass `urls` directly into Firecrawl `syncBatchScrape`, so malformed entries may cause scrape failures or partial results.
 * - Firecrawl is configured with a `limit` of `10`, so very large input sets may require batching across multiple invocations.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `indexed_count` | number | Count of scraped pages processed in this run (from Firecrawl `data` length when available). |
 * | `collection` | string | Operator-facing label for the configured vector store (`configured` when a private Vector DB selection is present). |
 * | `errors` | array | Reserved list for scrape/index errors; empty on a clean run. |
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point ingestion flow invoked directly through `API Request`.
 *
 * ### Downstream Flows
 * - `Synthesize Digest` — consumes the indexed vectors and metadata written by this flow rather than this flow’s API response. Both flows must target the same private Vector DB selection.
 *
 * ### External Services
 * - Firecrawl — scrapes and extracts page content from the supplied URLs — required credential: selected `credentials` input on `Firecrawl`.
 * - Embedding model provider — generates vector embeddings for text chunks — required configuration: selected `embeddingModelName` on `Vectorize`.
 * - Vector database — stores vectors and metadata for later retrieval — required configuration: selected `vectorDB` on `Index`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the incoming API payload in realtime mode. For this flow, the important trigger field is `urls`.
 * 2. `Firecrawl` (`firecrawlNode`) runs in `syncBatchScrape` mode against `{{triggerNode_1.output.urls}}` with `onlyMainContent` enabled and a scrape `limit` of `10`.
 * 3. `Loop` (`forLoopNode`) iterates over `{{firecrawlNode_785.output.data}}`, processing one scraped page at a time.
 * 4. `Variables` (`variablesNode`) maps `title`, `description`, and `source` (URL) from the current loop item.
 * 5. `Chunking` (`chunkNode`) splits the page markdown with recursive character splitting (`500` chars, `50` overlap).
 * 6. `Extract Chunks` (`codeNode`) runs `@scripts/index-articles_extract-chunks.ts`.
 * 7. `Vectorize` (`vectorizeNode`) embeds the extracted chunk texts.
 * 8. `Transform Metadata` (`codeNode`) runs `@scripts/index-articles_transform-metadata.ts`, adding `citation_id` (hostname) and `chunk_id` (`title:idx`).
 * 9. `Index` (`vectorNode`) writes vectors and metadata with composite `primaryKeys: ["citation_id", "chunk_id"]` and `duplicateOperation: "overwrite"`.
 * 10. `Loop End` (`forLoopEndNode`) closes iteration.
 * 11. `API Response` (`graphqlResponseNode`) returns `{ indexed_count, collection, errors }`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at scraping stage | Firecrawl credentials missing or invalid | Configure a valid Firecrawl credential on the Firecrawl node |
 * | Success response but pages not searchable later | Wrong Vector DB selected vs synthesize flow, or empty scrape content | Align Vector DB on both flows; inspect Firecrawl output |
 * | Unexpected overwrites across different articles with the same title | Primary keys misconfigured | Confirm composite keys `citation_id` + `chunk_id` are set (this flow’s default) |
 * | Very large batches fail | Firecrawl `limit` is `10` | Split URLs into smaller batches |
 *
 * ## Notes
 * - Composite primary keys (`citation_id`, `chunk_id`) avoid the title-only collision overwrite issue present in some scraping-indexation templates.
 * - `citation_id` is the source hostname so synthesize can build a numbered source list for in-text `[n]` citations.
 */

// Flow: index-articles

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Index Articles",
  "description": "Scrape a list of article URLs, chunk and embed the content, and index records with citation-aware metadata for reading-list digest synthesis.",
  "tags": ["research", "ingestion"],
  "testInput": {
    "urls": [
      "https://www.brookings.edu/articles/regulating-general-purpose-ai-areas-of-convergence-and-divergence-across-the-eu-and-the-us/",
      "https://www.eff.org/deeplinks/2026/06/ai-regulation-should-be-rational-not-retaliatory"
    ]
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "ravijaanthony",
    "email": "ravijaanthony@gmail.com"
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
      "description": "Select the vector database where the action will be performed. Use the same selection as Synthesize Digest.",
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "index_articles_extract_chunks": "@scripts/index-articles_extract-chunks.ts",
    "index_articles_transform_metadata": "@scripts/index-articles_transform-metadata.ts"
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
        "responeType": "async",
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
        "code": "@scripts/index-articles_extract-chunks.ts"
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
        "code": "@scripts/index-articles_transform-metadata.ts"
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
          "citation_id",
          "chunk_id"
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
        "outputMapping": "{\n  \"indexed_count\": \"{{firecrawlNode_785.output.data.length}}\",\n  \"collection\": \"configured\",\n  \"errors\": []\n}"
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
