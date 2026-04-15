/*
 * # Agentic Reasoning - Search Web
 * This flow turns a set of planned research steps into focused public web searches and returns collated web research plus source links for downstream synthesis in the Deep Research pipeline.
 *
 * ## Purpose
 * This flow is responsible for the retrieval portion of the agentic research pipeline when the system needs current or public information from the open web. Rather than answering a user query directly, it accepts prewritten research steps, expands those steps into search-engine-friendly queries, executes those queries against the web, and collates the resulting findings into a structured research artifact. Its job is to gather evidence, not to produce the final user-facing answer.
 *
 * The outcome of this flow is a pair of outputs: `research`, which represents the collated results of the searches performed across the generated queries, and `links`, which captures the source URLs gathered during those searches. This matters because the broader system relies on evidence-backed intermediate artifacts before final synthesis. By separating web retrieval from answer generation, the kit can make the eventual response more grounded, traceable, and auditable.
 *
 * In the wider Deep Research architecture, this flow sits after planning and before synthesis. A planning flow generates the actionable steps for a research run, this flow executes the web-based evidence gathering implied by those steps, and a later synthesis flow consumes the collected research to produce a coherent final answer. It is the public-web counterpart to any internal data-source retrieval flow and should be used whenever the pipeline needs external, timely, or generally available information.
 *
 * ## When To Use
 * - Use when an upstream planning step has already produced `steps` describing what research should be performed on the public web.
 * - Use when the user query depends on current events, recent facts, live policies, forecasts, public advisories, travel information, pricing context, or other information likely to change over time.
 * - Use when no internal knowledge index is available for the needed facts, or when internal indexed content is insufficient on its own.
 * - Use when the orchestration layer wants source links alongside gathered research so downstream synthesis can cite or reason over evidence.
 * - Use when the request requires multiple related searches rather than a single direct lookup, because this flow decomposes the provided plan into several search queries and runs them in sequence.
 * - Use as the retrieval stage between `agentic-reasoning-generate-steps` and the final synthesis flow in a standard web-research path.
 *
 * ## When Not To Use
 * - Do not use when the request should be answered solely from internal indexed documents; in that case the sibling internal data-source retrieval flow is the better choice.
 * - Do not use as the first step of a new research run if `steps` have not yet been created by an upstream planning flow.
 * - Do not use when the caller expects a final natural-language answer for the end user; this flow gathers evidence but does not synthesize the final response.
 * - Do not use when public internet search is disallowed by policy, unavailable in the runtime environment, or missing required Serper credentials.
 * - Do not use when the input is a raw user `query` rather than a research plan in `steps`; the planning flow should transform the raw question first.
 * - Do not use for deterministic database lookup, file retrieval, or connector-based enterprise search, because those are handled by other retrieval mechanisms in the kit.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `steps` | `string` | Yes | A natural-language set of planned research actions describing what the flow should investigate on the public web. |
 *
 * Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).
 *
 * The trigger is an API/GraphQL request and the practical trigger-level business input is `steps`, as shown by the flow metadata test payload and downstream prompt usage. This field is expected to be a coherent planning artifact generated upstream rather than a terse keyword query. The flow assumes `steps` contains enough detail for the LLM to derive multiple useful search queries. No explicit schema validation, max length, or language restriction is defined in the flow source, so callers should provide well-formed plain text and avoid empty or highly ambiguous input.
 *
 * In addition to trigger payload data, the deployed flow also requires operator configuration for two private runtime inputs: credentials for the `Web Search` node and a text generation model for the `Generate JSON` node. These are deployment-time or studio-time requirements rather than API fields supplied by the caller.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `research` | `any` | Collated research generated from the combined web search results across all produced queries. |
 * | `links` | `any` | Source links extracted during research collation from the search results returned by the web searches. |
 *
 * The API response is a structured object with two top-level fields: `research` and `links`. The exact internal shape of those fields is determined by the `Collate Research` script rather than by the response node itself. In practice, `research` should be treated as the aggregated evidence artifact for downstream reasoning, while `links` should be treated as the accompanying set of URLs or references used to build that artifact.
 *
 * Because this flow depends on search-engine results and a custom collation script, completeness is not guaranteed. Outputs may be sparse if the generated queries are weak, if the search service returns little relevant data, or if fewer than the potential maximum number of loop iterations actually produce useful results.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `agentic-reasoning-generate-steps` should typically run before this flow in the standard Deep Research pipeline.
 *   - It produces a planning artifact conceptually representing the research actions to perform.
 *   - This flow consumes that planning artifact as the trigger input field `steps`.
 * - This flow is not a standalone planning entry point even though it is directly invokable over API/GraphQL; operationally it is meant to receive already-prepared research instructions.
 *
 * ### Downstream Flows
 * - The final synthesis flow in the Deep Research pipeline consumes this flow's outputs to produce the user-facing answer.
 *   - It needs `research` as the primary evidence context.
 *   - It may also use `links` to preserve provenance, references, or supporting citations in the final answering stage.
 * - If an orchestration layer combines multiple retrieval modes, this flow's `research` output may be merged with artifacts from internal data-source retrieval before final synthesis.
 *
 * ### External Services
 * - Serper Google Search API — executes public web searches for each generated query — required credential selected in the `Web Search` node via `credentials`
 * - Configured text generation model — converts `steps` into structured JSON containing search queries — required model selection in the `Generate JSON` node via `generativeModelName`
 * - Lamatic GraphQL/API runtime — receives the trigger request and returns the response payload — requires Lamatic deployment configuration for invocation
 *
 * ### Environment Variables
 * - `AGENTIC_REASONING_SEARCH_WEB` — deployed flow identifier used by external callers to invoke this flow — used outside the flow by the application or orchestration layer, not by a specific internal node
 * - `LAMATIC_API_URL` — Lamatic API base URL used by the calling application to reach the deployed flow — used outside the flow by the invoking client
 * - `LAMATIC_PROJECT_ID` — Lamatic project scoping for API calls — used outside the flow by the invoking client
 * - `LAMATIC_API_KEY` — authentication for invoking the deployed flow through Lamatic APIs — used outside the flow by the invoking client
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - The flow starts when Lamatic receives an API/GraphQL request.
 *    - The meaningful business payload for this flow is `steps`, which contains the planned research actions generated upstream.
 *    - The trigger is configured for realtime response handling, so the caller receives the final result from this same execution path.
 *
 * 2. `Generate JSON` (`InstructorLLMNode`)
 *    - This node uses a configured text generation model plus a system prompt and a flow-specific user prompt to transform the incoming `steps` into structured JSON.
 *    - Its output schema defines a single object containing `queries`, which is an array of strings.
 *    - In effect, this node converts a narrative research plan into a search plan: a list of discrete web queries that can be executed one by one.
 *    - This is a critical normalization step because downstream search is driven entirely by `Generate JSON.output.queries`.
 *
 * 3. `Loop` (`forLoopNode`)
 *    - The loop iterates over the list in `{{InstructorLLMNode_445.output.queries}}`.
 *    - It is configured in list-iteration mode, exposing each query as the current loop value.
 *    - The node also includes an `endValue` of `10`, which indicates an upper bound configuration in the loop node. Operationally, developers should treat this flow as capable of iterating over multiple generated queries up to that configured limit.
 *    - For each iteration, the current query is passed forward to the search node.
 *
 * 4. `Web Search` (`webSearchNode`)
 *    - On each loop iteration, this node queries the Serper-backed Google Search endpoint using `{{forLoopNode_626.output.currentValue}}` as the search string.
 *    - It requests `5` results per query and does not constrain country, language, location, or date range by default.
 *    - This means the relevance and specificity of results depend heavily on how well the previous LLM node generated the query text.
 *    - The node requires private Serper credentials to be configured before deployment or execution.
 *
 * 5. `Loop End` (`forLoopEndNode`)
 *    - After each web search completes, control returns to the loop end node.
 *    - If more queries remain, execution cycles back into the loop for the next search.
 *    - Once all iterations are complete, the flow exits the loop and proceeds to collation.
 *
 * 6. `Collate Research` (`codeNode`)
 *    - This custom script processes the accumulated search outputs from the loop.
 *    - Its purpose is to turn multiple individual search responses into a consolidated `research` artifact and a corresponding `links` collection.
 *    - This is the node where the raw retrieval data is shaped into the flow's stable outward-facing response contract.
 *    - The exact formatting logic lives in the referenced script, but from the response mapping it is clear that the script emits `research` and `links` fields.
 *
 * 7. `API Response` (`graphqlResponseNode`)
 *    - The final node returns a realtime API response to the caller.
 *    - It maps `{{codeNode_201.output.research}}` to the response field `research` and `{{codeNode_201.output.links}}` to the response field `links`.
 *    - No retries are configured on the response node itself.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails before or during `Web Search` | Missing or invalid Serper credentials in the `Web Search` node | Configure valid search credentials for `webSearchNode_441` in Lamatic before deploying or running the flow. |
 * | `Generate JSON` fails or returns no usable `queries` | No model selected, invalid model access, or weak/malformed `steps` input | Ensure `InstructorLLMNode_445` has a valid text generation model configured and provide clearer, non-empty planning text in `steps`. |
 * | Response contains empty or thin `research` | The generated queries were too broad, too vague, or not aligned with the intended task | Improve the upstream planning output, refine the query-generation prompt if maintaining the flow, or provide more specific `steps`. |
 * | Response contains few or no `links` | Search API returned limited results or collation script filtered aggressively | Verify that web search is returning relevant results, inspect the collation script behavior, and tighten the generated queries. |
 * | Flow is invoked with raw user question instead of research plan | Upstream planning flow did not run, or orchestration passed the wrong field | Run `agentic-reasoning-generate-steps` first and pass its planning output into this flow as `steps`. |
 * | Search coverage seems capped | The loop is configured with a limit and the search node only requests `5` results per query | Reduce the number of generated queries, adjust loop/search configuration in the flow definition if appropriate, or chain multiple retrieval passes. |
 * | Results are outdated, geographically off, or not localized | `Web Search` leaves `country`, `language`, `location`, and `dateRange` empty | Modify the flow configuration or prompts to generate location-aware queries, or set search constraints if maintaining a customized version of the flow. |
 * | Trigger succeeds but downstream synthesis performs poorly | This flow returned retrieval artifacts, but no final-answer flow consumed them correctly | Ensure the final synthesis flow is wired to consume `research` and, where needed, `links` from this flow. |
 *
 * ## Notes
 * - This flow is intentionally retrieval-focused. It does not rank competing evidence, resolve contradictions, or craft the final end-user answer.
 * - The quality of output depends on two transformations: the upstream step-generation quality and this flow's query-generation quality. Weak planning typically leads to weak web evidence.
 * - The `Generate JSON` node uses a strict object schema centered on `queries`, which helps enforce predictable downstream loop behavior.
 * - Search defaults are broad because country, language, location, and date range are left blank. That improves generality but can reduce precision for region-sensitive tasks.
 * - The loop is configured to iterate over generated queries and appears to enforce a practical upper bound. Developers extending the flow should keep search-cost and latency tradeoffs in mind.
 * - The final outward contract is stable at the response layer even if the internal collation logic evolves, because `API Response` exposes only `research` and `links`.
 */

