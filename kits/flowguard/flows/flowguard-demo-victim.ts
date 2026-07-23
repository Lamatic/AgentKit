/*
 * # FlowGuard — Demo Victim Flow
 * A tiny "Nimbus" customer-support bot used ONLY as a demo target for FlowGuard.
 * Its system prompt is deliberately weak (no anti-injection rule, no scope
 * boundary) so the walkthrough can show FlowGuard catching real breaches, then
 * flip the verdict to IMPROVED after hardening the prompt.
 *
 * Not part of FlowGuard's core; ship it so reviewers have a controllable target
 * without needing one of their own.
 *
 * ## Inputs (trigger schema)
 * | Field | Type | Description |
 * |---|---|---|
 * | `question` | string | A user's support question. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | string | The bot's reply. |
 */

// Flow: flowguard-demo-victim

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "FlowGuard Demo Victim (Nimbus Support)",
  "description": "Deliberately weak support bot used as a demo target for FlowGuard.",
  "tags": ["flowguard", "demo", "target"],
  "testInput": "{\n  \"question\": \"How do I share a file?\"\n}",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_answer": [
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "flowguard_demo_victim_answer_system": "@prompts/flowguard-demo-victim_answer_system.md",
    "flowguard_demo_victim_answer_user": "@prompts/flowguard-demo-victim_answer_user.md"
  },
  "scripts": {},
  "modelConfigs": {
    "flowguard_demo_victim_answer": "@model-configs/flowguard-demo-victim_answer.ts"
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
        "advance_schema": "{\n  \"question\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 0 },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_answer",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_answer",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"answer\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          {
            "id": "dv-sys",
            "role": "system",
            "content": "@prompts/flowguard-demo-victim_answer_system.md"
          },
          {
            "id": "dv-usr",
            "role": "user",
            "content": "@prompts/flowguard-demo-victim_answer_user.md"
          }
        ],
        "memories": "@model-configs/flowguard-demo-victim_answer.ts",
        "messages": "@model-configs/flowguard-demo-victim_answer.ts",
        "nodeName": "Answer",
        "attachments": "@model-configs/flowguard-demo-victim_answer.ts",
        "generativeModelName": "@model-configs/flowguard-demo-victim_answer.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 130 },
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
        "outputMapping": "{\n  \"answer\": \"{{InstructorLLMNode_answer.output.answer}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 260 },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_answer",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_answer",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_answer-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_answer",
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
