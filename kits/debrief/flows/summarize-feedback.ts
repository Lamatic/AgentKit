/*
 * # Summarize Feedback
 * Single LLM extraction flow that turns raw interview notes (optionally multi-round tagged blobs) into structured JSON with summary, strengths, gaps, and action_items.
 *
 * ## Purpose
 * Solves the problem of messy, unstructured interview feedback scattered across rounds, formats (Slack pastes, prose, fragments) with no quick way to produce a shareable summary. The flow centralizes extraction into one model call so the frontend can stay thin and stateless.
 *
 * ## When To Use
 * - Use when caller has free-form interview notes as `feedback` (string) and wants structured output.
 * - Use when notes contain one blob or multiple tagged rounds (e.g., "Round 1: ...\nRound 2: ...").
 * - Use for candidate-side or interviewer-side feedback summarization.
 *
 * ## When Not To Use
 * - Do not use when input is an image, audio, or file requiring OCR/transcription (non-goal).
 * - Do not use when persistence, auth, or history is expected (stateless flow).
 * - Do not use when feedback is empty; caller should validate before invocation.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `feedback` | `string` | Yes | Raw interview notes, optionally tagged by round. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `summary` | `string` | 1-2 sentence overall summary |
 * | `strengths` | `string[]` | Observable strengths |
 * | `gaps` | `string[]` | Gaps or concerns |
 * | `action_items` | `string[]` | Concrete next steps |
 *
 * Response is returned as `result` JSON string nested under `result` (i.e. `{"result": "{\"summary\":...}"}`) mapped from `{{LLMNode_1.output.generatedResponse}}`; consumers parse `result` to access structured fields.
 *
 * ## Dependencies
 * - Lamatic runtime (API Request / Response)
 * - LLM provider configured for LLMNode_1 via @model-configs/summarize-feedback_extract.ts
 * - Prompts: @prompts/summarize-feedback_extract_system.md and @prompts/summarize-feedback_extract_user.md
 */

// Flow: summarize-feedback

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Summarize Feedback",
  "description": "Single LLM extraction flow that turns raw interview notes into structured summary with strengths, gaps, and action items.",
  "tags": ["interview", "feedback", "summarizer"],
  "testInput": {
    "feedback": "Round 1: Strong system design, clear communication. Struggled with detail on DB indexing.\nRound 2: Good coding speed, missed edge cases in test."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to extract structured feedback.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": { "temperature": 0.2 }
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "summarize_feedback_extract_system": "@prompts/summarize-feedback_extract_system.md",
    "summarize_feedback_extract_user": "@prompts/summarize-feedback_extract_user.md"
  },
  "modelConfigs": {
    "summarize_feedback_extract": "@model-configs/summarize-feedback_extract.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 350,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\"type\":\"object\",\"properties\":{\"feedback\":{\"type\":\"string\"}},\"required\":[\"feedback\"]}"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 350,
      "y": 150
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Extract",
        "tools": [],
        "prompts": [
          {
            "id": "extract-system",
            "role": "system",
            "content": "@prompts/summarize-feedback_extract_system.md"
          },
          {
            "id": "extract-user",
            "role": "user",
            "content": "@prompts/summarize-feedback_extract_user.md"
          }
        ],
        "memories": "@model-configs/summarize-feedback_extract.ts",
        "messages": "@model-configs/summarize-feedback_extract.ts",
        "attachments": "@model-configs/summarize-feedback_extract.ts",
        "credentials": "@model-configs/summarize-feedback_extract.ts",
        "generativeModelName": "@model-configs/summarize-feedback_extract.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 350,
      "y": 300
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "nodeName": "API Response",
        "headers": "{}",
        "retries": "0",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_1-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-triggerNode_1-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
