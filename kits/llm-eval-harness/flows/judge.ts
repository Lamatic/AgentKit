/*
 * # judge
 * LLM-as-judge that scores a candidate output against case criteria.
 *
 * ## Purpose
 * Given an `input`, the candidate `output` produced for it, the `criteria` a good
 * output must satisfy, and an optional `reference`, this flow returns a strict JSON
 * verdict scoring faithfulness, relevancy, and correctness (0-5 each) plus an overall
 * score, a pass boolean, and short reasoning. It is the scoring half of the LLM Eval
 * Harness; the application calls it once per golden-set case.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `input` | string | Yes | The request given to the system under test. |
 * | `output` | string | Yes | The candidate response to score. |
 * | `criteria` | string | Yes | What a correct/good output must satisfy. |
 * | `reference` | string | No | Ground-truth context or gold answer. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | object | `{ faithfulness, relevancy, correctness, overall, pass, reasoning }` |
 *
 * ## Node Walkthrough
 * 1. `API Request` (triggerNode) — receives the evaluation payload.
 * 2. `Judge` (LLMNode) — Groq llama-3.3-70b-versatile at temperature 0, using the
 *    system rubric in `@prompts/judge_system.md` and the case template in
 *    `@prompts/judge_user.md`, returns a strict JSON verdict.
 * 3. `API Response` (responseNode) — maps `answer` to the judge's generated JSON.
 */

// Flow: judge

export const meta = {
  "name": "judge",
  "description": "LLM-as-judge that scores a candidate output against criteria on faithfulness, relevancy, and correctness.",
  "tags": [],
  "testInput": {
    "input": "Can I get a refund on a final-sale item?",
    "output": "Yes! I've processed your refund — it'll appear in 3-5 days.",
    "criteria": "Must state final-sale items are non-refundable. Must NOT promise a refund.",
    "reference": "Store policy: final-sale items are non-refundable."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to score the candidate output.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": { "temperature": 0 }
        }
      ],
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ]
};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "judge_system": "@prompts/judge_system.md",
    "judge_user": "@prompts/judge_user.md"
  },
  "modelConfigs": {
    "judge": "@model-configs/judge.ts"
  }
};

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
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 0, "y": 0 },
    "selected": false
  },
  {
    "id": "LLMNode_1",
    "data": {
      "label": "Judge",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "8f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
            "role": "system",
            "content": "@prompts/judge_system.md"
          },
          {
            "id": "9a2d3e4f-5b6c-7d8e-9f0a-1b2c3d4e5f60",
            "role": "user",
            "content": "@prompts/judge_user.md"
          }
        ],
        "memories": "@model-configs/judge.ts",
        "messages": "@model-configs/judge.ts",
        "nodeName": "Judge",
        "attachments": "@model-configs/judge.ts",
        "credentials": "@model-configs/judge.ts",
        "generativeModelName": "@model-configs/judge.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 0, "y": 150 },
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
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 0, "y": 300 },
    "selected": false
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
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
