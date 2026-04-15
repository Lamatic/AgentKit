/*
 * # 2. Embedded Search - Search
 * A retrieval flow that accepts a user search query from an embedded widget, searches both the PDF and website vector indexes in parallel, and returns a unified result set for the broader Embedded Search system.
 *
 * ## Purpose
 * This flow is responsible for the live retrieval step of the Embedded Search agent kit. Its job is to take an end-user query from the embedded search interface, run similarity search against the configured vector indexes, and produce UI-ready search results drawn from previously indexed PDFs and webpages. Rather than generating an answer or performing synthesis, it focuses on fast, grounded retrieval across the knowledge sources already ingested into the system.
 *
 * The outcome of this flow is a collated list of relevant search hits that can be rendered directly by the search widget. That matters because the wider agent pipeline depends on separate ingestion flows to create searchable embeddings first, and this flow is the runtime path that turns those stored embeddings back into useful end-user results. Without it, indexed content would exist in storage but would not be discoverable through the application.
 *
 * In the broader Embedded Search pipeline, this flow sits after indexation and before any downstream UI consumption. The parent kit uses dedicated flows to ingest PDFs and websites into vector storage, and a separate deletion flow to remove content when required. This search flow is therefore the retrieval layer in the overall ingest-store-search lifecycle: it assumes content has already been embedded and indexed, then performs query-time lookup across those stores and formats the results for presentation.
 *
 * ## When To Use
 * - Use when an end user submits a free-text query through the embedded search widget.
 * - Use when both PDF and website content have been indexed and you want a single search request to retrieve from both sources.
 * - Use when the application needs structured result cards rather than a synthesized natural-language answer.
 * - Use when you want retrieval grounded only in the project’s configured vector indexes, not a live crawl or general web search.
 * - Use when the goal is to surface the most relevant matching chunks or records from indexed content with low latency.
 *
 * ## When Not To Use
 * - Do not use when content has not yet been indexed; the PDF and website indexation flows must run first or this flow will return empty or incomplete results.
 * - Do not use to ingest new PDFs or webpages; the sibling indexation flows handle embedding and storage.
 * - Do not use to delete indexed resources; the resource deletion flow is the correct lifecycle operation.
 * - Do not use when the input is a file, URL list, or resource-management payload rather than a search query.
 * - Do not use when only one source type should be queried and the other vector index has not been configured; this flow is designed to branch into both searches.
 * - Do not use when the product expects generated summaries, answers, or reasoning over retrieved content; this flow returns search results, not synthesis.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `searchQuery` | `string` | Yes | The end-user’s search text submitted through the embedded search trigger widget. |
 *
 * Below the trigger-level input, the flow also requires private node configuration for both search branches:
 *
 * - `searchNode_842.vectorDB` — required vector database connection for the PDF search branch.
 * - `searchNode_842.embeddingModelName` — required embedding model used to encode the incoming query for PDF similarity search.
 * - `searchNode_145.vectorDB` — required vector database connection for the website search branch.
 * - `searchNode_145.embeddingModelName` — required embedding model used to encode the incoming query for website similarity search.
 *
 * Notable input assumptions and constraints:
 *
 * - The trigger expects a text query, not a file or structured ingestion payload.
 * - Both search nodes use the same incoming `searchQuery` value from `triggerNode_1.output.searchQuery`.
 * - Each search node is configured with a fixed `limit` of `5`, so each branch returns at most five matches before collation.
 * - Each search node is configured with a `certainty` threshold of `0.85`, which may suppress lower-similarity matches.
 * - Filters are currently configured as an empty list, so no metadata-level narrowing is applied inside this flow.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `title` | `string[]` | The title for each collated search result item returned by the flow. |
 * | `content` | `string[]` | The content snippet or body text for each collated search result item. |
 * | `link` | `string[]` | A link-like field mapped from each result’s `type` value by the response node configuration. |
 *
 * The response is returned as a list of result items emitted through the search response node. Internally, the `Collate Results` code node produces `codeNode_913.output.results`, and the response node maps fields from that list into UI-facing arrays. Each result is expected to include at least `title`, `content`, and `type`, though the response configuration uses `type` as the value for `link`, so consumers should verify how the associated widget interprets that field.
 *
 * Because each search branch is limited to five results, the final collated output is bounded by the combined branch outputs and any additional filtering or reshaping performed in the collation script. If neither branch finds sufficiently similar matches, the flow may return an empty result set.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `1A. Embedded Search - PDF Indexation` — must have already embedded and stored PDF content in the vector database used by `PDF DB Search`. This flow depends on that indexed vector data being present and queryable.
 * - `1B. Embedded Search - Website Indexation` — must have already embedded and stored webpage content in the vector database used by `Website DB Search`. This flow depends on that indexed vector data being present and queryable.
 * - This flow is an execution entry point for search requests at runtime, but it is not operationally standalone because it relies on prior indexation having populated the target vector stores.
 *
 * This flow does not directly consume named output fields from the upstream flows in its trigger payload. Instead, it relies on the persisted side effect those flows produced: searchable vectors and metadata already written into the configured vector databases.
 *
 * ### Downstream Flows
 * - No other Lamatic flow is shown as a downstream consumer of this flow’s output.
 * - The primary downstream consumer is the embedded application UI, which reads the response payload fields `title`, `content`, and `link` to render search results.
 * - Operationally, this flow feeds the user experience rather than chaining into another orchestration flow.
 *
 * ### External Services
 * - Vector database connector for `PDF DB Search` — used to run similarity search over indexed PDF embeddings — required credential depends on the selected `vectorDB` connection.
 * - Vector database connector for `Website DB Search` — used to run similarity search over indexed website embeddings — required credential depends on the selected `vectorDB` connection.
 * - Embedding model for `PDF DB Search` — used to embed the incoming search query into vector space — requires the provider credentials associated with the selected `embeddingModelName`.
 * - Embedding model for `Website DB Search` — used to embed the incoming search query into vector space — requires the provider credentials associated with the selected `embeddingModelName`.
 * - Search widget trigger configuration — used to receive search input from the embedded UI domain/widget setup — deployed as a Lamatic trigger resource.
 *
 * ### Environment Variables
 * - `EMBEDDED_SEARCH_SEARCH` — deployment/runtime reference for this search flow in the application integration — used outside the flow for invoking the deployed flow endpoint.
 * - `LAMATIC_API_URL` — Lamatic API base URL for application-side invocation of the deployed flow — used by the calling application rather than a specific node inside this flow.
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated invocation — used by the calling application rather than a specific node inside this flow.
 * - `LAMATIC_API_KEY` — Lamatic API credential for authenticated invocation — used by the calling application rather than a specific node inside this flow.
 *
 * In addition, the selected `vectorDB` and `embeddingModelName` configurations typically rely on provider-specific secrets managed in Lamatic. Those secret names are not exposed in this flow source, so they cannot be enumerated precisely here.
 *
 * ## Node Walkthrough
 * 1. `Search Widget` (`triggerNode`)
 *    - This is the entry point for the flow. It receives the user’s search text from the embedded search widget configuration referenced by `@triggers/widgets/embedded-search-search_search-widget.ts`.
 *    - The trigger produces `triggerNode_1.output.searchQuery`, which becomes the shared input for both retrieval branches.
 *    - The widget configuration also defines the domains and search settings that allow the front-end experience to call this flow.
 *
 * 2. `Branching` (`branchNode`)
 *    - This node fans the single incoming search request into two parallel execution paths.
 *    - `Branch 1` routes the query to the PDF vector search path.
 *    - `Branch 2` routes the same query to the website vector search path.
 *    - There is no conditional filtering logic here beyond explicit branch fan-out; the intent is to search both indexes for every query.
 *
 * 3. `PDF DB Search` (`dynamicNode` using `searchNode`)
 *    - This branch searches the PDF-oriented vector database configured through the private `vectorDB` input on `searchNode_842`.
 *    - It embeds the incoming query using the selected `embeddingModelName` and performs similarity search using `triggerNode_1.output.searchQuery` as the `searchQuery`.
 *    - The node is configured with `limit` `5`, `certainty` `0.85`, and no metadata filters, so it returns up to five PDF matches that meet the similarity threshold.
 *
 * 4. `Website DB Search` (`dynamicNode` using `searchNode`)
 *    - This branch performs the same retrieval pattern against the website-oriented vector database configured through the private `vectorDB` input on `searchNode_145`.
 *    - It also embeds the same incoming search query with its configured `embeddingModelName` and searches with `limit` `5`, `certainty` `0.85`, and no filters.
 *    - The result is up to five website matches meeting the threshold.
 *
 * 5. `Collate Results` (`dynamicNode` using `codeNode`)
 *    - This node receives outputs from both search branches and combines them into a single result structure.
 *    - The implementation is stored in `@scripts/embedded-search-search_collate-results.ts`, which is responsible for normalizing, merging, and preparing the branch outputs into `codeNode_913.output.results`.
 *    - This is the step that makes the dual-source search appear as one unified response to the caller.
 *
 * 6. `Search Response` (`responseNode`)
 *    - This node maps the collated result list into the flow’s response schema for the embedded widget or calling client.
 *    - It reads `codeNode_913.output.results[:].title` into the response `title` field and `codeNode_913.output.results[:].content` into the response `content` field.
 *    - It maps `codeNode_913.output.results[:].type` into the response `link` field, which is an important implementation detail for consumers to understand.
 *    - The final payload is returned to the client as the UI-ready search response.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before search executes | The deployed application is missing `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, or the `EMBEDDED_SEARCH_SEARCH` flow reference | Verify the application environment variables from the Lamatic deployment and redeploy with the correct values. |
 * | Search branch errors on startup | `vectorDB` is not configured for `PDF DB Search` or `Website DB Search` | Configure the required vector database connection for each search node in Lamatic and ensure the selected connector is valid. |
 * | Search branch errors when embedding the query | `embeddingModelName` is not configured or provider credentials are invalid | Select a valid embedding model for each search node and confirm the backing provider credentials are available in Lamatic. |
 * | Flow returns no results | No indexed content exists yet, the certainty threshold is too strict, or the query does not match stored content | Run the PDF and/or website indexation flows first, confirm vectors were written to the expected stores, and consider whether the configured threshold is too restrictive. |
 * | Only PDF or only website results appear | One upstream indexation path has not run successfully, or one vector store points to the wrong collection/index | Validate that both indexation flows completed successfully and that each search node targets the correct vector database/index. |
 * | Results appear malformed in the UI | The collation script output shape does not match what the response node expects, or the UI assumes `link` contains a URL while the flow maps it from `type` | Inspect `embedded-search-search_collate-results.ts`, verify each result has `title`, `content`, and `type`, and align the front-end field expectations with the response mapping. |
 * | Trigger receives an empty or invalid query | The embedded widget submitted a blank query or the caller payload does not populate `searchQuery` correctly | Add client-side validation for non-empty search text and confirm the trigger integration passes the expected field. |
 * | Search succeeds but misses expected documents | The source documents were deleted, indexed into a different store, or indexed with incompatible embeddings | Confirm that the correct vector store is being queried, that the resources still exist, and that ingestion and search use compatible embedding configuration. |
 * | Upstream flow was assumed to have run but data is absent | PDF or website indexation never completed or wrote to a different environment/project | Re-run the upstream indexation flows in the same Lamatic project/environment that this search flow uses. |
 *
 * ## Notes
 * - This flow intentionally performs retrieval only. It does not rank with an LLM, summarize, answer questions, or synthesize across results.
 * - Both search branches are always executed from the branch node, which is appropriate for broad cross-source retrieval but may add unnecessary latency if one source type is unused.
 * - The fixed `limit` of `5` per branch means the merged result set is inherently capped before collation.
 * - The fixed `certainty` value of `0.85` favors precision over recall; this can improve result quality but may cause sparse or empty responses for shorter or noisier queries.
 * - The response node’s mapping of `link` from result `type` is unusual and should be treated as an implementation-specific contract, not a guaranteed URL field.
 * - The exact merge, deduplication, and ordering behavior depends on `embedded-search-search_collate-results.ts`; if result ranking looks unexpected, inspect that script first.
 */

