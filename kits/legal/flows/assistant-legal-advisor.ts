/*
 * # legal assistant bot
 * A chat-triggered legal information flow that accepts an end user's question, performs two sequential LLM generation passes, and returns a disclaimer-oriented legal guidance response as the primary end-user interaction path in the wider Legal Assistant system.
 *
 * ## Purpose
 * This flow is responsible for handling direct conversational legal-information requests from the embedded chat experience. Its job is to take a free-text user message, normalize a small set of session variables, and pass that context through a two-stage text generation sequence that produces a user-facing answer. In the kit-level design, this is the core execution path that turns an ambiguous legal question into an informational response without positioning itself as a substitute for professional legal counsel.
 *
 * The outcome of the flow is a single chat response returned to the widget user. That response is expected, by the surrounding kit design and prompt assets, to orient the user to the likely legal issue, provide context-aware informational guidance, suggest next steps, and maintain a clear legal disclaimer. This matters because the broader system is designed to reduce uncertainty for users who do not know where to begin, while preserving safety boundaries around legal advice, confidentiality, and jurisdictional uncertainty.
 *
 * Within the wider agent pipeline, this flow is both the entry point and the synthesizer. There is no separate retrieval or classification flow wired ahead of it in the exported graph; instead, the flow receives the raw user turn, structures key variables, and relies on two chained LLM nodes to transform that input into a final response. In other words, this flow collapses intake, lightweight normalization, intermediate drafting, and final synthesis into one deployed conversational path.
 *
 * ## When To Use
 * - Use when an end user submits a legal question through the Lamatic Chat Widget configured for this flow.
 * - Use when the caller wants the default interactive legal assistant experience provided by the Next.js kit.
 * - Use when the input is free-form natural-language text such as a legal problem description, request for orientation, request for likely legal area, or request for practical next steps.
 * - Use when the system should return a single conversational answer rather than a structured API object.
 * - Use when no separate upstream retrieval or classification flow has been configured and the assistant should handle the question end to end.
 * - Use when conversational continuity matters and the runtime should preserve user and session identity from the chat trigger into the model configuration.
 *
 * ## When Not To Use
 * - Do not use when the invocation path requires an API Request trigger for server-side orchestration; the README explicitly notes that server orchestration expects a different trigger type.
 * - Do not use when there is no deployed Lamatic Chat Widget configuration bound to this flow.
 * - Do not use when the input is not a conversational chat message, such as a batch job, webhook payload, document-processing request, or strongly structured JSON contract.
 * - Do not use when Lamatic project credentials, deployment, or configured LLM provider are missing; the flow depends on Lamatic runtime and model access.
 * - Do not use when a sibling or replacement flow has been created specifically for retrieval-augmented legal references, jurisdiction-specific logic, or server-side `executeFlow` calls.
 * - Do not use when the user expects formal legal representation, privileged intake, or authoritative legal advice; this flow is designed for informational guidance only.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `chatMessage` | `string` | Yes | The end user's free-text legal question or follow-up message submitted through the chat widget trigger. |
 * | `userId` | `string` | No | A user identifier emitted by the chat widget trigger and mapped into the flow as `user_id` for downstream model context. |
 * | `sessionId` | `string` | No | A conversation or session identifier emitted by the chat widget trigger and mapped into the flow as `session_id` for continuity across turns. |
 *
 * Below the trigger, the flow assumes the primary payload is natural-language text. No explicit max length, language restriction, or schema validation is encoded in the flow source, but meaningful output depends on `chatMessage` being non-empty and understandable by the selected chat model. The trigger also passes `userId` and `sessionId` through as strings when available; callers should minimize sensitive information and avoid sending confidential or personally identifying data unless governance and retention policies have been reviewed.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `content` | `string` | The final chat response returned to the widget user, sourced from `LLMNode_496.output.generatedResponse`. |
 *
 * The flow returns a single prose response suitable for direct display in a chat UI. It is not a structured legal object, citation list, or machine-oriented schema. Completeness depends on the prompt assets and model behavior, and the answer may vary by provider, model configuration, or conversation history defined in the referenced model config. If the model produces a partial or overly brief answer, the response node will still return that text as-is.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow in the current kit. No other Lamatic flow must run before it.
 *
 * Its operational prerequisite is the chat widget runtime itself, which must provide the trigger payload fields consumed here:
 * - `triggerNode_1.output.chatMessage` mapped to `user_message`
 * - `triggerNode_1.output.userId` mapped to `user_id`
 * - `triggerNode_1.output.sessionId` mapped to `session_id`
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are shown as consumers of this flow's output in the provided graph or parent agent definition.
 *
 * The practical downstream consumer is the chat UI bound to the Chat Widget trigger, which displays the returned `content` field to the end user.
 *
 * ### External Services
 * - Lamatic Chat Widget runtime — receives end-user chat input and starts the flow — requires a deployed Lamatic project and flow binding
 * - Configured text-generation model provider via Lamatic — used by `LLMNode_615` for the first generation pass — requires the model credentials selected in Lamatic for `generativeModelName`
 * - Configured text-generation model provider via Lamatic — used by `LLMNode_496` for the second generation pass — requires the model credentials selected in Lamatic for `generativeModelName`
 * - Prompt assets referenced from the flow package — provide the system and user instructions used by both LLM nodes — no separate credential, but the referenced files must exist and be deployed
 * - Model configuration asset `assistant_legal_advisor_generate-text` — supplies messages, memories, attachments, credentials, and selected model binding for both LLM nodes — no direct environment variable inside the flow file, but it must resolve correctly at runtime
 *
 * ### Environment Variables
 * - `ASSISTANT_LEGAL_ADVISOR` — deployed flow identifier used by the surrounding Next.js kit to invoke the correct Lamatic flow — used outside the graph by the application that calls this flow
 * - `LAMATIC_API_URL` — Lamatic API base URL for flow execution from the application layer — used outside the graph by the application that invokes this flow
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated flow access — used outside the graph by the application that invokes this flow
 * - `LAMATIC_API_KEY` — Lamatic API credential for invoking the deployed flow — used outside the graph by the application that invokes this flow
 *
 * ## Node Walkthrough
 * 1. `Chat Widget` (`triggerNode`)
 *    - This is the flow's entry point. It listens for a conversational turn submitted from the configured Lamatic chat widget and exposes the incoming `chatMessage`, `userId`, and `sessionId` values to the rest of the graph. The widget configuration is referenced from `@triggers/widgets/assistant-legal-advisor_chat-widget.ts`, so the trigger behavior and allowed domains are controlled there rather than inline in the flow file.
 *
 * 2. `Variables` (`dynamicNode`)
 *    - This node normalizes the trigger payload into explicit downstream variables. It maps `triggerNode_1.output.chatMessage` into `user_message`, `triggerNode_1.output.userId` into `user_id`, and `triggerNode_1.output.sessionId` into `session_id`. Its role is not transformation-heavy; it creates a stable naming layer that the prompt and model configuration can reliably reference.
 *
 * 3. `Generate Text` at `LLMNode_615` (`dynamicNode`)
 *    - This is the first LLM generation pass. It uses the shared system prompt `@prompts/assistant-legal-advisor_generate-text_system.md` and user prompt `@prompts/assistant-legal-advisor_generate-text_user.md`, along with the shared model configuration asset `@model-configs/assistant-legal-advisor_generate-text.ts`. Because both `messages` and `memories` are also sourced from that model config, this node likely incorporates chat history and any configured conversation state when drafting its response. In practice, this first pass serves as an intermediate synthesis step from the normalized user input.
 *
 * 4. `Generate Text` at `LLMNode_496` (`dynamicNode`)
 *    - This is the second LLM generation pass and the direct source of the final answer. It uses the same referenced prompts and the same model configuration class as the first pass, but it runs after `LLMNode_615`, so it can build on the prior node's execution context as defined by Lamatic's node chaining behavior and shared message/memory config. This staged design suggests a refinement pattern: the flow does not respond after the first draft, but instead performs a second model call before emitting the user-visible answer.
 *
 * 5. `Chat Response` (`responseNode`)
 *    - This node returns the final response to the chat client. Its `content` is bound directly to `{{LLMNode_496.output.generatedResponse}}`, meaning the end user sees exactly the second LLM node's generated text. No post-processing, branching, citation formatting, or structured response assembly is performed after this point.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | No response is returned to the chat widget | The flow is not deployed correctly, the widget trigger is not bound to the deployed flow, or the response node is unreachable due to runtime failure in an upstream node | Verify the Lamatic deployment, confirm the chat widget points to this flow, and inspect run logs for failures in `Variables`, `LLMNode_615`, or `LLMNode_496` |
 * | Model node fails before generating text | `generativeModelName` is not configured, the provider credential is missing or invalid, or the referenced model config cannot resolve | In Lamatic, configure a valid chat-capable text-generation model for both LLM inputs and confirm provider credentials in `@model-configs/assistant-legal-advisor_generate-text.ts` |
 * | Response is empty or trivial | The user submitted an empty or extremely vague `chatMessage`, the prompt assets are incomplete, or the model returned a low-information answer | Validate that the trigger sends a non-empty message, review the prompt files, and consider tightening prompt instructions or model settings in the model config |
 * | Conversation continuity is inconsistent across turns | `userId` or `sessionId` is missing, unstable, or not being passed consistently by the chat widget | Ensure the widget emits persistent identifiers and that the model config actually uses `user_id` and `session_id` for memory scoping |
 * | Invocation from server-side code does not work as expected | This exported flow uses a Chat Widget trigger, while the README notes that server orchestration expects an API Request trigger flow | Create or deploy a separate API-triggered variant for server-side `executeFlow` usage rather than calling this chat-triggered flow directly |
 * | Output lacks the expected disclaimer or legal-safety framing | The disclaimer is prompt-driven rather than enforced in a post-processing node, so prompt or model changes may weaken it | Review `assistant-legal-advisor_generate-text_system.md` and related prompt assets to ensure disclaimer language remains explicit and durable |
 * | Runtime fails due to missing referenced assets | One or more referenced prompt, trigger, or model-config files are absent, misnamed, or not included in deployment | Confirm that all files listed under `references` are present and packaged with the deployed flow |
 * | Upstream flow not having run | A caller assumes this flow consumes outputs from a prior Lamatic flow, but this graph is actually an entry point and expects raw chat-trigger input | Route raw end-user chat into this flow directly, or build an explicit upstream flow and new trigger contract if multi-flow chaining is required |
 *
 * ## Notes
 * - Both LLM nodes are named `Generate Text`, but they are distinct runtime nodes identified as `LLMNode_615` and `LLMNode_496`. When debugging, use the IDs rather than the shared display name.
 * - The flow contains no conditional branches, retrieval connectors, tool calls, or explicit citation assembly. Any classification, reference selection, disclaimer behavior, and response structure must therefore come from the prompt and model configuration layers.
 * - The same prompt pair and the same model config are used in both generation steps. If you change one stage's prompt behavior, consider whether both nodes should still remain identical or whether the first and second passes should be specialized.
 * - A `constitutions` reference exists in the flow package, but no node in the provided graph explicitly reads from it. If constitutional or source material grounding is expected, verify whether that reference is consumed indirectly through the prompt or model config assets.
 * - Because the final response is taken directly from `LLMNode_496.output.generatedResponse`, there is no deterministic formatting guardrail in the graph itself. If the consuming UI requires stricter structure, add a formatter node or move to a schema-constrained generation pattern.
 */

