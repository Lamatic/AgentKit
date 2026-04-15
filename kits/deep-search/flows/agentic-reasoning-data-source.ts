/*
 * # Agentic Reasoning - Data Source Search
 * A retrieval flow that turns planned research steps into internal vector database searches and returns collated evidence for downstream answer synthesis.
 *
 * ## Purpose
 * This flow is responsible for searching an indexed internal data source when a research run needs grounded evidence from organization-specific documents rather than, or in addition to, public web content. It takes a set of research steps, expands them into individual search queries through a structured LLM pass, runs each query against a configured vector database, and merges the resulting matches into a single research artifact.
 *
 * The outcome is a compact but evidence-oriented payload containing retrieved research text and associated links. That matters because the wider deep-search pipeline is designed to answer from gathered evidence, not directly from the user question alone. By isolating internal retrieval into its own flow, the kit can search private indexed knowledge consistently and feed the synthesis stage with references that are traceable back to indexed content.
 *
 * Within the broader plan-retrieve-synthesize chain, this flow sits in the retrieval layer. A planning flow first turns the user’s question into actionable steps. This flow then uses those steps to search internal indexed documents. Its outputs are typically consumed by the final synthesis flow, alongside or instead of outputs from the sibling web-search flow, to produce the final answer.
 *
 * ## When To Use
 * - Use when the research task should consult internal or indexed organizational content such as product docs, deployment guides, infrastructure notes, or project documentation.
 * - Use when an upstream planning step has already produced research `steps` that can be converted into targeted retrieval queries.
 * - Use when a vector index has been configured and populated from supported data sources such as cloud drives, document repositories, storage systems, or databases.
 * - Use when the final answer must be grounded in private knowledge sources rather than relying only on public search.
 * - Use when you want a structured evidence payload that can be merged into a downstream answer-synthesis flow.
 *
 * ## When Not To Use
 * - Do not use when the system needs current public internet information; use the sibling web-search retrieval flow instead.
 * - Do not use when no internal vector database has been configured or indexed; retrieval will not be meaningful.
 * - Do not use when the caller only has a raw user `query` and has not yet produced research `steps`; run the planning flow first.
 * - Do not use when the task is to generate a final natural-language answer; this flow retrieves evidence but does not synthesize the final response.
 * - Do not use when the input is non-textual or cannot reasonably be transformed into document search queries.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `steps` | `string` | Yes | A textual set of research steps or retrieval instructions that describes what should be looked up in the indexed data source. |
 *
 * Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).
 *
 * The trigger-facing input implied by the flow is `steps`, as shown by the built-in test input and by the way the first LLM node is used to derive search queries. The flow assumes `steps` is readable natural language and specific enough for an LLM to decompose into one or more search queries. There is no explicit schema validation on the trigger node, so malformed, empty, or overly vague text may still enter the flow and degrade retrieval quality.
 *
 * Although not supplied by the caller as business inputs, the flow also requires node configuration inputs at deployment time: `generativeModelName` for the `Generate JSON` node, and `vectorDB` plus `embeddingModelName` for the `Vector Search` node. These are mandatory operational prerequisites.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `research` | `string` or structured text | Collated retrieval content assembled from the vector-search results across all generated queries. |
 * | `links` | `array` or link collection | References associated with the retrieved results, intended for downstream grounding or citation. |
 *
 * Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.
 *
 * The API response is a small object with two top-level fields: `research` and `links`. `research` is produced by a collation script after all looped searches complete, so it should be treated as an aggregated research artifact rather than the raw output of a single search hit. `links` is a companion collection of references extracted during collation.
 *
 * Because each query is limited to three vector hits and the search certainty is set to `0.6`, the output is intentionally selective rather than exhaustive. Completeness depends on query quality, index coverage, and the behavior of the collation script. If no good matches are found, the flow may still return a structurally valid but sparse result.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `agentic-reasoning-generate-steps` typically runs before this flow in the broader pipeline.
 *   - It produces a planned set of research actions from the original user `query`.
 *   - This flow conceptually consumes that plan as its trigger input `steps`.
 * - This flow is not a standalone planning entry point in the full research workflow, even though it is directly invokable by API.
 *
 * ### Downstream Flows
 * - `agentic-reasoning-final` is the primary downstream consumer in the kit’s overall architecture.
 *   - It uses `research` as grounded retrieval context for answer synthesis.
 *   - It may also use `links` to preserve provenance, citations, or reference trails in the final answer.
 * - Depending on the orchestrator, the output of this flow may be merged with the sibling web-search flow before final synthesis.
 *
 * ### External Services
 * - Lamatic GraphQL/API trigger-response runtime — receives the request and returns the final payload — required Lamatic project/API credentials
 * - Configured text generation model — used by `Generate JSON` to transform `steps` into structured search queries — credential depends on the selected provider and deployed model configuration
 * - Configured embedding model — used by `Vector Search` to embed each generated query for vector retrieval — credential depends on the selected provider and deployed model configuration
 * - Vector database / Lamatic indexed data source — used by `Vector Search` to retrieve relevant indexed documents — requires a configured `vectorDB` connection in the deployment
 *
 * ### Environment Variables
 * - `AGENTIC_REASONING_DATA_SOURCE` — flow identifier used by external callers or orchestrators to invoke this flow — outside the flow runtime but required for integration
 * - `LAMATIC_API_URL` — base URL for invoking Lamatic-hosted flows — used by external callers that execute this flow
 * - `LAMATIC_PROJECT_ID` — Lamatic project scoping for flow invocation — used by external callers that execute this flow
 * - `LAMATIC_API_KEY` — authentication for Lamatic API calls — used by external callers that execute this flow
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode` trigger)
 *    - This node starts the flow when a caller invokes the Lamatic API endpoint for this flow.
 *    - It accepts the incoming request payload, which in practice should contain `steps`, and makes that payload available to downstream nodes.
 *    - The response type is configured as realtime, so the caller receives the final result synchronously once downstream processing completes.
 *
 * 2. `Generate JSON` (`InstructorLLMNode`)
 *    - This node uses a configured instructor-capable text model plus the shared JSON-generation system prompt and a flow-specific user prompt.
 *    - Its job is to convert the incoming research `steps` into a structured object with a `queries` array.
 *    - The schema requires `queries` to be an array of strings, each representing an individual retrieval query the flow should run against the vector index.
 *    - This is the query-planning bridge inside the retrieval flow: it refines broad steps into concrete search strings.
 *
 * 3. `Loop` (`forLoopNode`)
 *    - This node iterates over `{{InstructorLLMNode_445.output.queries}}`.
 *    - The loop is configured to iterate over a list, exposing each query as `currentValue` for downstream processing.
 *    - Although loop metadata includes numeric fields such as `initialValue`, `increment`, and `endValue`, the effective behavior here is list iteration over generated queries rather than a manual counter loop.
 *
 * 4. `Vector Search` (`searchNode`)
 *    - For each loop iteration, this node runs a vector similarity search using the current query string from `{{forLoopNode_351.output.currentValue}}`.
 *    - It searches the configured `vectorDB` with the selected `embeddingModelName`.
 *    - The search returns up to `3` matches per query and applies a certainty threshold of `0.6`.
 *    - No explicit metadata filters are configured, so retrieval spans the accessible contents of the selected index.
 *
 * 5. `Loop End` (`forLoopEndNode`)
 *    - This node closes the iteration cycle and returns control to the loop until all generated queries have been searched.
 *    - Once the list is exhausted, execution continues to the collation stage.
 *
 * 6. `Collate Results` (`codeNode`)
 *    - This node runs the script `agentic-reasoning-data-source_collate-results.ts`.
 *    - It takes the accumulated results from all vector-search iterations and merges them into the final `research` and `links` outputs.
 *    - This is where duplicate hits, formatting, and result assembly are likely normalized before response mapping.
 *
 * 7. `API Response` (`graphqlResponseNode`)
 *    - This node returns the final payload to the caller.
 *    - It maps `{{codeNode_909.output.research}}` to `research` and `{{codeNode_909.output.links}}` to `links`.
 *    - No retries are configured, so the returned response reflects the immediate success or failure state of the preceding nodes.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails before retrieval starts | `generativeModelName` is not configured for `Generate JSON` | Configure a valid instructor-capable text generation model in the flow inputs and redeploy. |
 * | Vector search node errors immediately | `vectorDB` or `embeddingModelName` is missing or invalid | Attach a valid vector database connection and embedding model to `Vector Search`, then retest. |
 * | Response returns empty or weak `research` | The incoming `steps` text is vague, too broad, or not aligned with indexed content | Provide more specific steps, improve the upstream planning prompt, or verify that the index contains the relevant documents. |
 * | Response contains no useful links | The collation script received empty search hits or could not extract references | Check whether vector retrieval returned documents, then inspect the collation script behavior and result schema. |
 * | Retrieval quality is poor | The generated queries from `Generate JSON` are low quality or the certainty threshold/limit is too restrictive | Improve the LLM prompt, tune the index, or adjust search settings such as hit limit and certainty if appropriate. |
 * | Caller cannot invoke the flow | External Lamatic environment variables such as `AGENTIC_REASONING_DATA_SOURCE`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, or `LAMATIC_API_KEY` are missing | Populate the required environment variables in the calling application or deployment environment. |
 * | Flow is invoked with a raw user question instead of research steps | The upstream planning flow did not run, or orchestration routed the wrong payload shape | Run `agentic-reasoning-generate-steps` first and pass its planning output into this flow as `steps`. |
 * | Flow returns no results even though documents exist | The internal data source has not been indexed correctly or the wrong vector database was selected | Rebuild or verify the index, confirm connector ingestion succeeded, and ensure the flow points to the correct `vectorDB`. |
 *
 * ## Notes
 * - The flow performs retrieval only; it does not rank evidence against final answer quality beyond the vector search and collation steps.
 * - The per-query result limit of `3` makes the flow efficient but may omit relevant long-tail documents for broad research tasks.
 * - No explicit metadata filters are applied in `Vector Search`, so tenant, source-type, or collection-level scoping must be handled by the chosen index configuration rather than by this flow definition.
 * - The exact structure of `research` and `links` is finalized by the collation script, so downstream consumers should rely on the mapped response fields rather than assumptions about intermediate node outputs.
 * - This flow is directly invokable through Lamatic’s GraphQL/API pattern, but in production it is best treated as an internal retrieval component in the larger deep-research orchestration.
 */