// Flow: embedded-search-search

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "2. Embedded Search - Search",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "searchNode_842": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "searchNode_145": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
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
    "embedded_search_search_collate_results": "@scripts/embedded-search-search_collate-results.ts"
  },
  "triggers": {
    "embedded_search_search_search_widget": "@triggers/widgets/embedded-search-search_search-widget.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "searchTriggerNode",
      "values": {
        "search": "",
        "domains": "@triggers/widgets/embedded-search-search_search-widget.ts",
        "nodeName": "Search Widget",
        "searchConfig": "@triggers/widgets/embedded-search-search_search-widget.ts"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "searchResponseNode",
      "values": {
        "tab": "",
        "link": "{{codeNode_913.output.results[:].type}}",
        "group": "",
        "title": "{{codeNode_913.output.results[:].title}}",
        "content": "{{codeNode_913.output.results[:].content}}",
        "nodeName": "Search Response",
        "referenceLink": "",
        "referenceText": "",
        "breadcrumpsField": ""
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_913",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-search-search_collate-results.ts",
        "nodeName": "Collate Results"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 450
    },
    "selected": true
  },
  {
    "id": "branchNode_437",
    "data": {
      "label": "Branch",
      "modes": [],
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_437-addNode_203"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_437-addNode_432"
          }
        ],
        "nodeName": "Branching"
      }
    },
    "type": "branchNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 150
    }
  },
  {
    "id": "searchNode_842",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "limit": 5,
        "filters": "[]",
        "nodeName": "PDF DB Search",
        "vectorDB": "",
        "certainty": "0.85",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
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
      "y": 300
    },
    "selected": false
  },
  {
    "id": "searchNode_145",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "limit": 5,
        "filters": "[]",
        "nodeName": "Website DB Search",
        "vectorDB": "",
        "certainty": "0.85",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 300
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "codeNode_913-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_913",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-branchNode_437",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "branchNode_437",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_437-searchNode_842-654",
    "data": {
      "condition": "Branch 1",
      "branchName": "Branch 1"
    },
    "type": "branchEdge",
    "source": "branchNode_437",
    "target": "searchNode_842",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_437-searchNode_145-519",
    "data": {
      "condition": "Branch 2",
      "branchName": "Branch 2"
    },
    "type": "branchEdge",
    "source": "branchNode_437",
    "target": "searchNode_145",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_842-codeNode_913-817",
    "type": "defaultEdge",
    "source": "searchNode_842",
    "target": "codeNode_913",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_145-codeNode_913-402",
    "type": "defaultEdge",
    "source": "searchNode_145",
    "target": "codeNode_913",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
