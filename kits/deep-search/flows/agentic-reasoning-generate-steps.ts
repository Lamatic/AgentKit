/*
 * # Agentic Reasoning - Generate Steps
 * A planning flow that turns a user research query into generated reasoning steps, serving as the entry point for the wider deep-search pipeline.
 *
 * ## Purpose
 * This flow is responsible for the planning stage of the Deep Research kit. It takes an open-ended user query and uses a text generation model to produce the steps or actions that should be performed next. Rather than attempting retrieval or synthesis directly, it converts the question into an actionable plan that downstream flows can execute.
 *
 * The outcome is a `steps` payload returned to the caller. That output matters because the broader system is designed as a staged pipeline: planning first, evidence gathering second, and answer synthesis last. By generating steps up front, the system can make retrieval more targeted, auditable, and easier to orchestrate across web search and internal data-source search flows.
 *
 * In the broader plan-retrieve-synthesize chain, this flow sits at the very beginning. It is invoked via Lamatic's API/GraphQL trigger pattern, typically by a Next.js frontend or another orchestrator. Its output is then used to drive downstream research execution flows such as web search and indexed data retrieval before a final synthesis flow assembles the answer.
 *
 * ## When To Use
 * - Use when starting a new research run from a raw user question.
 * - Use when you need a generated plan before deciding whether to query the public web, internal indexed sources, or both.
 * - Use when the caller has a natural-language `query` but does not yet have structured retrieval actions.
 * - Use when an orchestration layer needs a lightweight planning response it can fan out into multiple downstream search tasks.
 * - Use when you want the first stage of the Deep Research workflow to be explicit and inspectable rather than letting a final-answer model improvise retrieval implicitly.
 *
 * ## When Not To Use
 * - Do not use when you already have a validated step plan and only need to execute retrieval against the web or internal sources.
 * - Do not use when the goal is to produce the final user-facing answer; the final synthesis flow is the correct choice for that stage.
 * - Do not use when the input is missing the user's research question or the payload is not shaped like an API request the trigger can accept.
 * - Do not use when you need current evidence from the web directly; route to the web search flow after planning.
 * - Do not use when you need evidence from indexed enterprise or internal sources directly; route to the data-source retrieval flow after planning.
 * - Do not use as a substitute for indexing or maintaining internal knowledge sources; indexation and retrieval flows handle that responsibility elsewhere in the kit.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `query` | `string` | Yes | The user's research question or task description that the flow should convert into reasoning steps. |
 * | `history` | `array` | No | Prior conversational context supplied by the caller. It appears in the test input and may be available to prompt/model configuration, but no explicit field-level mapping is declared in the flow source. |
 * | `generativeModelName` | `model` | Yes | The text-generation model selection for the `Generate Text` node. This is configured as a private flow input and must resolve to a model compatible with `generator/text`. |
 *
 * The trigger expects an API or GraphQL-style request containing the user query. The flow source explicitly demonstrates `query` and `history` in its test payload, but only the model selector is formally declared in `inputs`; query handling is driven by the trigger plus the referenced prompt and model configuration. The `query` should be a natural-language instruction or question. No explicit max length, schema validation, or language restriction is declared in the flow source.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `steps` | `string` | The generated reasoning steps returned from `LLMNode_680.output.generatedResponse`. |
 *
 * The response is a single field, `steps`, mapped directly from the language model's generated text output. In practice this is expected to be a prose or semi-structured step plan, not a strongly typed JSON object enforced by the flow itself. The exact formatting depends on the referenced prompts and model behavior, so callers should not assume strict machine-readable structure unless they separately constrain it at the prompt or consumer level.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is an entry-point flow in the reasoning pipeline.
 * - It is typically invoked directly by a frontend, service, or orchestration layer that has collected a user `query`.
 * - No prior Lamatic flow is required to run before this one for basic operation.
 *
 * ### Downstream Flows
 * - `agentic-reasoning-search-web` — consumes the generated plan in `steps` to execute public-web research tasks derived from the user's query.
 * - `agentic-reasoning-data-source` — consumes the generated plan in `steps` to execute retrieval against indexed internal or enterprise-connected data sources.
 * - `agentic-reasoning-final` — indirectly depends on this flow because the final synthesis stage is built from research gathered by retrieval flows that are themselves driven by the generated plan.
 *
 * ### External Services
 * - Lamatic GraphQL/API trigger and response runtime — receives the incoming request and returns the flow output — required project deployment in Lamatic
 * - Configured text generation model — generates the reasoning steps from the system and user prompts — required model selection via `generativeModelName`
 * - Prompt resources `@prompts/generate-text-system.md` and `@prompts/agentic-reasoning-generate-steps_generate-text_user.md` — define the LLM behavior and planning instruction — no standalone credential
 * - Model configuration resource `@model-configs/agentic-reasoning-generate-steps_generate-text.ts` — supplies message, memory, and attachment configuration to the LLM node — no standalone credential
 *
 * ### Environment Variables
 * - `AGENTIC_REASONING_GENERATE_STEPS` — deployed flow identifier used by external callers to invoke this flow — used outside the flow runtime by the calling application or orchestrator
 * - `LAMATIC_API_URL` — base URL for invoking Lamatic-hosted flows — used outside the flow runtime by the calling application or orchestrator
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated flow access — used outside the flow runtime by the calling application or orchestrator
 * - `LAMATIC_API_KEY` — authentication credential for Lamatic API access — used outside the flow runtime by the calling application or orchestrator
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the incoming API or GraphQL request that starts the flow. In normal use, this request includes the user's `query`, and may include `history` as conversational context. This node is the public entry point for the planning stage.
 *
 * 2. `Generate Text` (`LLMNode`) takes the request context and runs a text-generation model selected through `generativeModelName`. It applies two referenced prompts: the shared system prompt `generate_text_system` and the flow-specific user prompt `agentic_reasoning_generate_steps_generate_text_user`. Its model configuration also references shared settings for memories, messages, and attachments. The result is a generated text response representing the reasoning steps the system recommends.
 *
 * 3. `API Response` (`graphqlResponseNode`) returns the flow output to the caller. It maps `LLMNode_680.output.generatedResponse` into a single response field named `steps`, making the generated plan available to the frontend or orchestration layer for downstream execution.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before generation starts | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, or `LAMATIC_API_URL` is missing or incorrect in the calling environment | Verify the Lamatic environment variables in the caller, confirm the project and API key are valid, and ensure the deployed endpoint is reachable. |
 * | Caller cannot invoke this specific flow | `AGENTIC_REASONING_GENERATE_STEPS` is missing or points to the wrong deployed flow ID | Update the flow ID in the caller's environment and redeploy or restart the application. |
 * | Model execution fails in `Generate Text` | `generativeModelName` was not configured, is invalid, or does not resolve to a supported `generator/text` model | Select a valid text-generation model for the private flow input and confirm provider access in Lamatic. |
 * | Response returns empty or low-quality `steps` | The input `query` is empty, underspecified, or too vague for the planning prompt to produce useful actions | Validate that `query` is present and contains a clear research goal, scope, or question before invoking the flow. |
 * | Response shape is hard to parse programmatically | The flow returns `steps` as generated text rather than a strictly typed structure | Treat `steps` as freeform text unless you control the prompt to enforce structure, or add downstream parsing/validation. |
 * | Downstream retrieval flows do not behave as expected | This flow ran, but the generated plan was not passed onward correctly, or consumers expected a different schema | Confirm that downstream flows consume the `steps` field exactly as returned and align parser expectations with the prompt output format. |
 * | Planning is requested after retrieval has already been completed | The orchestrator called this flow out of order in the pipeline | Route execution based on stage: use this flow first for planning, then retrieval flows, then final synthesis. |
 * | Trigger accepts the request but the plan ignores prior context | `history` may not be explicitly mapped in the visible flow definition, even though it appears in test input | If conversational continuity is required, verify how the referenced model configuration injects history, or extend the flow to map it explicitly. |
 *
 * ## Notes
 * - This flow is intentionally narrow in scope: it plans work but does not perform search, retrieval, or final answer synthesis.
 * - The output contract is minimal by design. Only `steps` is returned, and it is mapped from raw model output without additional transformation or validation.
 * - Because formatting is prompt-driven, any consumer that requires deterministic step structure should add explicit prompt constraints or a downstream normalization layer.
 * - The flow contains a direct trigger-to-response edge in addition to the execution path through the LLM node, which is standard in Lamatic's request/response wiring and does not change the main execution order described above.
 * - The README positions this flow as part of a deployable kit used by a Next.js frontend, so most operational credentials are owned by the caller rather than by individual nodes inside the flow.
 */

// Flow: agentic-reasoning-generate-steps

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning - Generate Steps",
  "description": "This flow generates steps / actions to be performed as part of Agentic Reasoning",
  "tags": [],
  "testInput": {
    "query": "Help me pack for my trip to Jaipur next week",
    "history": []
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
  "LLMNode_680": [
    {
      "mode": "chat",
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
    "generate_text_system": "@prompts/generate-text-system.md",
    "agentic_reasoning_generate_steps_generate_text_user": "@prompts/agentic-reasoning-generate-steps_generate-text_user.md"
  },
  "modelConfigs": {
    "agentic_reasoning_generate_steps_generate_text": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts"
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
        "headers": "",
        "retries": "0",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_680",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-text-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-reasoning-generate-steps_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts",
        "messages": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts",
        "attachments": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts"
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
        "outputMapping": "{\n  \"steps\": \"{{LLMNode_680.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_680",
    "source": "triggerNode_1",
    "target": "LLMNode_680",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_680-responseNode_triggerNode_1",
    "source": "LLMNode_680",
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
