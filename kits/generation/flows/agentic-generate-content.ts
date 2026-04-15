/*
 * # 1. Agentic Generation - Generate Content
 * A single entry-point generation flow that turns a caller's `instructions` into text, JSON, or image output and serves as the core execution path for the wider Generation agent kit.
 *
 * ## Purpose
 * This flow solves the routing and execution problem for multimodal content generation behind one API contract. Instead of forcing a caller to choose different endpoints or manually coordinate different model calls, it accepts a single request, inspects the requested `mode`, and dispatches the job to the correct generation branch for text, structured JSON, or image creation. It also handles invalid mode requests safely and normalizes branch results before returning them.
 *
 * The outcome is a finalized response suitable for immediate use by a UI, automation, or downstream system. In `text` mode, it returns model-generated prose content. In `json` mode, it generates structured content and runs an explicit parsing step before response finalization. In `image` mode, it invokes an image generation model from the same instruction input. This matters to the overall agent pipeline because it gives all clients a stable, unified invocation pattern while centralizing validation, prompting, and output shaping in one maintained flow.
 *
 * Within the broader agent architecture described by the parent `agent.md`, this flow is the primary runtime execution unit, not a mid-pipeline helper. It sits at the front and center of the system's equivalent of a synthesize stage: the caller provides intent and desired modality, and this flow directly produces the user-facing artifact. There is no separate retrieval or planning flow upstream in this kit; orchestration happens inside this mode-routed generation pipeline.
 *
 * ## When To Use
 * - Use when a caller has free-form `instructions` and needs generated written content via `mode` = `text`.
 * - Use when a caller needs machine-readable structured output via `mode` = `json` and wants the flow to handle model prompting plus JSON parsing.
 * - Use when a caller wants an image generated from natural-language instructions via `mode` = `image`.
 * - Use when a UI or external system wants one stable API entry point for multiple generation modalities.
 * - Use when you want Lamatic to own branch selection, prompt application, and response normalization rather than implementing those concerns in application code.
 * - Use when the request comes from the kit's Next.js frontend or any external system capable of invoking the deployed Lamatic API trigger.
 *
 * ## When Not To Use
 * - Do not use when `mode` is absent, misspelled, or outside the supported set of `text`, `json`, or `image`; the flow will route to the invalid-mode path instead of producing useful content.
 * - Do not use when the caller needs conversational state, tool use, or multi-step reasoning across turns; this flow is a single request-response generator.
 * - Do not use when an upstream system expects a strongly typed top-level API schema beyond the single returned `answer` field; branch outputs are normalized into that wrapper.
 * - Do not use when required model configuration or provider credentials have not been set for the chosen branch.
 * - Do not use for file-based, multimodal input ingestion beyond the configured request payload; this flow is driven by trigger fields, primarily `instructions` and `mode`.
 * - Do not use if another sibling or external flow is responsible for retrieval, indexing, search, or data enrichment before generation; this flow assumes the caller already has the instruction to execute.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `mode` | `string` | Yes | Selects the generation branch. Supported values are `text`, `json`, and `image`. |
 * | `instructions` | `string` | Yes | The user prompt or task description supplied to the selected generation branch. |
 * | `generativeModelName` | `model` | Branch-required | Private runtime model selection for `LLMNode_430` (`Text`) and `LLMNode_255` (`JSON`). Required when the corresponding branch is used. |
 * | `imageGenModelName` | `model` | Branch-required | Private runtime model selection for `ImageGenNode_535` (`Generate Image`). Required when `mode` is `image`. |
 *
 * The trigger itself exposes `mode` and `instructions` from the API request payload. Model selector fields are configured as private Lamatic flow inputs attached to the relevant nodes rather than end-user-facing form fields in a typical product UI. The flow assumes `instructions` is meaningful natural-language input and that `mode` exactly matches one of the supported values. No explicit max-length, language, or schema validation is shown in the flow source, so those constraints depend on the selected model providers and any hidden script logic.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` or `object` | The finalized output from the selected branch, returned through the API response mapping from `codeNode_136.output`. |
 *
 * The API response always exposes a single top-level field, `answer`, which contains the output produced after branch execution and finalization. Depending on branch behavior and the implementation of `Finalise Output`, this may be plain text, a parsed JSON object or JSON-like structured value, an image generation result payload or URL-like artifact, or an error-shaped value for unsupported modes. The response shape is therefore normalized at the transport layer but not necessarily identical in content type across modes.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is the entry-point flow for the Generation agent kit and does not require another Lamatic flow to run before it.
 * - It consumes request data directly from `API Request`, specifically `mode` and `instructions` supplied by the caller.
 * - In broader system terms, the invoking application or orchestration layer must already have decided that the task is a generation request and must provide the instruction text to execute.
 *
 * ### Downstream Flows
 * - No downstream Lamatic flows are identified in the provided materials.
 * - This flow is designed to terminate in `API Response` and hand the result back to the caller directly.
 * - Any downstream dependency is external to Lamatic orchestration, such as the Next.js frontend rendering the returned `answer`.
 *
 * ### External Services
 * - Lamatic GraphQL/API trigger and response handling — receives invocation payloads and returns the finalized result — requires deployed Lamatic project configuration
 * - Text generation model provider selected through `generativeModelName` on `LLMNode_430` — generates prose output for `text` mode — requires the provider credential bound in Lamatic model config
 * - Text generation model provider selected through `generativeModelName` on `LLMNode_255` — generates structured JSON-oriented output for `json` mode — requires the provider credential bound in Lamatic model config
 * - Image generation model provider selected through `imageGenModelName` on `ImageGenNode_535` — generates image output for `image` mode — requires the provider credential bound in Lamatic model config
 *
 * ### Environment Variables
 * - `AGENTIC_GENERATE_CONTENT` — deployed flow identifier used by the application layer to invoke this flow — used outside the node graph when calling the deployed flow
 * - `LAMATIC_API_URL` — Lamatic API base URL for flow invocation — used by the external caller that triggers `API Request`
 * - `LAMATIC_PROJECT_ID` — Lamatic project scoping for API access — used by the external caller that triggers `API Request`
 * - `LAMATIC_API_KEY` — authentication for Lamatic API access — used by the external caller that triggers `API Request`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the incoming API call in realtime mode and exposes the caller payload to the rest of the graph. The two critical runtime values are `triggerNode_1.output.mode` for routing and `triggerNode_1.output.instructions` for prompt construction in the generation branches.
 *
 * 2. `Condition` (`conditionNode`) evaluates `triggerNode_1.output.mode` and selects one of four paths. If the value is `text`, it routes to `Text`. If it is `image`, it routes to `Generate Image`. If it is `json`, it routes to `JSON`. Any other value, including missing or unsupported values, falls through to `Invalid Mode`.
 *
 * 3. `Text` (`LLMNode`) runs only for `mode` = `text`. It uses the shared text-oriented system prompt reference `@prompts/text-system.md` and the flow-specific user prompt reference `@prompts/agentic-generate-content_text_user.md`, along with model configuration from `@model-configs/agentic-generate-content_text.ts`. Its job is to turn the caller's `instructions` into natural-language output.
 *
 * 4. `JSON` (`LLMNode`) runs only for `mode` = `json`. It uses `@prompts/json-system.md` and `@prompts/agentic-generate-content_json_user.md`, plus model configuration from `@model-configs/agentic-generate-content_json.ts`, to generate content intended to be valid JSON or JSON-like structured output.
 *
 * 5. `Parse JSON` (`codeNode`) runs immediately after `JSON`. Its purpose is to post-process the raw model output from the JSON branch using `@scripts/agentic-generate-content_parse-json.ts`, converting the LLM response into a parsed and cleaner structured result before final response assembly.
 *
 * 6. `Generate Image` (`ImageGenNode`) runs only for `mode` = `image`. It uses the system prompt `@prompts/generate-image-system.md`, the user prompt `@prompts/agentic-generate-content_generate-image_user.md`, and the model configuration referenced by `@model-configs/agentic-generate-content_generate-image.ts`. It transforms the user's `instructions` into an image generation request and captures the provider's result.
 *
 * 7. `Invalid Mode` (`codeNode`) runs only when the `Condition` node does not match `text`, `json`, or `image`. Using `@scripts/agentic-generate-content_invalid-mode.ts`, it constructs a safe fallback output indicating that the requested mode is not supported.
 *
 * 8. `Finalise Output` (`codeNode`) is the convergence point for all branches. Whether the upstream result came from `Text`, `Parse JSON`, `Generate Image`, or `Invalid Mode`, this node runs `@scripts/agentic-generate-content_finalise-output.ts` to normalize the branch result into the single output value consumed by the response mapping.
 *
 * 9. `API Response` (`responseNode`) returns the finalized result to the caller. Its output mapping sets `answer` to `{{codeNode_136.output}}`, making `answer` the sole top-level response field regardless of which branch executed.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow returns an invalid-mode style response instead of generated content | `mode` was omitted, misspelled, or provided with an unsupported value | Send `mode` as exactly `text`, `json`, or `image`; validate this in the client before invocation |
 * | Text or JSON generation fails before producing output | The selected `generativeModelName` is unset, misconfigured, or linked to missing provider credentials | Configure a valid text generation model in Lamatic for `LLMNode_430` and `LLMNode_255`, and verify provider credentials |
 * | Image generation fails or returns no asset | `imageGenModelName` is missing, invalid, or the image provider credential is unavailable | Configure a valid image generation model for `ImageGenNode_535` and confirm provider access and quotas |
 * | `json` mode returns parsing errors or malformed structured output | The LLM produced non-JSON text, partial JSON, or unexpected formatting that `Parse JSON` could not cleanly parse | Tighten the JSON prompt, test the selected model for structured generation reliability, and review `agentic-generate-content_parse-json.ts` behavior |
 * | Response contains an empty or null `answer` | The selected model returned no usable content, or `Finalise Output` could not normalize the upstream branch result | Inspect the branch node output in Lamatic logs, verify prompt inputs, and review `agentic-generate-content_finalise-output.ts` |
 * | API call cannot reach the flow | The external application is missing `AGENTIC_GENERATE_CONTENT`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, or `LAMATIC_API_KEY`, or they are incorrect | Set the required environment variables from the deployed Lamatic project and verify authentication and flow ID |
 * | Upstream flow not having run | An external orchestrator assumed prior enrichment or preprocessing, but this entry-point flow does not depend on another Lamatic flow and received incomplete instructions | Ensure the caller passes fully formed `instructions`; do not assume hidden upstream preparation unless your application explicitly performs it |
 *
 * ## Notes
 * - The flow is deliberately mode-routed rather than tool-augmented: each branch is a separate model path with its own prompt set and post-processing behavior.
 * - `json` mode is the only branch with explicit intermediate parsing, which suggests it is intended for more deterministic downstream consumption than raw text generation.
 * - The final transport contract is intentionally simple: everything is returned under `answer`. Consumers that need stronger typing should branch on the request `mode` or inspect the returned content.
 * - The flow source leaves `meta.description`, tags, and public documentation links empty, so the TypeScript graph itself is the authoritative source of execution behavior.
 * - Because model selector inputs are marked private, operational configuration is expected to be handled in Lamatic deployment rather than exposed directly to end users.
 */

