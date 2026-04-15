/*
 * # Crawling Indexation
 * A flow that crawls one or more documentation URLs, chunks and embeds the extracted content, and writes it into a vector index so the wider Deep Research system can retrieve internal knowledge during downstream reasoning.
 *
 * ## Purpose
 * This flow is responsible for turning web-hosted content into searchable vector records. Given a list of URLs, it uses a crawler to fetch page content, iterates over each crawled page, extracts key page metadata, splits markdown into chunk-sized segments, generates embeddings for those chunks, and indexes the resulting vectors plus metadata into a configured vector database.
 *
 * The outcome is a populated or refreshed vector index containing chunk-level representations of crawled pages. That matters because the broader agent pipeline depends on high-quality indexed knowledge to answer questions grounded in internal or curated sources rather than relying only on public web search. Without this flow, the retrieval layer for organization-specific or curated web content would remain empty or stale.
 *
 * In the broader Deep Research architecture, this is a maintenance and data-preparation flow rather than an end-user reasoning flow. It sits before retrieval and synthesis: operators run it to build the knowledge base, and downstream retrieval flows query the resulting vector store when the planning and evidence-gathering stages determine that internal indexed content should be consulted.
 *
 * ## When To Use
 * - Use when you need to ingest documentation, knowledge base pages, or other crawlable web content into the project’s vector database.
 * - Use when a new site section or set of URLs must become searchable by downstream research or QA flows.
 * - Use when indexed content is outdated and needs to be refreshed by recrawling the source URLs.
 * - Use when the broader Deep Research system should answer using curated site content instead of relying only on public web search.
 * - Use when an operator wants to seed or expand the internal retrieval corpus before enabling user-facing research workflows.
 *
 * ## When Not To Use
 * - Do not use when the source content is not available via public or credentialed web crawling and instead lives in a dedicated connector such as Google Drive, SharePoint, S3, or Postgres; use the matching indexation flow for that source.
 * - Do not use when the goal is to answer a user question directly; this flow prepares data and does not synthesize an answer.
 * - Do not use when no vector database has been configured, because the flow cannot persist embeddings without a target index.
 * - Do not use when crawler credentials for the target site have not been configured and the site requires authenticated access.
 * - Do not use when the input payload does not contain crawl targets in `urls`; this flow is not designed for free-text documents or binary file uploads.
 * - Do not use as a replacement for downstream retrieval flows, since it returns only a success message rather than searchable results.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `urls` | `string[]` | Yes | List of URLs to crawl and index. This is the trigger payload consumed by the flow’s `API Request` node and passed to the crawler. |
 *
 * Below the trigger-level request, the flow also requires node-level private configuration to run successfully:
 *
 * - `vectorDB` | `select` | Yes | Private selection of the target vector database used by the `Index` node. |
 * - `credentials` | `select` | Yes | Private crawler credential selection used by the `Firecrawl` node for authenticated crawling where needed. |
 * - `embeddingModelName` | `model` | Yes | Private embedding model selection used by the `Vectorize` node to convert text chunks into vectors. |
 *
 * Input constraints and assumptions:
 *
 * - `urls` is expected to be a non-empty list of valid absolute URLs.
 * - The flow is configured around list crawling, even though the crawler node also contains a `url` mapping; operationally, the tested input shape is an array in `urls`.
 * - Crawling is synchronous and limited by the crawler configuration: crawl depth `5`, crawl limit `10`, and per-request timeout `30000` ms.
 * - Query parameters are ignored during crawling, which helps reduce duplicate pages caused by tracking parameters.
 * - Only main page content is requested from the crawler, so navigation chrome and other peripheral markup may be excluded.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | Fixed success message: `Records indexed successfully`. |
 *
 * The API response is a simple single-field object containing a human-readable status string. It does not return the crawled pages, generated chunks, embedding vectors, per-record IDs, or indexing statistics. A successful response indicates that the flow reached its response node after processing the loop, but callers should rely on vector store inspection or platform execution logs for detailed ingestion diagnostics.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is effectively a standalone ingestion flow and can be invoked directly via API/GraphQL.
 * - No upstream flow is required to produce its trigger payload in the Lamatic graph.
 * - In the broader agent architecture, operators or administrative tooling typically invoke this flow before any retrieval flow that expects indexed web content to exist.
 *
 * ### Downstream Flows
 * - Downstream retrieval flows in the Deep Research kit depend on the vector records produced here, even though they do not consume this flow’s API response directly.
 * - Those retrieval flows query the vector database populated by this flow and rely on the indexed `metadata` and `vectors` written by the `Index` node.
 * - Final synthesis flows depend indirectly on this flow because they can only ground answers in crawled site content if retrieval flows are able to find the indexed chunks created here.
 *
 * ### External Services
 * - Firecrawl — crawls the supplied URLs and returns page content plus metadata — required credential: `credentials` selected in the `Firecrawl` node
 * - Embedding model provider via Lamatic model routing — generates vector embeddings from extracted text chunks — required configuration: `embeddingModelName` selected in the `Vectorize` node
 * - Vector database — stores embeddings and metadata for retrieval — required configuration: `vectorDB` selected in the `Index` node
 * - Lamatic GraphQL/API trigger-response runtime — accepts the request and returns the final status — required environment and platform configuration provided by the Lamatic deployment
 *
 * ### Environment Variables
 * - `LAMATIC_API_URL` — Lamatic platform endpoint used by the deployed flow runtime — used by the flow at deployment/runtime level, not explicitly by a single graph node
 * - `LAMATIC_PROJECT_ID` — identifies the Lamatic project hosting this flow — used by the flow at deployment/runtime level, not explicitly by a single graph node
 * - `LAMATIC_API_KEY` — authenticates API access to invoke the deployed flow — used by the flow at deployment/runtime level, not explicitly by a single graph node
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - This is the flow entry point. It receives the incoming API/GraphQL payload and exposes the request fields to downstream nodes.
 *    - In this flow, the important trigger field is `urls`, which carries the list of pages or site entry points to crawl.
 *
 * 2. `Firecrawl` (`dynamicNode`)
 *    - The crawler consumes `{{triggerNode_1.output.urls}}` and performs a synchronous crawl.
 *    - It is configured to focus on main content, ignore query parameters, avoid subpages by default unless discovered within configured depth rules, and cap the crawl at `10` pages with depth up to `5`.
 *    - The node emits a `data` collection containing crawled page objects, including markdown content and page metadata such as title, description, and canonical URL.
 *
 * 3. `Loop` (`forLoopNode`)
 *    - This node iterates over `{{firecrawlNode_785.output.data}}`, processing one crawled page at a time.
 *    - The loop is list-driven, so each iteration exposes the current page object as `currentValue` for downstream transformation and indexing.
 *
 * 4. `Variables` (`dynamicNode`)
 *    - For the current crawled page, this node extracts three metadata fields into normalized variables: `title`, `description`, and `source`.
 *    - `title` is mapped from the page metadata title, `description` from the page metadata description, and `source` from the page URL.
 *    - These values are later used when assembling metadata for vector index records.
 *
 * 5. `Chunking` (`dynamicNode`)
 *    - This node takes the current page’s markdown body from `{{forLoopNode_370.output.currentValue.markdown}}` and splits it into smaller text segments.
 *    - It uses recursive character chunking with a target size of `500` characters and an overlap of `50` characters, preferring to split first on double newlines, then single newlines, then spaces.
 *    - The result is a chunked representation suitable for embedding and retrieval.
 *
 * 6. `Extract Chunks` (`dynamicNode`)
 *    - This code-backed step runs the referenced script `crawling-indexation_extract-chunks.ts`.
 *    - Its role is to transform the chunking node’s output into the exact text list expected by the embedding step.
 *    - Although the script source is not expanded here, the surrounding graph makes clear that its output is the text payload passed directly into the `Vectorize` node.
 *
 * 7. `Vectorize` (`dynamicNode`)
 *    - This node sends the extracted chunk texts to the selected embedding model via `embeddingModelName`.
 *    - It converts each text chunk into a vector representation that can later be searched semantically.
 *    - The node operates on the output of `Extract Chunks`, so the vectors correspond to the per-page chunk list created in the current loop iteration.
 *
 * 8. `Transform Metadata` (`dynamicNode`)
 *    - This code-backed step runs the referenced script `crawling-indexation_transform-metadata.ts`.
 *    - It combines the generated embeddings with metadata derived from earlier steps and prepares two structured outputs: `vectors` and `metadata`.
 *    - These outputs are shaped specifically for the vector database indexing operation performed next.
 *
 * 9. `Index` (`dynamicNode`)
 *    - This node writes the prepared vectors and metadata into the selected vector database.
 *    - It performs the `index` action using `{{codeNode_305.output.vectors}}` and `{{codeNode_305.output.metadata}}`.
 *    - Duplicate handling is set to `overwrite`, and `title` is configured as the primary key, so records sharing the same title may replace existing entries rather than creating duplicates.
 *
 * 10. `Loop End` (`forLoopEndNode`)
 *     - After each page is indexed, execution returns here to determine whether more crawled pages remain.
 *     - If additional pages are present, control loops back to `Loop`; otherwise the flow exits the iteration cycle.
 *
 * 11. `API Response` (`dynamicNode`)
 *     - Once all iterations complete, the flow returns a fixed response object with `output` mapped to `Records indexed successfully`.
 *     - This marks the end of the ingestion run from the caller’s perspective.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails before crawling starts | `credentials` for the `Firecrawl` node were not configured or are invalid | Select valid crawler credentials in the flow configuration and verify the target site can be accessed with them |
 * | Flow starts but no pages are indexed | `urls` is empty, malformed, unreachable, or outside crawler constraints | Provide at least one valid absolute URL, verify the site is reachable, and confirm crawl settings allow the desired pages to be discovered |
 * | Only a subset of expected pages appears in the index | Crawl limit, crawl depth, sitemap settings, or content-discovery restrictions prevented full traversal | Increase crawl scope if appropriate, review `crawlDepth`, `crawlLimit`, and discovery settings, and rerun the flow |
 * | Embedding step fails | `embeddingModelName` was not selected, the model is unavailable, or provider access is misconfigured | Select a valid embedding model supported in the environment and confirm the backing model provider is available |
 * | Indexing step fails | `vectorDB` was not configured or the target vector database is unavailable | Configure a valid vector database in the `Index` node and verify connectivity and permissions |
 * | Existing indexed records are unexpectedly replaced | `duplicateOperation` is set to `overwrite` and `title` is the configured primary key | Use unique titles in source content, adjust key strategy if supported, or account for overwrite semantics during ingestion planning |
 * | Response says success but retrieval quality is poor | Chunks may be too small, too generic, missing context, or page metadata may be weak | Tune chunk size and overlap, inspect the transform scripts, and validate the quality of crawled markdown and metadata |
 * | Flow returns little or no useful content from a page | `onlyMainContent` filtered out important sections or the site renders content in a way the crawler does not capture well | Test the crawl output, adjust crawler settings if possible, and confirm the source site exposes content in crawlable HTML |
 * | Downstream retrieval flow cannot find expected documents | This flow was never run, failed silently before indexing, or wrote to a different vector database than the retriever queries | Run or rerun this flow successfully, confirm the target vector database selection, and align retrieval configuration with the same index |
 *
 * ## Notes
 * - The flow’s public API response is intentionally minimal. Operational observability depends on execution logs, vector database inspection, and any diagnostics exposed by the underlying platform.
 * - The loop processes crawled pages one by one, which keeps transformations simple but may increase runtime for larger crawls.
 * - Because the primary key is `title`, pages with repeated or unstable titles can collide. This is convenient for overwriting refreshed records but risky for sites that reuse generic page titles.
 * - The flow references two custom scripts, `crawling-indexation_extract-chunks.ts` and `crawling-indexation_transform-metadata.ts`. Those scripts define important shaping logic between chunking, embedding, and indexing, so any change to record schema or retrieval expectations should be coordinated there.
 * - The crawler node includes both `url` and `urls` mappings, but the documented and tested trigger input is `urls` as an array. Callers should prefer that shape.
 * - Since this is an ingestion flow, it is best run on a schedule or as part of content publishing operations rather than synchronously inside user-facing research requests.
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
