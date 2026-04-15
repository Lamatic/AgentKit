/*
 * # Multi Vector Search
 * A parallel retrieval flow that accepts a single website search query, fans it out across multiple vector searches, and returns one consolidated result set for direct use in the broader multi-source search system.
 *
 * ## Purpose
 * This flow is responsible for solving a common retrieval problem: relevant content is distributed across multiple vector databases or indexes, but the caller needs a single search experience. Instead of forcing a frontend or backend service to call several retrievers independently and merge the outputs itself, this flow centralizes that orchestration inside Lamatic. It receives one query, executes multiple vector searches in parallel, and combines their outputs into a unified response.
 *
 * The outcome is an aggregated search result payload that can be rendered immediately in a website search UI. This matters because it improves recall across distributed knowledge sources while keeping invocation simple for the caller. It also creates a single operational point for tuning search parameters such as result limits, certainty thresholds, and merge logic.
 *
 * Within the broader agent architecture, this flow acts as an entry-point retrieval flow. Based on the parent agent context, it sits in the retrieve stage of the chain: a web UI or backend submits the user query, this flow performs coordinated retrieval across multiple vector backends, and the resulting unified hits can then be rendered directly or passed into later ranking, answer generation, or synthesis steps outside this template.
 *
 * ## When To Use
 * - Use when a user submits a free-text website or application search query and relevant content may exist in more than one vector database.
 * - Use when you want a single search endpoint for multiple semantic indexes rather than issuing separate retrieval calls from the client.
 * - Use when low latency matters and parallel fan-out across retrievers is preferable to sequential querying.
 * - Use when your system needs a consolidated result list suitable for direct rendering in a search results component.
 * - Use when you are building a multi-retriever architecture and want Lamatic to own the branching and merge logic.
 *
 * ## When Not To Use
 * - Do not use when your content lives in only one vector database and no cross-source aggregation is needed.
 * - Do not use when the caller does not provide a search query or provides a non-search payload such as a document, image, or structured record.
 * - Do not use when the vector databases for the `Vector Search` nodes have not been configured; the flow structure exists, but retrieval cannot succeed without those backend bindings.
 * - Do not use when you need deterministic keyword or SQL-style filtering only; a different search flow may be more appropriate if semantic retrieval is not desired.
 * - Do not use when a sibling flow already handles downstream answer synthesis, summarization, or agent reasoning and expects raw retrieval to happen elsewhere.
 * - Do not use as a continuation step that depends on an upstream planning flow; this template is designed as a direct trigger-driven retrieval entry point.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `searchQuery` | `string` | Yes | The end-user search text captured by the `SearchBar` trigger and passed to all vector search branches. |
 *
 * The trigger configuration exposed in the flow source only references `searchQuery` directly. No additional public trigger inputs are encoded in this flow. The query is assumed to be plain text suitable for semantic embedding and vector retrieval. The flow does not show explicit length checks, language validation, or sanitization steps, so callers should avoid empty strings and extremely malformed input.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `title` | `string[]` | Titles of the consolidated search results, sourced from `codeNode_156.output.results[:].title` and returned by the `Search Response` node. |
 * | `content` | `string[]` | Content snippets or bodies of the consolidated search results, sourced from `codeNode_156.output.results[:].content` and returned by the `Search Response` node. |
 *
 * The response is a structured search result payload shaped by the `Search Response` node rather than a prose answer. It returns parallel lists of result fields for UI rendering. The flow source does not map a `link` value into the response, even though the response node supports one, so consumers should not assume URLs are present unless the flow is extended. Completeness depends on the configured vector stores, their indexed content, the merge script behavior, and the certainty thresholds applied in each branch.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone, trigger-driven entry-point flow.
 * - In the wider system, it is invoked directly by a website UI or backend service through the `SearchBar` trigger rather than by another Lamatic flow.
 *
 * ### Downstream Flows
 * - No downstream Lamatic flow is defined in the provided source.
 * - In deployment, the most likely consumer is a website search interface or application backend that reads the returned `title` and `content` fields and renders them directly.
 * - If extended into a larger pipeline, downstream components would typically consume the consolidated result fields from `codeNode_156` or the final response payload for ranking, answer generation, or synthesis.
 *
 * ### External Services
 * - Search bar widget trigger — captures user search input from a website or UI surface — configured through `@triggers/widgets/multi-vector-search_searchbar.ts`
 * - Vector database backend for `searchNode_147` — semantic retrieval for branch 1 — credential depends on the selected vector store configuration
 * - Vector database backend for `searchNode_549` — semantic retrieval for branch 2 — credential depends on the selected vector store configuration
 * - Vector database backend for `searchNode_795` — semantic retrieval for branch 3 — credential depends on the selected vector store configuration
 * - Embedding model used by each `Vector Search` node — transforms the query for semantic search if required by the configured backend — credential depends on the chosen model/provider
 * - Merge script `@scripts/multi-vector-search_combine-results.ts` — consolidates outputs from all search branches — no standalone credential shown in the flow source
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Credentials are still likely required by the configured vector database connectors and any embedding model provider used inside the three `Vector Search` nodes.
 * - The specific variable names depend on which vector store and model integrations are selected when the flow is configured in Lamatic.
 *
 * ## Node Walkthrough
 * 1. `SearchBar` (`triggerNode`) receives the end-user query and starts the flow. Its output exposes `searchQuery`, which becomes the shared input for every retrieval branch.
 * 2. `Branching` (`branchNode`) immediately fans out execution into three parallel paths. This is the orchestration point that allows all vector lookups to run concurrently instead of one after another.
 * 3. The first unnamed `addNode` on branch 1, `addNode_801` (`addNode`), serves as a structural branch handoff. It does not expose business logic in the source, but it anchors the first branch before search execution.
 * 4. The second unnamed `addNode` on branch 2, `addNode_475` (`addNode`), serves the same structural role for the second parallel branch.
 * 5. The third unnamed `addNode` on branch 3, `addNode_677` (`addNode`), serves the same structural role for the third parallel branch.
 * 6. `Vector Search` (`searchNode_147`) executes the first semantic search against its configured vector backend using `{{triggerNode_1.output.searchQuery}}` as the query. It is configured with a `limit` of `10` and a `certainty` threshold of `0.9`.
 * 7. `Vector Search` (`searchNode_549`) executes the second semantic search in parallel, also using the same `searchQuery`, with a `limit` of `10` and a `certainty` threshold of `0.9`.
 * 8. `Vector Search` (`searchNode_795`) executes the third semantic search in parallel, using the same `searchQuery`, with a `limit` of `10` and a slightly looser `certainty` threshold of `0.8`.
 * 9. `addNode_615` (`addNode`) receives the output of the first search branch and stages it for aggregation with the other branches.
 * 10. `addNode_418` (`addNode`) receives the output of the second search branch and stages it for aggregation.
 * 11. `addNode_627` (`addNode`) receives the output of the third search branch and stages it for aggregation.
 * 12. `addNode_517` (`addNode`) acts as the convergence point for all three branch outputs. It collects the staged search results so that a single downstream node can process them together.
 * 13. `Combine Results` (`dynamicNode`) runs the referenced script `@scripts/multi-vector-search_combine-results.ts` to consolidate the three result sets into one `results` collection. The exact merge policy is defined in that script, but from the flow design its purpose is to combine parallel retrieval outputs into a unified list for response formatting.
 * 14. `Search Response` (`dynamicNode`) formats the final API response sent back through the trigger response edge. It maps `codeNode_156.output.results[:].title` into `title` and `codeNode_156.output.results[:].content` into `content` for client consumption.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | No results returned for an obviously valid query | One or more vector stores are empty, misconfigured, or using overly strict certainty thresholds | Verify each `Vector Search` node is bound to the intended vector database, confirm the indexes contain data, and consider lowering the certainty threshold where appropriate |
 * | Only a subset of expected sources appears in the final response | One branch failed, was left unconfigured, or returned zero matches before aggregation | Test each search branch independently, ensure all three vector backends are configured, and inspect the combine script behavior for how it handles empty inputs |
 * | Flow invocation fails before search executes | The trigger payload is missing `searchQuery` or the input is malformed | Ensure the caller sends a non-empty text query through the `SearchBar` trigger and validate input before invoking the flow |
 * | Search nodes error with authentication or connector failures | Required credentials for the configured vector database or embedding provider are missing or invalid | Add the correct secrets in Lamatic for the selected connectors and verify the credentials by testing each `Vector Search` node |
 * | Final response shape is missing links or other metadata | The `Search Response` node only maps `title` and `content`, while `link` is left blank in this template | Extend the merge script and response mapping if the UI requires URLs, breadcrumbs, scores, or source metadata |
 * | Results feel inconsistent across branches | Each branch may point to a different index, schema, or embedding setup, and one branch uses a different certainty threshold | Standardize indexing strategy across stores where possible and review whether the asymmetric `0.9` versus `0.8` thresholds are intentional |
 * | Aggregation step fails or returns malformed combined output | The referenced `Combine Results` script has logic errors or does not match the shape emitted by the search nodes | Inspect and test `@scripts/multi-vector-search_combine-results.ts`, then align its expected input schema with the actual outputs of the three searches |
 * | An orchestrated caller expects upstream planning context that is not present | This flow is standalone and does not consume outputs from any prior Lamatic flow | Route requests here only when direct retrieval is appropriate, or add an upstream planning flow and explicit input mappings if broader orchestration is needed |
 *
 * ## Notes
 * - The template contains three parallel search branches, but the `vectorDB` field is blank in all three `Vector Search` nodes in the source provided. The flow must be configured with actual vector backends before it can operate in production.
 * - The three branches all use the same `searchQuery`, so this design is optimized for querying multiple stores with one semantic intent, not for query rewriting or per-source prompt specialization.
 * - Branch 3 uses a lower `certainty` threshold than the other two branches. This may be intentional to widen recall from one source, but it can also introduce uneven relevance if left unexplained.
 * - The flow returns search-oriented fields, not a synthesized natural-language answer. If your product needs answer generation, add a downstream synthesis step that consumes the consolidated results.
 * - Because the combine logic is delegated to an external script reference, ranking, de-duplication, and source attribution behavior should be treated as implementation-specific until that script is reviewed alongside this flow.
 */

