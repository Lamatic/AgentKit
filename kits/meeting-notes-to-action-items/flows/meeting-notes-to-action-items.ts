/*
 * # Meeting Notes to Action Items
 * A flow that turns raw meeting notes into structured action-item context and a polished follow-up report, serving as the single API-driven execution path for this agent kit.
 *
 * ## Purpose
 * This flow is responsible for converting unstructured meeting notes into something both machines and humans can act on. It accepts the raw notes from an API caller, uses a schema-constrained LLM step to extract the actionable content into structured form, and then uses a second text-generation step to turn that structured interpretation into a readable report suitable for follow-up communication.
 *
 * The outcome is a single response field containing a generated report based on the meeting discussion and implied next steps. That matters because the broader agent pipeline is designed to improve post-meeting execution in two ways: by identifying commitments clearly and by producing communication that can be sent or adapted immediately. Even though this flow only returns the final report over its API boundary, its internal first stage ensures the second stage is grounded in a stricter intermediate representation rather than only free-form summarization.
 *
 * Within the wider system, this flow is the entry-point and the whole operational pipeline, not one branch among many. In plan-extract-compose terms, it covers both extraction and synthesis: the `Generate JSON` node performs the structured extraction pass, and the `Generate Text` node performs the human-readable composition pass. It is intended to be invoked directly by an application, automation, or operator workflow that already has meeting notes ready for processing.
 *
 * ## When To Use
 * - Use when you have completed meeting notes and need a follow-up summary with clear action items.
 * - Use when an external app, internal tool, or operator wants to submit `meeting_notes` over an API and receive a ready-to-share report.
 * - Use when you want the action-item generation step to be grounded in an intermediate structured extraction rather than relying on a single free-form summarization prompt.
 * - Use when `participants` information is available and should be incorporated into extraction or phrasing, even if provided as plain text.
 * - Use when this agent kit is being used as the first and only execution flow in a meeting follow-up workflow.
 *
 * ## When Not To Use
 * - Do not use when there are no actual meeting notes yet, or the input is only a topic, agenda, or a short instruction without substantive discussion content.
 * - Do not use when the required `meeting_notes` field is missing or empty.
 * - Do not use when you need a machine-readable JSON payload returned directly from the API response; this flow internally creates structured data but returns only a text `report` field.
 * - Do not use when the source material is an audio file, transcript attachment, or binary document that has not already been converted into text.
 * - Do not use when another system is expected to perform upstream transcription, OCR, diarization, or note normalization first and that prerequisite step has not run.
 * - Do not use when model configuration for either LLM node has not been supplied, since both generation stages require private model inputs.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `meeting_notes` | `string` | Yes | Raw meeting notes text submitted by the caller. This is the primary source material the flow analyzes to extract commitments, decisions, and next steps. |
 * | `participants` | `string` | No | Optional participant information, typically names, roles, or a plain-text participant list that helps the model infer owners and frame the follow-up report. |
 *
 * The trigger schema expects both fields as text values, with `meeting_notes` required and `participants` optional. The flow does not define explicit length limits in its configuration, but practical limits are imposed by the selected models' context windows. Best results come from coherent notes in natural language rather than fragments, placeholders, or highly ambiguous bullet scraps.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `report` | `string` | The generated natural-language follow-up report produced by the `Generate Text` node and returned by the API response node. |
 *
 * The response format is a JSON object containing a single text field, `report`. That field is prose, not a structured list or typed object. Its completeness depends on the quality and coverage of the original notes and on how well the first extraction stage identifies actionable content. Because only the final text output is returned, any intermediate structured JSON produced inside the flow is not exposed to the caller unless the flow is modified.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This flow is a standalone entry-point flow. No other Lamatic flow must run before it.
 *
 * The only prerequisite is that the caller or surrounding application must already have produced the trigger payload this flow expects:
 * - `meeting_notes` must already exist as plain text.
 * - `participants`, if used, must already be assembled into plain text.
 *
 * If your broader system includes transcription, note capture, document parsing, or meeting ingestion, those happen outside this flow and must complete before invocation.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are defined in the provided kit. This flow terminates at its own `API Response` node.
 *
 * In practice, external systems may consume the returned `report` field for:
 * - follow-up email drafting or sending
 * - CRM or project-management updates
 * - human review in an operator console
 *
 * ### External Services
 * - Lamatic API trigger runtime — receives the inbound API request and exposes trigger fields to the flow — no explicit credential defined inside this flow
 * - Instructor-compatible text generation model — used by `Generate JSON` to produce schema-constrained structured extraction — configured through the private `generativeModelName` input on `InstructorLLMNode_954`
 * - Chat/text generation model — used by `Generate Text` to turn the extracted structure into final prose — configured through the private `generativeModelName` input on `LLMNode_456`
 * - Lamatic prompt and model-config resource loader — resolves referenced prompt files, default constitution, and model configuration assets — no explicit per-flow credential exposed
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Model provider credentials may still be required indirectly by the selected model configurations for `InstructorLLMNode_954` and `LLMNode_456`, but they are not named in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode` trigger)
 *    - This node receives the inbound API call and defines the request shape the rest of the flow expects.
 *    - It exposes `meeting_notes` and `participants` to downstream nodes as trigger outputs.
 *    - The flow is configured for a realtime response pattern, so the caller waits for the full pipeline to complete before receiving the result.
 *
 * 2. `Generate JSON` (`InstructorLLMNode`)
 *    - This node is the structured extraction stage.
 *    - It reads the incoming `meeting_notes` and optional `participants` from the trigger payload through its referenced prompts.
 *    - Its schema indicates that the model is expected to work with an object containing `meeting_notes` and `participants`, with `meeting_notes` treated as required.
 *    - Because this is an Instructor-style node, it is intended to enforce or strongly steer output into a structured JSON-compatible shape before passing its result downstream.
 *    - This stage improves reliability by separating factual/action extraction from final wording.
 *
 * 3. `Generate Text` (`LLMNode`)
 *    - This node performs the natural-language synthesis step.
 *    - It consumes the output of the previous structured stage through its configured prompts and model settings.
 *    - Its job is to turn the extracted action-oriented understanding of the meeting into polished prose suitable for a report or follow-up message.
 *    - The node's generated text is emitted as `generatedResponse`, which is the only downstream value explicitly mapped into the API response.
 *
 * 4. `API Response` (`graphqlResponseNode`)
 *    - This node waits on `LLMNode_456` and returns the final response to the caller.
 *    - It sets the response content type to JSON.
 *    - Its output mapping creates a response object with one field, `report`, populated from `{{LLMNode_456.output.generatedResponse}}`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before generation starts | The caller omitted `meeting_notes` or sent an invalid payload shape | Send a JSON payload that includes `meeting_notes` as a non-empty string and `participants` as a string if provided |
 * | `report` is empty, vague, or low quality | The meeting notes were too sparse, ambiguous, or lacked explicit decisions and owners | Provide fuller notes with concrete decisions, next steps, and participant context |
 * | Flow cannot run either LLM stage | The private model input for `InstructorLLMNode_954` or `LLMNode_456` has not been configured | Configure valid `generativeModelName` selections for both nodes before deployment or invocation |
 * | Structured extraction behaves unexpectedly | The first-stage prompt/model combination cannot confidently infer action items from the notes | Improve note quality, include `participants`, or adjust the referenced extraction prompts and model config |
 * | Final report does not reflect expected structure | The second stage generated prose from incomplete or imperfect extracted context | Inspect and tune both the JSON-generation and text-generation prompts together rather than only the final stage |
 * | Caller expected JSON action items but only received text | The response node maps only `LLMNode_456.output.generatedResponse` to `report` | Modify the response mapping if you need the intermediate structured output returned alongside the final prose |
 * | Invocation from a larger workflow fails | An upstream non-Lamatic step such as transcription or note assembly did not run or produced unusable text | Ensure upstream systems complete successfully and pass normalized plain-text notes into this flow |
 * | Generation errors occur intermittently | Model provider limits, latency, or unsupported model settings in the referenced model configs | Verify provider credentials, model availability, and the settings referenced by both model config assets |
 *
 * ## Notes
 * - The flow references the default constitution, so global guardrails may influence both generation stages even though the response surface is simple.
 * - Metadata fields such as description, tags, and test input are blank in the flow source, so operational intent should be inferred from node names, prompts, and the parent agent documentation.
 * - The internal structured output from `Generate JSON` is part of the processing pipeline but is not returned to the API caller by default.
 * - The trigger schema treats `participants` as a string rather than a typed array, so callers should serialize participant lists into readable text if they have richer source data.
 * - Because the flow executes synchronously in realtime mode, large notes or slower models may increase end-to-end latency for callers.
 */

