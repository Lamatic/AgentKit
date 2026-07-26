// Flow: analyze-expenses

// -- Meta --
export const meta = {
  "name": "analyze-expenses",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naveenkumar.v",
    "email": "naveenkumar.v1324@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_233": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_876": [
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
    "analyze_expenses_llmnode_233_system_0": "@prompts/analyze-expenses_llmnode-233_system_0.md",
    "analyze_expenses_llmnode_233_user_1": "@prompts/analyze-expenses_llmnode-233_user_1.md",
    "analyze_expenses_llmnode_876_system_0": "@prompts/analyze-expenses_llmnode-876_system_0.md",
    "analyze_expenses_llmnode_876_user_1": "@prompts/analyze-expenses_llmnode-876_user_1.md"
  },
  "modelConfigs": {
    "analyze_expenses_llmnode_233_generative_model_name": "@model-configs/analyze-expenses_llmnode-233_generative-model-name.ts",
    "analyze_expenses_llmnode_876_generative_model_name": "@model-configs/analyze-expenses_llmnode-876_generative-model-name.ts"
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
        "advance_schema": "{\n  \"transactionText\": \"string\",\n  \"currency\": \"string\",\n  \"requestId\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_233",
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
            "content": "@prompts/analyze-expenses_llmnode-233_system_0.md"
          },
          {
            "id": "bd775063-dfcb-495f-ad14-87dd92f8ae50",
            "role": "user",
            "content": "@prompts/analyze-expenses_llmnode-233_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "modelLogic": [],
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/analyze-expenses_llmnode-233_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_876",
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
            "content": "@prompts/analyze-expenses_llmnode-876_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/analyze-expenses_llmnode-876_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "LLM",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/analyze-expenses_llmnode-876_generative-model-name.ts"
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
        "outputMapping": "{\n  \"transactions\": \"{{LLMNode_233.output.generatedResponse}}\",\n  \"insight\": \"{{LLMNode_876.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_233",
    "source": "triggerNode_1",
    "target": "LLMNode_233",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_233-LLMNode_876",
    "source": "LLMNode_233",
    "target": "LLMNode_876",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_876-responseNode_triggerNode_1",
    "source": "LLMNode_876",
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
