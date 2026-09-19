/*
 * # Demo Fallback
 * Fallback demo flow for the Flowcell resilient client. Same contract as
 * `demo-primary` (`query` in, `{ answer }` out) but answers briefly and prefixes
 * responses with "[fallback]" so callers can distinguish the path.
 *
 * ## Purpose
 * Acts as the degraded-but-available path Flowcell routes to when the primary is
 * retry-exhausted or the circuit breaker is open. Kept intentionally cheap and
 * simple so it stays up when the primary is down. Verified live: returns
 * `[fallback]`-prefixed answers.
 *
 * ## When To Use
 * - Automatically invoked by `resilientClient.execute()` on primary failure.
 * - Use directly when you want the low-cost degraded answer.
 *
 * ## When Not To Use
 * - Do not use as the first-choice path when the primary is healthy.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `query` | `string` | Yes | User query supplied to the trigger and passed into the LLM node. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` | Brief fallback answer prefixed with "[fallback]". |
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. Invoked by the resilient client (or directly via API).
 *
 * ### Downstream Flows
 * - None. Returns directly to the caller.
 *
 * ### External Services
 * - Gemini (`gemini-3.5-flash-lite`) via `LLMNode` — see `@model-configs/demo-fallback_llmnode-660_generative-model-name.ts`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives `{ query }`.
 * 2. `Generate Text` (`LLMNode_660`) — fallback prompts from `@prompts/...`, reading `{{triggerNode_1.output.query}}`.
 * 3. `API Response` (`graphqlResponseNode`) — maps `{ answer }` from `{{LLMNode_660.output.generatedResponse}}`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Empty answer | Missing `query` in trigger payload | Send a non-empty `query` string. |
 * | LLM node fails | Missing provider credentials | Verify the model-config credentials. |
 */

// Flow: demo-fallback

// -- Meta --
export const meta = {
  "name": "Demo Fallback",
  "description": "Fallback demo flow for Flowcell: cheap degraded answer path used when primary fails.",
  "tags": [
    "reliability",
    "resilience"
  ],
  "testInput": {
    "query": "What is a circuit breaker?"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Krish Anand",
    "email": "Krishanand974@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_660": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "demo_fallback_llmnode_660_system_0": "@prompts/demo-fallback_llmnode-660_system_0.md",
    "demo_fallback_llmnode_660_user_1": "@prompts/demo-fallback_llmnode-660_user_1.md"
  },
  "modelConfigs": {
    "demo_fallback_llmnode_660_generative_model_name": "@model-configs/demo-fallback_llmnode-660_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"query\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_660",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/demo-fallback_llmnode-660_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/demo-fallback_llmnode-660_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/demo-fallback_llmnode-660_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_660.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_660",
    "source": "triggerNode_1",
    "target": "LLMNode_660",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_660-responseNode_triggerNode_1",
    "source": "LLMNode_660",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
