/*
 * # run-target
 * Runs the system-prompt-under-test to produce the output that `judge` then scores.
 *
 * ## Purpose
 * This is the "system under test" half of the LLM Eval Harness. It takes the
 * `systemPrompt` being evaluated and a single case `input`, runs them through an LLM,
 * and returns the generated `answer`. The application calls it once per golden-set
 * case and feeds the result into the `judge` flow.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `systemPrompt` | string | Yes | The prompt being evaluated (used as system message). |
 * | `input` | string | Yes | The case request (used as user message). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | string | The generated output to be scored by `judge`. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (triggerNode) — receives `{ systemPrompt, input }`.
 * 2. `Run Target` (LLMNode) — Groq llama-3.3-70b-versatile at temperature 0.3, using
 *    `@prompts/run-target_system.md` (the passed-in system prompt) and
 *    `@prompts/run-target_user.md` (the case input).
 * 3. `API Response` (responseNode) — maps `answer` to the generated text.
 */

// Flow: run-target

export const meta = {
  "name": "run-target",
  "description": "Runs the system prompt under test against a case input and returns the generated output.",
  "tags": [],
  "testInput": {
    "systemPrompt": "You are a support agent for an e-commerce store. Answer only from provided context. If the answer is unknown, say you'll escalate.",
    "input": "Where is my order #4521?"
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
      "description": "Select the model used to generate the output under test.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": { "temperature": 0.3 }
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
    "run_target_system": "@prompts/run-target_system.md",
    "run_target_user": "@prompts/run-target_user.md"
  },
  "modelConfigs": {
    "run_target": "@model-configs/run-target.ts"
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
      "label": "Run Target",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
            "role": "system",
            "content": "@prompts/run-target_system.md"
          },
          {
            "id": "2b3c4d5e-6f70-8192-a3b4-c5d6e7f80910",
            "role": "user",
            "content": "@prompts/run-target_user.md"
          }
        ],
        "memories": "@model-configs/run-target.ts",
        "messages": "@model-configs/run-target.ts",
        "nodeName": "Run Target",
        "attachments": "@model-configs/run-target.ts",
        "credentials": "@model-configs/run-target.ts",
        "generativeModelName": "@model-configs/run-target.ts"
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
