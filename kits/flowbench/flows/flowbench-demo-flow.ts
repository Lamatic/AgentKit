// Flow: my-first-flow

// -- Meta --
export const meta = {
  "name": "FlowBench Demo Flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Bharath Reddy",
    "email": "bharathreddi24@gmail.com"
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
    "my_first_flow_llm_node_system_0": "@prompts/flowbench-demo-flow_llm-node_system_0.md",
    "my_first_flow_llm_node_user_1": "@prompts/flowbench-demo-flow_llm-node_user_1.md"
  },
  "modelConfigs": {
    "my_first_flow_llm_node_generative_model_name": "@model-configs/flowbench-demo-flow_llm-node_generative-model-name.ts"
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
        "advance_schema": "{\"userPrompt\":\"string\"}"
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
            "id": "aab5cc97-bada-4403-a975-d2749c56da76",
            "role": "system",
            "content": "@prompts/flowbench-demo-flow_llm-node_system_0.md"
          },
          {
            "id": "fbdd6251-7771-48d0-975b-447a22de370c",
            "role": "user",
            "content": "@prompts/flowbench-demo-flow_llm-node_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flowbench-demo-flow_llm-node_generative-model-name.ts"
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