// Flow: meeting-notes-to-action-items

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Meeting Notes to Action Items",
  "description": "",
  "tags": "",
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_954": [
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
  "LLMNode_456": [
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
    "meeting_notes_to_action_items_generate_json_system": "@prompts/meeting-notes-to-action-items_generate-json_system.md",
    "meeting_notes_to_action_items_generate_json_user": "@prompts/meeting-notes-to-action-items_generate-json_user.md",
    "meeting_notes_to_action_items_generate_text_system": "@prompts/meeting-notes-to-action-items_generate-text_system.md",
    "meeting_notes_to_action_items_generate_text_user": "@prompts/meeting-notes-to-action-items_generate-text_user.md"
  },
  "modelConfigs": {
    "meeting_notes_to_action_items_generate_json": "@model-configs/meeting-notes-to-action-items_generate-json.ts",
    "meeting_notes_to_action_items_generate_text": "@model-configs/meeting-notes-to-action-items_generate-text.ts"
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
        "advance_schema": "{\n  \"meeting_notes\": \"string\",\n  \"participants\": \"string\"\n}"
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
    "selected": true
  },
  {
    "id": "InstructorLLMNode_954",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_954",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"meeting_notes\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"participants\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/meeting-notes-to-action-items_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/meeting-notes-to-action-items_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/meeting-notes-to-action-items_generate-json.ts",
        "messages": "@model-configs/meeting-notes-to-action-items_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/meeting-notes-to-action-items_generate-json.ts",
        "generativeModelName": "@model-configs/meeting-notes-to-action-items_generate-json.ts"
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
    "id": "LLMNode_456",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_456",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/meeting-notes-to-action-items_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/meeting-notes-to-action-items_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/meeting-notes-to-action-items_generate-text.ts",
        "messages": "@model-configs/meeting-notes-to-action-items_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/meeting-notes-to-action-items_generate-text.ts",
        "credentials": "@model-configs/meeting-notes-to-action-items_generate-text.ts",
        "generativeModelName": "@model-configs/meeting-notes-to-action-items_generate-text.ts"
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
        "needs": [
          "LLMNode_456"
        ],
        "outputMapping": "{\n  \"report\": \"{{LLMNode_456.output.generatedResponse}}\"\n}"
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
      "y": 390
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_954-795",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_954",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_954-LLMNode_456-123",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_954",
    "target": "LLMNode_456",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_456-responseNode_triggerNode_1-550",
    "type": "defaultEdge",
    "source": "LLMNode_456",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "selected": false,
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