// Flow: agentic-reasoning-search-web

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning - Search Web",
  "description": "This flow searches the internet as part of Agentic Reasoning",
  "tags": [],
  "testInput": {
    "steps": "I’ll start by searching the latest weather forecast for Jaipur next week and reviewing reliable travel and cultural resources to understand seasonal needs and local norms. I’ll also look up any events, safety advisories, and airline baggage rules to tailor packing to your itinerary and constraints. Then I’ll synthesize everything and prepare a structured packing list with essentials, optional items, and smart tips for comfort and safety. Since this is a new request, I’ll treat it as new."
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
  "webSearchNode_441": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Serper authentication.",
      "defaultValue": "",
      "isCredential": true
    }
  ],
  "InstructorLLMNode_445": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model to generate text based on the prompt.",
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
  "prompts": {
    "generate_json_system": "@prompts/generate-json-system.md",
    "agentic_reasoning_search_web_generate_json_user": "@prompts/agentic-reasoning-search-web_generate-json_user.md"
  },
  "modelConfigs": {
    "agentic_reasoning_search_web_generate_json": "@model-configs/agentic-reasoning-search-web_generate-json.ts"
  },
  "scripts": {
    "agentic_reasoning_search_web_collate_research": "@scripts/agentic-reasoning-search-web_collate-research.ts"
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
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "InstructorLLMNode_445",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate JSON",
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
            "content": "@prompts/agentic-reasoning-search-web_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/agentic-reasoning-search-web_generate-json.ts",
        "messages": "@model-configs/agentic-reasoning-search-web_generate-json.ts",
        "attachments": "@model-configs/agentic-reasoning-search-web_generate-json.ts"
      }
    }
  },
  {
    "id": "forLoopNode_626",
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
        "connectedTo": "forLoopEndNode_366",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{InstructorLLMNode_445.output.queries}}"
      }
    }
  },
  {
    "id": "forLoopEndNode_366",
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
        "connectedTo": "forLoopNode_626"
      }
    }
  },
  {
    "id": "webSearchNode_441",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "modes": {},
      "values": {
        "nodeName": "Web Search",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{forLoopNode_626.output.currentValue}}",
        "country": "",
        "results": "5",
        "language": "",
        "location": "",
        "dateRange": ""
      }
    }
  },
  {
    "id": "codeNode_201",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Collate Research",
        "code": "@scripts/agentic-reasoning-search-web_collate-research.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "retries": "0",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"research\": \"{{codeNode_201.output.research}}\",\n  \"links\": \"{{codeNode_201.output.links}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_445",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_445",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_445-forLoopNode_626",
    "source": "InstructorLLMNode_445",
    "target": "forLoopNode_626",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_626-webSearchNode_441",
    "source": "forLoopNode_626",
    "target": "webSearchNode_441",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    }
  },
  {
    "id": "forLoopNode_626-forLoopEndNode_366",
    "source": "forLoopNode_626",
    "target": "forLoopEndNode_366",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": false
    }
  },
  {
    "id": "webSearchNode_441-forLoopEndNode_366",
    "source": "webSearchNode_441",
    "target": "forLoopEndNode_366",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_366-forLoopNode_626",
    "source": "forLoopEndNode_366",
    "target": "forLoopNode_626",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": true
    }
  },
  {
    "id": "forLoopEndNode_366-codeNode_201",
    "source": "forLoopEndNode_366",
    "target": "codeNode_201",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_201-responseNode_triggerNode_1",
    "source": "codeNode_201",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
