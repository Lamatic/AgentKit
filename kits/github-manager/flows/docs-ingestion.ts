/*
 * # DOCS Ingestion
 * This flow ingests documentation from a supplied URL, converts it into vector-searchable chunks, and serves as the knowledge-base indexing stage for the wider GitHub Manager system.
 *
 * ## Purpose
 * This flow is responsible for turning raw documentation pages into indexed vector records that downstream retrieval systems can query semantically. It solves the foundational knowledge-ingestion problem in the bundle: static docs are not directly useful to an LLM or classifier until they have been fetched, cleaned, chunked, embedded, and stored in a vector database with stable metadata.
 *
 * The outcome of this flow is a populated or refreshed vector index containing documentation chunks and their associated metadata. That matters because the wider agent pipeline depends on accurate, up-to-date retrieval context when answering repository questions or classifying and handling GitHub issues. Without this ingestion step, the runtime classifier flow has no documentation-grounded context to retrieve from.
 *
 * In the broader system described by the parent agent, this flow sits before retrieval and reasoning. It is the ingestion side of a two-flow architecture: this flow builds the searchable document memory, and the GitHub-facing classifier flow uses that memory during its own analysis and action steps. In a plan-retrieve-synthesize framing, `DOCS Ingestion` is the index-building prerequisite that enables the retrieve phase for downstream flows.
 *
 * ## When To Use
 * - Use when you need to ingest a new documentation URL into the vector store for the first time.
 * - Use when repository or product documentation has changed and the semantic index must be refreshed.
 * - Use when setting up the GitHub Manager bundle before enabling issue classification or other retrieval-grounded behavior.
 * - Use when operators want a manual resync of documentation content from a known URL.
 * - Use when the downstream classifier flow is expected to rely on current documentation context and the existing index may be stale.
 *
 * ## When Not To Use
 * - Do not use for GitHub webhook events, issue triage, or labeling actions; those belong to the separate classifier/handler flow in the parent agent.
 * - Do not use when no valid documentation `url` can be supplied to the trigger.
 * - Do not use when scraper credentials have not been configured, because the scrape step cannot authenticate.
 * - Do not use when an embedding model or vector database has not been selected; indexing cannot complete without both.
 * - Do not use for ad hoc question answering at runtime; this flow prepares data for retrieval but does not perform retrieval or synthesis itself.
 * - Do not use when the source content is not web-accessible documentation content that the scraper can fetch.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `url` | `string` | Yes | The documentation page URL provided to the `API Request` trigger and passed into the scraper. |
 * | `credentials` | `select` | Yes | Scraper authentication credentials used by the `Scraper` node to access the target URL if needed. |
 * | `embeddingModelName` | `model` | Yes | The embedding model selected by the `Vectorize` node to convert text chunks into vectors. |
 * | `vectorDB` | `select` | Yes | The target vector database used by the `Index` node to store vectors and metadata. |
 *
 * The trigger expects a valid, fetchable documentation URL in `url`. The flow assumes the URL points to content that can be rendered and reduced to main-page markdown. No explicit max-length or language validation is declared in the flow, but the scraper, chunker, and embedder implicitly assume text-based documentation rather than binary or highly interactive pages.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `message` | `string` | A status message returned from the `Index` node describing the indexing result. |
 * | `records` | `number` | The count of records indexed, returned from `IndexNode_824.output.recordsIndexed`. |
 *
 * The API response is a small structured object with two fields. It does not return the scraped content, chunks, embeddings, or metadata payloads directly; it only reports indexing status and the number of stored records. Completeness is therefore operational rather than diagnostic: a successful response confirms indexing activity, but not the exact contents of each stored chunk.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is effectively an entry-point ingestion flow within the bundle. No other Lamatic flow is required to run before it.
 *
 * At the system level, operators typically run this flow before the GitHub issue classifier flow so that a documentation index exists for retrieval. The downstream classifier flow depends on the vector store having already been populated, but this flow does not consume outputs from another flow.
 *
 * ### Downstream Flows
 * - The GitHub classifier/handler flow in the parent `GitHub Manager` agent consumes the vector index produced by this flow indirectly through retrieval components. It depends on the indexed documentation being present in the configured vector database.
 * - The specific consumable outcome is not the API response fields `message` or `records`, but the persisted vectors and metadata written by the `Index` node.
 *
 * ### External Services
 * - Documentation source website — fetched and converted to markdown content by the scraper — requires `credentials` selected in `Scraper` when authentication is needed
 * - Embedding model provider — generates vector embeddings for chunk text in `Vectorize` — requires `embeddingModelName`
 * - Vector database — stores vectors and metadata in `Index` — requires `vectorDB`
 * - Lamatic GraphQL/API trigger and response interface — receives the request and returns the flow response — no separate environment variable shown in this flow
 *
 * ### Environment Variables
 * - None explicitly referenced in this flow definition. Authentication and connector selection are provided through private input fields such as `credentials`, `embeddingModelName`, and `vectorDB` rather than named environment variables.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode` trigger) receives an invocation with a `url` field and starts the ingestion run. Its response mode is realtime, so the caller waits for indexing completion and receives a final status payload.
 *
 * 2. `Scraper` (`scraperNode`) fetches the page at `{{triggerNode_1.output.url}}` using the configured `credentials`. It is set to extract only main content, with a `10000` ms timeout and `1000` ms wait period, and produces markdown output intended to strip away boilerplate such as navigation-heavy page chrome.
 *
 * 3. `Chunking` (`chunkNode`) takes `{{scraperNode_823.output.markdown}}` and splits it into overlapping text chunks. It uses recursive character splitting with a target chunk size of `500` characters, `50` characters of overlap, and separators that prioritize paragraph and whitespace boundaries.
 *
 * 4. `Extract Chunks` (`codeNode`) runs the referenced script `@scripts/docs-ingestion_extract-chunks.ts`. In context, this script reshapes or extracts the chunk payload from the chunker output into the specific text array or structure expected by the embedding step.
 *
 * 5. `Vectorize` (`vectorizeNode`) embeds the transformed chunk text from `{{codeNode_158.output}}` using the selected `embeddingModelName`. This produces vector representations for each chunk so they can be stored and searched semantically later.
 *
 * 6. `Transform MetaData` (`codeNode`) runs `@scripts/docs-ingestion_transform-metadata.ts`. This step prepares the final indexing payload by aligning the vectors from the embedding step with metadata records, exposed as `output.vectors` and `output.metadata` for the indexer. The metadata is also shaped so that the configured primary key pattern `[URL]+[chunkidx]` can uniquely identify each stored chunk.
 *
 * 7. `Index` (`IndexNode`) writes `{{codeNode_512.output.vectors}}` and `{{codeNode_512.output.metadata}}` into the selected `vectorDB`. It uses `duplicateOperation` set to `overwrite`, meaning records with the same computed primary key are replaced rather than duplicated on re-ingestion.
 *
 * 8. `API Response` (`graphqlResponseNode`) returns a compact response object to the caller. It maps `IndexNode_824.output.message` to `message` and `IndexNode_824.output.recordsIndexed` to `records`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails at `Scraper` with an authentication or access error | `credentials` were not provided, are invalid, or the target site requires auth not covered by the selected credential | Verify the `credentials` input, confirm the target URL is reachable with those credentials, and re-run the flow |
 * | Flow returns few or zero indexed records | The scraper extracted little content, the page was mostly boilerplate, or the URL did not point to usable documentation | Check that the `url` points to a real documentation page, verify the page has meaningful main content, and inspect scraper behavior |
 * | Flow fails before vectorization | The `embeddingModelName` input was not selected or the selected model is unavailable to the workspace | Choose a valid embedding model configured for `embedder/text` and confirm model access |
 * | Flow fails at indexing | No `vectorDB` was configured, the connector is misconfigured, or the target database is unavailable | Select a valid vector database connection and confirm it is reachable and authorized |
 * | Successful scrape but poor retrieval quality later | Chunk sizes or extracted content structure may not match the documentation format well, producing weak semantic segments | Review the source content shape and, if needed, adjust chunking strategy or the transformation scripts in a future revision |
 * | Re-ingestion appears to replace earlier records | This is expected when the same `[URL]+[chunkidx]` primary key is generated and `duplicateOperation` is `overwrite` | Confirm whether overwrite behavior is desired; if versioned history is needed, change key strategy or duplicate handling |
 * | Downstream classifier flow cannot retrieve useful context | This flow has not been run yet, indexing failed silently upstream, or the wrong vector database is being queried downstream | Run or re-run this ingestion flow successfully, verify records were indexed, and ensure downstream retrieval uses the same vector store |
 * | Malformed or missing `url` input causes scrape failure | The trigger payload did not include a valid `url` field or the value is not a proper web URL | Validate trigger payloads before invocation and supply a fully qualified documentation URL |
 *
 * ## Notes
 * - The flow is designed for single-URL ingestion per invocation. Broader site crawling, recursion across many pages, or sitemap traversal are not defined in this flow itself.
 * - The response is intentionally minimal. Operators who need deeper diagnostics should inspect node-level outputs in Lamatic rather than relying on the API response alone.
 * - Because the scraper is configured with `onlyMainContent: true`, this flow favors clean technical text over full-page fidelity. That usually improves retrieval quality, but can omit useful sidebar or reference material on some docs sites.
 * - The indexing key strategy combines `URL` and `chunkidx`, which supports deterministic refreshes for the same page. If the source page structure changes substantially, chunk boundaries may shift and produce different record identities across runs.
 */