// Flow: multi-vector-search

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Multi Vector Search",
  "description": "This flow integrates vector search into your website, allowing you to combine results from multiple vector databases and run parallel searches. It then consolidates the results and returns them to users.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/multi-vector-search",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "multi_vector_search_combine_results": "@scripts/multi-vector-search_combine-results.ts"
  },
  "triggers": {
    "multi_vector_search_searchbar": "@triggers/widgets/multi-vector-search_searchbar.ts"
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
      "nodeId": "searchTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "SearchBar",
        "domains": "@triggers/widgets/multi-vector-search_searchbar.ts"
      }
    }
  },
  {
    "id": "codeNode_156",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Combine Results",
        "code": "@scripts/multi-vector-search_combine-results.ts"
      }
    }
  },
  {
    "id": "branchNode_805",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "nodeName": "Branching",
        "branches": [
          {
            "label": "Branch 1",
            "value": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj202"
          },
          {
            "label": "Branch 2",
            "value": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj504"
          },
          {
            "label": "Branch 3",
            "value": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj615"
          }
        ]
      }
    }
  },
  {
    "id": "addNode_517",
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
    "id": "addNode_615",
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
    "id": "addNode_418",
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
    "id": "addNode_627",
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
    "id": "addNode_801",
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
    "id": "addNode_475",
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
    "id": "addNode_677",
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
    "id": "searchNode_147",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "nodeName": "Vector Search",
        "limit": "10",
        "vectorDB": "",
        "certainty": ".9",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "searchNode_549",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "nodeName": "Vector Search",
        "limit": "10",
        "vectorDB": "",
        "certainty": ".9",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "searchNode_795",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "nodeName": "Vector Search",
        "limit": "10",
        "vectorDB": "",
        "certainty": ".8",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "searchResponseNode_353",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchResponseNode",
      "values": {
        "nodeName": "Search Response",
        "link": "",
        "title": "{{codeNode_156.output.results[:].title}}",
        "content": "{{codeNode_156.output.results[:].content}}",
        "breadcrumpsField": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "addNode_517-codeNode_156",
    "source": "addNode_517",
    "target": "codeNode_156",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-branchNode_805",
    "source": "triggerNode_1",
    "target": "branchNode_805",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj202",
    "source": "branchNode_805",
    "target": "addNode_801",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "branchName": "Branch 1"
    },
    "type": "branchEdge"
  },
  {
    "id": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj504",
    "source": "branchNode_805",
    "target": "addNode_475",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "branchName": "Branch 2"
    },
    "type": "branchEdge"
  },
  {
    "id": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj615",
    "source": "branchNode_805",
    "target": "addNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "branchName": "Branch 3"
    },
    "type": "branchEdge"
  },
  {
    "id": "addNode_615-addNode_517",
    "source": "addNode_615",
    "target": "addNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_418-addNode_517",
    "source": "addNode_418",
    "target": "addNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_627-addNode_517",
    "source": "addNode_627",
    "target": "addNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_147-addNode_615",
    "source": "searchNode_147",
    "target": "addNode_615",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_549-addNode_418",
    "source": "searchNode_549",
    "target": "addNode_418",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_795-addNode_627",
    "source": "searchNode_795",
    "target": "addNode_627",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_801-searchNode_147",
    "source": "addNode_801",
    "target": "searchNode_147",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_475-searchNode_549",
    "source": "addNode_475",
    "target": "searchNode_549",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_677-searchNode_795",
    "source": "addNode_677",
    "target": "searchNode_795",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_156-searchResponseNode_353",
    "source": "codeNode_156",
    "target": "searchResponseNode_353",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-searchResponseNode_353",
    "source": "triggerNode_1",
    "target": "searchResponseNode_353",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
