// Flow: assistant-grammer-correction
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

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
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "generate_json_system": "@prompts/generate-json-system.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
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
        "advance_schema": "{\n  \"text\": \"string\"\n}"
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
            "content": "USER TEXT : {{triggerNode_1.output.text}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": ""
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