// Flow: agentic-generate-content

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Agentic Generation - Generate Content",
  "description": "",
  "tags": [],
  "testInput": {
    "mode": "text",
    "instructions": "write me a poem on AI"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_430": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
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
      },
      "isPrivate": true
    }
  ],
  "LLMNode_255": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
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
      },
      "isPrivate": true
    }
  ],
  "ImageGenNode_535": [
    {
      "name": "imageGenModelName",
      "label": "Image Model Name",
      "type": "model",
      "mode": "image_generation",
      "description": "Select the image generation model to use based on the prompt.",
      "modelType": "generator/image",
      "required": true,
      "defaultValue": "",
      "isPrivate": true,
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
    "text_system": "@prompts/text-system.md",
    "json_system": "@prompts/json-system.md",
    "generate_image_system": "@prompts/generate-image-system.md",
    "agentic_generate_content_text_user": "@prompts/agentic-generate-content_text_user.md",
    "agentic_generate_content_json_user": "@prompts/agentic-generate-content_json_user.md",
    "agentic_generate_content_generate_image_user": "@prompts/agentic-generate-content_generate-image_user.md"
  },
  "modelConfigs": {
    "agentic_generate_content_text": "@model-configs/agentic-generate-content_text.ts",
    "agentic_generate_content_json": "@model-configs/agentic-generate-content_json.ts",
    "agentic_generate_content_generate_image": "@model-configs/agentic-generate-content_generate-image.ts"
  },
  "scripts": {
    "agentic_generate_content_invalid_mode": "@scripts/agentic-generate-content_invalid-mode.ts",
    "agentic_generate_content_parse_json": "@scripts/agentic-generate-content_parse-json.ts",
    "agentic_generate_content_finalise_output": "@scripts/agentic-generate-content_finalise-output.ts"
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
      "x": 675,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "conditionNode_374",
    "data": {
      "label": "Condition",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_374-addNode_871",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.mode}}\",\n      \"operator\": \"==\",\n      \"value\": \"text\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_374-addNode_908",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_374-plus-node-addNode_619157-178",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.mode}}\",\n      \"operator\": \"==\",\n      \"value\": \"image\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 3",
            "value": "conditionNode_374-plus-node-addNode_139233-221",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.mode}}\",\n      \"operator\": \"==\",\n      \"value\": \"json\"\n    }\n  ]\n}"
          }
        ]
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "codeNode_567",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-generate-content_invalid-mode.ts",
        "nodeName": "Invalid Mode"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 900,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "LLMNode_430",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/text-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-generate-content_text_user.md"
          }
        ],
        "memories": "@model-configs/agentic-generate-content_text.ts",
        "messages": "@model-configs/agentic-generate-content_text.ts",
        "nodeName": "Text",
        "attachments": "@model-configs/agentic-generate-content_text.ts",
        "credentials": "@model-configs/agentic-generate-content_text.ts",
        "generativeModelName": "@model-configs/agentic-generate-content_text.ts"
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
    "selected": true
  },
  {
    "id": "LLMNode_255",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-generate-content_json_user.md"
          }
        ],
        "memories": "@model-configs/agentic-generate-content_json.ts",
        "messages": "@model-configs/agentic-generate-content_json.ts",
        "nodeName": "JSON",
        "attachments": "@model-configs/agentic-generate-content_json.ts",
        "credentials": "@model-configs/agentic-generate-content_json.ts",
        "generativeModelName": "@model-configs/agentic-generate-content_json.ts"
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
  },
  {
    "id": "codeNode_904",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-generate-content_parse-json.ts",
        "nodeName": "Parse JSON"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "ImageGenNode_535",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "ImageGenNode",
      "values": {
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-image-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-generate-content_generate-image_user.md"
          }
        ],
        "nodeName": "Generate Image",
        "imageGenModelName": "@model-configs/agentic-generate-content_generate-image.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "codeNode_136",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-generate-content_finalise-output.ts",
        "nodeName": "Finalise Output"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"answer\": \"{{codeNode_136.output}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 750
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-conditionNode_374",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "conditionNode_374",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-LLMNode_430-637",
    "data": {
      "condition": "Condition 1",
      "branchName": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "LLMNode_430",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-LLMNode_255-708",
    "data": {
      "condition": "Condition 3"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "LLMNode_255",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_255-codeNode_904",
    "type": "defaultEdge",
    "source": "LLMNode_255",
    "target": "codeNode_904",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-codeNode_567-576",
    "data": {
      "condition": "Else",
      "branchName": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "codeNode_567",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_136-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_136",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_430-codeNode_136-837",
    "type": "defaultEdge",
    "source": "LLMNode_430",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_904-codeNode_136-182",
    "type": "defaultEdge",
    "source": "codeNode_904",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_567-codeNode_136-158",
    "type": "defaultEdge",
    "source": "codeNode_567",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "ImageGenNode_535-codeNode_136",
    "type": "defaultEdge",
    "source": "ImageGenNode_535",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-ImageGenNode_535-560",
    "data": {
      "condition": "Condition 2"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "ImageGenNode_535",
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
