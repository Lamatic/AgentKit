/*
 * # 1. Agentic Generation - Generate Content
 * A single entry-point generation flow that routes one user instruction into text, structured JSON, or image output for the wider Lamatic generative agent system.
 *
 * ## Purpose
 * This flow is responsible for turning a caller's `instructions` and requested `mode` into a usable generated artifact through one consistent API surface. Rather than forcing the application layer to manage separate endpoints, prompts, model choices, and output handling for each content type, the flow centralises that logic inside Lamatic and applies the correct branch for `text`, `json`, or `image` generation.
 *
 * Its outcome is a final response returned under a single API field, `answer`, after generation and any branch-specific post-processing have completed. That matters to the broader agent pipeline because the surrounding application can invoke one flow ID and receive a mode-appropriate result without needing to understand prompt orchestration, JSON parsing, or invalid-mode handling. This keeps the client thin while preserving room to evolve prompts and model configuration in Lamatic Studio.
 *
 * Within the broader system described in the parent `agent.md`, this flow is both the primary entry point and the full synthesis layer for the generation kit. There is no separate retrieval or planning flow upstream. Instead, the flow performs routing, generation, optional parsing, and finalisation internally, then returns a polished output ready for UI rendering or downstream programmatic use.
 *
 * ## When To Use
 * - Use when a caller has a free-form instruction in `instructions` and wants generated prose or markdown by setting `mode` to `text`.
 * - Use when a caller wants a machine-consumable structured result and can request `mode` as `json`.
 * - Use when a caller wants an image generation result based on the same instruction and sets `mode` to `image`.
 * - Use when the application needs one stable Lamatic endpoint for multiple generation experiences rather than separate specialised APIs.
 * - Use when the Next.js UI or another backend service is invoking the deployed flow ID referenced by `AGENTIC_GENERATE_CONTENT`.
 * - Use when prompt, model, and formatting behaviour should remain controlled in Lamatic rather than duplicated in application code.
 *
 * ## When Not To Use
 * - Do not use when `mode` is missing, misspelled, or outside the supported set of `text`, `json`, or `image`; the flow will route to its invalid-mode path instead of producing the intended artifact.
 * - Do not use when `instructions` is absent or empty, because every generation branch depends on that input.
 * - Do not use for tasks that require external retrieval, web search, internal knowledge-base lookup, or tool use; this flow contains no retrieval or tool-calling nodes.
 * - Do not use if you need deterministic schema validation beyond the flow's JSON parsing step; the JSON branch parses model output but does not expose a full schema-contract enforcement layer in this source.
 * - Do not use as a downstream processing step after another Lamatic flow unless that orchestrator is explicitly passing fresh `instructions` and a supported `mode` into this flow.
 * - Do not use when Lamatic project credentials, model credentials, or provider configuration have not been deployed and connected.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `mode` | `string` | Yes | Selects the execution branch. Supported values in this flow are `text`, `json`, and `image`. |
 * | `instructions` | `string` | Yes | The user request or prompt to be transformed into the requested output type. |
 *
 * The trigger is an API request node and the branch logic explicitly reads `triggerNode_1.output.mode`, so `mode` must be present and exactly match one of the supported values. The prompts referenced by the generation nodes depend on `instructions`, so callers should provide a clear natural-language instruction. No explicit maximum length or language validation is encoded in this source, so practical limits are determined by the configured models and Lamatic runtime constraints.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` or `object` | The finalised result produced by the selected branch and returned by the API response node. |
 *
 * The response always maps a single top-level field, `answer`, from `codeNode_136.output`. The exact shape of `answer` depends on the selected mode and on what the finalisation script emits. In practice, `text` mode should yield generated prose or markdown, `json` mode should yield parsed structured content after the JSON post-processing step, and `image` mode should yield the image-generation result produced by the image node and then normalised by the finaliser. Callers should not assume that all modes return the same primitive type without checking their own branch expectations.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow for the generation kit. No Lamatic flow must run before it.
 *
 * The only prerequisite is that an external caller such as the Next.js UI or another backend service invokes the deployed flow and provides the trigger payload fields this flow expects, especially `instructions` and `mode`.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are described as consuming this flow's output. In the kit architecture, the usual consumer is the application layer, which reads the API response field `answer` and renders or otherwise uses it directly.
 *
 * ### External Services
 * - Lamatic API runtime — hosts and executes the flow via the API trigger and response nodes — requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the calling application context
 * - Text generation model for `LLMNode_430` — generates `text` mode output from the system and user prompts — requires a Lamatic-configured text model credential selected through `generativeModelName`
 * - Text generation model for `LLMNode_255` — generates raw JSON-oriented content for `json` mode — requires a Lamatic-configured text model credential selected through `generativeModelName`
 * - Image generation model for `ImageGenNode_535` — creates image output for `image` mode — requires a Lamatic-configured image model credential selected through `imageGenModelName`
 *
 * ### Environment Variables
 * - `AGENTIC_GENERATE_CONTENT` — deployed flow ID used by the external application to invoke this flow — used by the caller outside the flow, corresponding to this flow deployment
 * - `LAMATIC_API_URL` — base URL for Lamatic API access — used by the external caller to reach the `API Request` trigger
 * - `LAMATIC_PROJECT_ID` — Lamatic project scoping for API invocation — used by the external caller to invoke this flow instance
 * - `LAMATIC_API_KEY` — authentication for Lamatic API calls — used by the external caller to invoke the `API Request` node
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - This is the runtime entry point for the flow. It receives the incoming API payload and exposes fields such as `mode` and `instructions` to downstream nodes.
 *    - The trigger is configured for realtime response behaviour, so the flow executes synchronously from request to final API response.
 *
 * 2. `Condition` (`conditionNode`)
 *    - This node inspects `{{triggerNode_1.output.mode}}` and routes execution into one of four branches.
 *    - If `mode` equals `text`, it sends the request to `Text`.
 *    - If `mode` equals `image`, it sends the request to `Generate Image`.
 *    - If `mode` equals `json`, it sends the request to `JSON`.
 *    - Any other value falls through to `Invalid Mode`.
 *
 * 3. `Text` (`LLMNode`)
 *    - This branch handles `text` mode generation.
 *    - It calls a configured chat-capable text model using the referenced `text_system` system prompt and `agentic_generate_content_text_user` user prompt.
 *    - Its model, message, attachment, credential, and memory configuration are all sourced from `@model-configs/agentic-generate-content_text.ts`, which means the exact provider-specific details are abstracted out of the flow source.
 *    - The node produces the raw text-generation result that is sent directly to `Finalise Output`.
 *
 * 4. `JSON` (`LLMNode`)
 *    - This branch handles `json` mode generation.
 *    - It calls a configured chat text model with the referenced `json_system` system prompt and `agentic_generate_content_json_user` user prompt, aiming to produce JSON-oriented output rather than plain prose.
 *    - As with the text branch, operational model settings are resolved through `@model-configs/agentic-generate-content_json.ts`.
 *    - Its output is not returned immediately; it is first sent to `Parse JSON` for post-processing.
 *
 * 5. `Parse JSON` (`codeNode`)
 *    - This code step runs only after the `JSON` branch.
 *    - It uses the script `@scripts/agentic-generate-content_parse-json.ts` to transform or validate the raw model output into a parsed JSON structure suitable for a cleaner final response.
 *    - This step is the branch-specific safeguard that distinguishes `json` mode from plain text generation.
 *
 * 6. `Generate Image` (`ImageGenNode`)
 *    - This branch handles `image` mode generation.
 *    - It calls the configured image-generation model using the `generate_image_system` system prompt and `agentic_generate_content_generate-image_user` user prompt.
 *    - The actual image model selection comes from `@model-configs/agentic-generate-content_generate-image.ts` through the private input `imageGenModelName`.
 *    - The resulting image-generation payload is then passed to `Finalise Output`.
 *
 * 7. `Invalid Mode` (`codeNode`)
 *    - This branch runs when `mode` does not match `text`, `json`, or `image`.
 *    - It executes `@scripts/agentic-generate-content_invalid-mode.ts` to produce an explicit invalid-mode result rather than letting the flow fail silently.
 *    - Its output is also sent to `Finalise Output`, ensuring all branches converge on a common response pathway.
 *
 * 8. `Finalise Output` (`codeNode`)
 *    - This node is the convergence point for all branches.
 *    - It executes `@scripts/agentic-generate-content_finalise-output.ts` to normalise the branch output into the final API payload shape expected by the response mapping.
 *    - Because every branch feeds into this node, it is the final place where text output, parsed JSON, image output, or invalid-mode messaging is packaged consistently.
 *
 * 9. `API Response` (`responseNode`)
 *    - This node returns the flow result to the caller.
 *    - Its output mapping sets the response field `answer` to `{{codeNode_136.output}}`, making the finaliser's output the canonical API response body for this flow.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow returns an invalid-mode style response instead of generated content | `mode` was not one of `text`, `json`, or `image` | Validate `mode` before invocation and send one of the supported literal values |
 * | No useful content is returned in `text` mode | `instructions` was empty, too vague, or the configured text model is unavailable | Ensure `instructions` is non-empty and meaningful, then verify the model configured for `LLMNode_430` is deployed and credentialed |
 * | JSON branch fails or returns malformed structured content | The model produced non-JSON output or formatting that the parse script could not handle | Strengthen caller instructions, review the JSON prompts, and verify the script `agentic-generate-content_parse-json.ts` matches the model's output style |
 * | Image branch returns empty or failed output | No valid image model is configured or provider credentials for `ImageGenNode_535` are missing | Configure a supported image-generation provider in Lamatic and bind it to `imageGenModelName` |
 * | API invocation fails before the flow runs | Lamatic API credentials or project configuration are missing in the calling app | Set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and `AGENTIC_GENERATE_CONTENT` correctly in the environment |
 * | The caller cannot find the expected response field | The application expects a branch-specific field rather than the canonical response mapping | Read the response from top-level `answer`; if branch-specific typing is needed, add client-side handling per mode |
 * | Output shape differs across modes | `answer` is finalised from different branch payloads and may not be uniform across `text`, `json`, and `image` | Treat `mode` as part of the contract and deserialize `answer` according to the requested branch |
 * | Invocation from another orchestration layer fails due to missing context | An upstream system did not pass `instructions` and `mode` when chaining into this flow | Ensure any upstream caller forwards the required trigger payload explicitly; no prior Lamatic flow populates it automatically |
 * | Generation fails after deployment changes | Model config, prompt references, or credentials in Lamatic Studio no longer match the deployed environment | Reconcile the referenced model configs and prompts, redeploy the flow, and retest each branch with representative inputs |
 *
 * ## Notes
 * - The flow's metadata includes a `testInput` of `{"mode": "text", "instructions": "write me a poem on AI"}`, which is a useful smoke test for verifying the text branch after deployment.
 * - The text and JSON branches both use `LLMNode` nodes, but they are intentionally separated so that prompts, model settings, and post-processing can diverge by output type.
 * - The JSON branch is more operationally fragile than the text branch because it depends on both generation quality and a subsequent parsing script.
 * - The response node always returns a single mapped field, `answer`, which simplifies client integration but means consumers should rely on the requested `mode` to interpret the payload correctly.
 * - Although the README describes markdown rendering support in the UI, markdown formatting is an application concern; this flow simply generates and returns the content produced by its configured prompts and models.
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
