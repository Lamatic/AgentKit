/*
 * # 1. Assistant - Grammer Correction
 * This flow accepts user-submitted text, generates structured grammar corrections, and serves as the entry-point correction engine for the broader Grammar Assistant Chrome extension workflow.
 *
 * ## Purpose
 * This flow is responsible for one narrowly defined but central task: taking a piece of user-selected text and turning it into a machine-readable set of grammar and clarity corrections. Instead of returning only rewritten prose, it produces both a fully corrected version of the input and a granular list of proposed edits with positional metadata. That makes it suitable for direct rendering in a browser side panel, inline highlighting, or downstream automation that needs precise spans and replacement suggestions.
 *
 * The outcome matters because the surrounding system is designed for fast, interactive writing assistance. The Chrome extension captures text from arbitrary webpages, invokes this flow through Lamatic's API layer, and expects a structured response it can display immediately. By emitting correction objects that include `start_index`, `end_index`, `original_text`, `suggested_text`, `error_type`, and `confidence`, this flow gives the UI enough information to explain what changed, not just show a rewritten sentence.
 *
 * In the broader agent architecture, this flow sits at the execution core of the pipeline and acts as an entry-point rather than a downstream enrichment step. The parent agent indicates a GraphQL/API trigger feeding an instructor-style LLM node and returning JSON to the client. There is no retrieval stage, tool orchestration stage, or prior classification flow encoded here; the flow begins when the extension or another client submits `text`, then moves directly into structured synthesis and returns the result for immediate consumption.
 *
 * ## When To Use
 * - Use when a user has highlighted or submitted freeform text and wants grammar correction.
 * - Use when the caller needs both a corrected version of the full text and discrete edit suggestions.
 * - Use when the consuming client expects structured JSON rather than plain natural-language feedback.
 * - Use when the request originates from the Grammar Assistant Chrome extension side panel or any equivalent API client invoking the deployed Lamatic endpoint.
 * - Use when the text may contain grammar, punctuation, clarity, style, or vocabulary issues that should be identified and normalized.
 * - Use when you need character-level correction spans to support UI highlighting, patch application, or auditability.
 *
 * ## When Not To Use
 * - Do not use when no `text` input is available at the API trigger.
 * - Do not use when the payload is non-textual, such as binary files, images, or document attachments, because this flow accepts plain text only.
 * - Do not use when the desired outcome is translation, summarization, tone rewriting, or another writing-assistance function not implemented in this flow.
 * - Do not use when an upstream system expects unstructured prose output only; this flow is designed around structured JSON generation.
 * - Do not use when Lamatic model configuration or provider credentials have not been set, because the LLM node cannot execute without a configured `generativeModelName`.
 * - Do not use as a downstream post-processing step after another correction flow; this flow is itself the primary correction engine in the current kit.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `text` | `string` | Yes | The original user text to analyze and correct for grammar, punctuation, clarity, style, and vocabulary issues. |
 * | `generativeModelName` | `model` | Yes | The text generation model configuration supplied to `InstructorLLMNode_867` to perform structured correction generation. This is a flow-level configurable model input rather than a caller-provided text field. |
 *
 * Below the table, the main runtime trigger input is `text`, which the flow expects to arrive on the API request boundary and make available to the prompt context via `triggerNode_1.output.text`. The provided test input shows a simple raw sentence, implying no markup or document wrapper is required.
 *
 * No explicit maximum length, language restriction, or schema-level validation for `text` is defined in the flow source. In practice, callers should send coherent plain text and keep it within the token and context limits of the configured model. The model selection input is marked private and required, meaning it must be configured in Lamatic Studio rather than supplied ad hoc by most end users.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `corrected_text` | `string` | The fully corrected version of the original input text after applying the model's suggested edits. |
 * | `corrections` | `array<object>` | A list of discrete correction objects describing each suggested change, including span offsets, source text, replacement text, error classification, and confidence. |
 *
 * The API response is a structured JSON object with two top-level fields. `corrected_text` is a single complete rewritten string. `corrections` is an array of structured items, where each item is expected to include `start_index`, `end_index`, `original_text`, `suggested_text`, `error_type`, and `confidence`.
 *
 * The flow is designed for completeness at the schema level because the LLM node is constrained to produce required fields for every correction item. Even so, the quality and exhaustiveness of corrections remain model-dependent. Offset accuracy and correction coverage should be treated as high-value structured suggestions, not guaranteed deterministic edits in every edge case.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow in the current agent kit.
 * - It is invoked directly by an external client through the API trigger.
 * - The only required upstream data is the incoming trigger payload containing `text`, which is consumed by the LLM prompt context from `triggerNode_1.output.text`.
 *
 * ### Downstream Flows
 * - No downstream Lamatic flows are identified in the provided kit metadata.
 * - The primary downstream consumer is the external Chrome extension UI, which uses `corrected_text` and `corrections` to render results in the side panel.
 * - Any external orchestrator that chains this flow would most likely consume `corrected_text` for display and `corrections` for annotations or patch application.
 *
 * ### External Services
 * - Lamatic GraphQL/API trigger-response transport — receives the request and returns the JSON result — requires a deployed Lamatic endpoint and exported project configuration.
 * - Configured text generation model via `InstructorLLMNode` — analyzes input text and produces schema-constrained JSON corrections — requires a model provider credential configured in Lamatic Studio through `generativeModelName`.
 * - Prompt resources `@prompts/generate-json-system.md` and `@prompts/assistant-grammer-correction_generate-json_user.md` — define the instruction framing and task-specific user prompt used by the LLM node — no direct external credential, but must exist in the deployed flow package.
 *
 * ### Environment Variables
 * - No flow-specific environment variables are explicitly declared in the provided source.
 * - Model provider credentials are required indirectly through the configured `generativeModelName` used by `InstructorLLMNode_867`.
 * - Deployment and invocation settings are typically carried through the exported Lamatic project configuration consumed by the client, not as named environment variables in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the inbound API call that starts the flow. Its role here is to accept the caller payload, expose the submitted `text` into flow context, and establish the request boundary for real-time processing.
 *
 * 2. `Generate JSON` (`InstructorLLMNode`) performs the actual grammar-correction task. It uses a configured text generation model, a system prompt for JSON-structured generation, and a task-specific user prompt referenced from the flow resources. With the original text from the trigger in context, it produces a schema-constrained object containing a complete `corrected_text` string and a `corrections` array. Each correction item is expected to specify the exact substring targeted, its character offsets in the original text, a suggested replacement, an `error_type`, and a confidence score.
 *
 * 3. `API Response` (`responseNode`) formats and returns the final HTTP/API payload. It maps `InstructorLLMNode_867.output.corrected_text` to `corrected_text` and `InstructorLLMNode_867.output.corrections` to `corrections`, sets the response `content-type` to `application/json`, and sends the result back to the caller without retries.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before inference starts | The caller did not provide the required `text` field or sent an unexpected payload shape | Ensure the API request includes a plain-text `text` field and that the client is passing the deployed flow's expected input structure |
 * | LLM node does not run or returns a provider error | No model has been configured for `generativeModelName`, or provider credentials are missing/invalid | Configure a valid text-generation model in Lamatic Studio for `InstructorLLMNode_867` and verify the linked provider credential |
 * | Response is empty or missing `corrected_text`/`corrections` | The model failed to satisfy the structured schema, or the prompt/model combination is misconfigured | Review the prompt and model config references, test with the provided sample input, and use a model that reliably supports structured JSON output |
 * | Corrections appear inaccurate or offsets do not line up cleanly | The model generated imperfect span metadata for the original text | Validate offsets client-side before patching text, and consider displaying suggestions for user confirmation rather than auto-applying them blindly |
 * | Flow cannot be invoked from the extension | The deployed Lamatic config was not exported or the extension is using a placeholder `lamatic-config.json` | Replace any dummy configuration with the real exported Lamatic project payload and reload the extension |
 * | Upstream flow not having run | The caller assumes another Lamatic preprocessing step exists, but this flow is an entry point and expects direct input | Invoke this flow directly with raw `text`; do not depend on prior Lamatic flow outputs unless you explicitly build that orchestration layer |
 * | API call returns JSON but no useful corrections | The input text is too short, already correct, ambiguous, or outside the model's effective capabilities | Test with clearer input, set user expectations that some inputs may yield minimal changes, and tune prompts or model choice if quality is insufficient |
 *
 * ## Notes
 * - The flow name contains the spelling `Grammer` in source metadata. Preserve that identifier when referring to the deployed flow, even though the functional purpose is grammar correction.
 * - The response node is configured for `realtime` request handling with zero retries and zero retry delay, so transient provider issues will surface directly to the caller unless retry logic is added externally.
 * - The correction schema allows `additionalProperties` on each correction object, which means some model outputs may include extra fields beyond the documented minimum. Downstream consumers should rely on the required fields and tolerate additional metadata.
 * - Because `start_index` and `end_index` are defined against the original text, any client applying multiple edits should do so carefully to avoid offset drift; rendering suggestions before mutation is often safer than sequential blind replacement.
 * - The flow references prompt and model-config assets by path. If those resources are moved, renamed, or omitted during packaging, the flow may deploy incorrectly or behave unexpectedly.
 */