// Flow: assistant-legal-advisor

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "legal assistant bot",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_615": [
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
  "LLMNode_496": [
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
    "assistant_legal_advisor_generate_text_system": "@prompts/assistant-legal-advisor_generate-text_system.md",
    "assistant_legal_advisor_generate_text_user": "@prompts/assistant-legal-advisor_generate-text_user.md"
  },
  "modelConfigs": {
    "assistant_legal_advisor_generate_text": "@model-configs/assistant-legal-advisor_generate-text.ts"
  },
  "triggers": {
    "assistant_legal_advisor_chat_widget": "@triggers/widgets/assistant-legal-advisor_chat-widget.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "chatTriggerNode",
      "values": {
        "chat": "",
        "domains": "@triggers/widgets/assistant-legal-advisor_chat-widget.ts",
        "nodeName": "Chat Widget",
        "chatConfig": "@triggers/widgets/assistant-legal-advisor_chat-widget.ts"
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
    "id": "variablesNode_566",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "variablesNode",
      "values": {
        "mapping": "{\n  \"user_message\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.chatMessage}}\"\n  },\n  \"user_id\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.userId}}\"\n  },\n  \"session_id\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.sessionId}}\"\n  }\n}",
        "nodeName": "Variables"
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
    "id": "LLMNode_615",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_615",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/assistant-legal-advisor_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/assistant-legal-advisor_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "messages": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "credentials": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "generativeModelName": "@model-configs/assistant-legal-advisor_generate-text.ts"
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
    "id": "LLMNode_496",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_496",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/assistant-legal-advisor_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/assistant-legal-advisor_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "messages": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "credentials": "@model-configs/assistant-legal-advisor_generate-text.ts",
        "generativeModelName": "@model-configs/assistant-legal-advisor_generate-text.ts"
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
    "selected": true
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "chatResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "content": "{{LLMNode_496.output.generatedResponse}}",
        "nodeName": "Chat Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
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
      "y": 520
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-variablesNode_566",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_566",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_566-LLMNode_615",
    "type": "defaultEdge",
    "source": "variablesNode_566",
    "target": "LLMNode_615",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_615-LLMNode_496",
    "type": "defaultEdge",
    "source": "LLMNode_615",
    "target": "LLMNode_496",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_496-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_496",
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
  }
];

export default { meta, inputs, references, nodes, edges };
