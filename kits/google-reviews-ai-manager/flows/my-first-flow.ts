// Flow: my-first-flow

// -- Meta --
export const meta = {
  "name": "My First Flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "toufiq qureshi",
    "email": "toufiqqureshi651@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "llmNode": [
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
    "my_first_flow_llm_node_system_0": "@prompts/my-first-flow_llm-node_system_0.md",
    "my_first_flow_llm_node_user_1": "@prompts/my-first-flow_llm-node_user_1.md"
  },
  "modelConfigs": {
    "my_first_flow_llm_node_generative_model_name": "@model-configs/my-first-flow_llm-node_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "trigger",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "trigger",
        "headers": "",
        "retries": "0",
        "nodeName": "API Request",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": "{\n  \"reviewText\": \"string\",\n  \"starRating\": \"string\"\n}"
      }
    }
  },
  {
    "id": "llmNode",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "llmNode",
        "tools": [],
        "prompts": [
          {
            "id": "40452419-1237-4f27-9e33-5f86f0114276",
            "role": "system",
            "content": "@prompts/my-first-flow_llm-node_system_0.md"
          },
          {
            "id": "83ec945a-2afb-4230-9d75-7967d01058d8",
            "role": "user",
            "content": "@prompts/my-first-flow_llm-node_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/my-first-flow_llm-node_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"response\": \"{{llmNode.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-llmNode",
    "source": "trigger",
    "target": "llmNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "llmNode-responseNode",
    "source": "llmNode",
    "target": "responseNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger",
    "source": "trigger",
    "target": "responseNode",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