// Flow: assistant-grammer-correction

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Assistant - Grammer Correction",
  "description": "",
  "tags": [],
  "testInput": {
    "text": "Naitik iss a high valeu enginr wking in Lamatic AI"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_867": [
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
    "assistant_grammer_correction_generate_json_user": "@prompts/assistant-grammer-correction_generate-json_user.md"
  },
  "modelConfigs": {
    "assistant_grammer_correction_generate_json": "@model-configs/assistant-grammer-correction_generate-json.ts"
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
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"corrected_text\": \"{{InstructorLLMNode_867.output.corrected_text}}\",\n  \"corrections\": \"{{InstructorLLMNode_867.output.corrections}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
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
    "id": "InstructorLLMNode_867",
    "data": {
      "label": "dynamicNode node",
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_867",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"corrected_text\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"The entire corrected text based on your suggestions\"\n    },\n    \"corrections\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"start_index\": {\n            \"type\": \"number\",\n            \"required\": true,\n            \"description\": \"Zero-based character offset in original_text indicating the start position of the substring to be replaced.\"\n          },\n          \"end_index\": {\n            \"type\": \"number\",\n            \"required\": true,\n            \"description\": \"Zero-based character offset (exclusive) in original_text indicating the end position of the substring to be replaced.\"\n          },\n          \"original_text\": {\n            \"type\": \"string\",\n            \"required\": true,\n            \"description\": \"The exact substring from original_text that is targeted for correction (used for validation and synchronization).\"\n          },\n          \"suggested_text\": {\n            \"type\": \"string\",\n            \"required\": true,\n            \"description\": \"The AI-generated replacement text proposed to fix the identified grammar or clarity issue.\"\n          },\n          \"error_type\": {\n            \"type\": \"string\",\n            \"required\": true,\n            \"description\": \"The classification of error detected, such as 'grammar', 'punctuation', 'style', 'clarity', or 'vocabulary'.\"\n          },\n          \"confidence\": {\n            \"type\": \"number\",\n            \"required\": true,\n            \"description\": \"A decimal value between 0 and 1 representing the AI's confidence in the correctness of this suggested change.\"\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"An array of suggested corrections to be applied to the original_text. Each entry represents one discrete correction.\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/assistant-grammer-correction_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/assistant-grammer-correction_generate-json.ts",
        "messages": "@model-configs/assistant-grammer-correction_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/assistant-grammer-correction_generate-json.ts",
        "generativeModelName": "@model-configs/assistant-grammer-correction_generate-json.ts"
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
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_867",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_867",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_867-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_867",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