// Flow: docs-ingestion

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "DOCS Ingestion",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "scraperNode_823": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "description": "Select the credentials for scraper authentication.",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "vectorizeNode_295": [
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
  "IndexNode_824": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "description": "Select the vector database where the vectors will be indexed."
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
    "docs_ingestion_extract_chunks": "@scripts/docs-ingestion_extract-chunks.ts",
    "docs_ingestion_transform_metadata": "@scripts/docs-ingestion_transform-metadata.ts"
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
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "scraperNode_823",
    "data": {
      "logic": [],
      "nodeId": "scraperNode",
      "values": {
        "id": "scraperNode_823",
        "url": "{{triggerNode_1.output.url}}",
        "mobile": false,
        "timeout": "10000",
        "waitFor": "1000",
        "nodeName": "Scraper",
        "credentials": "",
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": true
  },
  {
    "id": "chunkNode_770",
    "data": {
      "logic": [],
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_770",
        "nodeName": "Chunking",
        "chunkField": "{{scraperNode_823.output.markdown}}",
        "numOfChars": 500,
        "separators": [
          "\n\n",
          " ",
          "\\n"
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 50
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "codeNode_158",
    "data": {
      "logic": [],
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_158",
        "code": "@scripts/docs-ingestion_extract-chunks.ts",
        "nodeName": "Extract Chunks"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "vectorizeNode_295",
    "data": {
      "logic": [],
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_295",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_158.output}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false
  },
  {
    "id": "codeNode_512",
    "data": {
      "logic": [],
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/docs-ingestion_transform-metadata.ts",
        "nodeName": "Transform MetaData"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "IndexNode_824",
    "data": {
      "logic": [],
      "nodeId": "IndexNode",
      "values": {
        "id": "IndexNode_824",
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": [
          "[URL]+[chunkidx]"
        ],
        "vectorsField": "{{codeNode_512.output.vectors}}",
        "metadataField": "{{codeNode_512.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": false
  },
  {
    "id": "graphqlResponseNode_532",
    "data": {
      "logic": [],
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"message\": \"{{IndexNode_824.output.message}}\",\n  \"records\": \"{{IndexNode_824.output.recordsIndexed}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 910
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_823",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "scraperNode_823",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "scraperNode_823-chunkNode_770",
    "type": "defaultEdge",
    "source": "scraperNode_823",
    "target": "chunkNode_770",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "chunkNode_770-codeNode_158",
    "type": "defaultEdge",
    "source": "chunkNode_770",
    "target": "codeNode_158",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_158-vectorizeNode_295",
    "type": "defaultEdge",
    "source": "codeNode_158",
    "target": "vectorizeNode_295",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_512-IndexNode_824",
    "type": "defaultEdge",
    "source": "codeNode_512",
    "target": "IndexNode_824",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_295-codeNode_512",
    "type": "defaultEdge",
    "source": "vectorizeNode_295",
    "target": "codeNode_512",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "IndexNode_824-graphqlResponseNode_532",
    "type": "defaultEdge",
    "source": "IndexNode_824",
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
  }
];

export default { meta, inputs, references, nodes, edges };