// Flow: agentic-reasoning-data-source

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning - Data Source Search",
  "description": "This flow searches the indexed data source and returns the most relevant references",
  "tags": "",
  "testInput": {
    "steps": "I want to search the documents of how lamatic works, it's deployment process, infrastructure, and how projects are deployed and with this, design the final answer for user query"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_445": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "searchNode_278": [
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
  "prompts": {
    "generate_json_system": "@prompts/generate-json-system.md",
    "agentic_reasoning_data_source_generate_json_user": "@prompts/agentic-reasoning-data-source_generate-json_user.md"
  },
  "modelConfigs": {
    "agentic_reasoning_data_source_generate_json": "@model-configs/agentic-reasoning-data-source_generate-json.ts"
  },
  "scripts": {
    "agentic_reasoning_data_source_collate_results": "@scripts/agentic-reasoning-data-source_collate-results.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
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
    "id": "InstructorLLMNode_445",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"queries\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"required\": true\n      },\n      \"description\": \"This is the collection of queries based on which the research will be prepared\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-reasoning-data-source_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/agentic-reasoning-data-source_generate-json.ts",
        "messages": "@model-configs/agentic-reasoning-data-source_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/agentic-reasoning-data-source_generate-json.ts",
        "generativeModelName": "@model-configs/agentic-reasoning-data-source_generate-json.ts"
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
    "selected": false
  },
  {
    "id": "forLoopNode_351",
    "data": {
      "label": "forLoopNode node",
      "modes": {},
      "nodeId": "forLoopNode",
      "values": {
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_384",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{InstructorLLMNode_445.output.queries}}"
      }
    },
    "type": "forLoopNode",
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
    "id": "searchNode_278",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "limit": "3",
        "filters": "[]",
        "nodeName": "Vector Search",
        "vectorDB": "",
        "certainty": "0.6",
        "searchQuery": "{{forLoopNode_351.output.currentValue}}",
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
      "y": 390
    },
    "selected": false
  },
  {
    "id": "forLoopEndNode_384",
    "data": {
      "label": "forLoopEndNode node",
      "modes": {},
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_351"
      }
    },
    "type": "forLoopEndNode",
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
    "id": "codeNode_909",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-reasoning-data-source_collate-results.ts",
        "nodeName": "Collate Results"
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
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"research\": \"{{codeNode_909.output.research}}\",\n  \"links\": \"{{codeNode_909.output.links}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_445",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_445",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_445-forLoopNode_351-649",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_445",
    "target": "forLoopNode_351",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_351-searchNode_278-841",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_351",
    "target": "searchNode_278",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_278-forLoopEndNode_384-659",
    "type": "defaultEdge",
    "source": "searchNode_278",
    "target": "forLoopEndNode_384",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_384-codeNode_909",
    "type": "defaultEdge",
    "source": "forLoopEndNode_384",
    "target": "codeNode_909",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_909-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_909",
    "target": "responseNode_triggerNode_1",
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
  },
  {
    "id": "forLoopNode_351-forLoopEndNode_384-454",
    "data": {
      "condition": "Loop"
    },
    "type": "loopEdge",
    "source": "forLoopNode_351",
    "target": "forLoopEndNode_384",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_384-forLoopNode_351-433",
    "data": {
      "condition": "Loop",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "forLoopEndNode_384",
    "target": "forLoopNode_351",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
