// Flow: travel

// -- Meta --
export const meta = {
  "name": "Travel",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sujal",
    "email": "lamaticsujal@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_546": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_551": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_380": [
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
    "travel_llmnode_546_system_0": "@prompts/travel_llmnode-546_system_0.md",
    "travel_llmnode_546_user_1": "@prompts/travel_llmnode-546_user_1.md",
    "travel_llmnode_551_system_0": "@prompts/travel_llmnode-551_system_0.md",
    "travel_llmnode_551_user_1": "@prompts/travel_llmnode-551_user_1.md",
    "travel_llmnode_380_system_0": "@prompts/travel_llmnode-380_system_0.md",
    "travel_llmnode_380_user_1": "@prompts/travel_llmnode-380_user_1.md"
  },
  "modelConfigs": {
    "travel_llmnode_546_generative_model_name": "@model-configs/travel_llmnode-546_generative-model-name.ts",
    "travel_llmnode_551_generative_model_name": "@model-configs/travel_llmnode-551_generative-model-name.ts",
    "travel_llmnode_380_generative_model_name": "@model-configs/travel_llmnode-380_generative-model-name.ts"
  },
  "scripts": {
    "travel_code_node_476_code": "@scripts/travel_code-node-476_code.ts",
    "travel_code_node_532_code": "@scripts/travel_code-node-532_code.ts"
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
        "advance_schema": "{\n  \"destination\": \"string\",\n  \"no_of_days\": \"string\",\n  \"budget\": \"string\",\n  \"destination_type\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_476",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_476",
        "code": "@scripts/travel_code-node-476_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_546",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_546",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/travel_llmnode-546_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/travel_llmnode-546_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/travel_llmnode-546_generative-model-name.ts"
      }
    }
  },
  {
    "id": "conditionNode_102",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_102-addNode_315",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{LLMNode_546.output.generatedResponse.destination}}\",\n      \"operator\": \"!=\",\n      \"value\": \"\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_102-addNode_365",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "LLMNode_551",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_551",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/travel_llmnode-551_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/travel_llmnode-551_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Refine LLM",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/travel_llmnode-551_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_380",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_380",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/travel_llmnode-380_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/travel_llmnode-380_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/travel_llmnode-380_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_532",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_532",
        "code": "@scripts/travel_code-node-532_code.ts",
        "nodeName": "Code"
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
        "outputMapping": "{\n  \"result\": \"{{codeNode_532.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_476",
    "source": "triggerNode_1",
    "target": "codeNode_476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_476-LLMNode_546",
    "source": "codeNode_476",
    "target": "LLMNode_546",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_532-responseNode_triggerNode_1",
    "source": "codeNode_532",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_546-conditionNode_102",
    "source": "LLMNode_546",
    "target": "conditionNode_102",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_102-LLMNode_551-483",
    "source": "conditionNode_102",
    "target": "LLMNode_551",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_551-codeNode_532-128",
    "source": "LLMNode_551",
    "target": "codeNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_102-LLMNode_380-951",
    "source": "conditionNode_102",
    "target": "LLMNode_380",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_380-codeNode_532-858",
    "source": "LLMNode_380",
    "target": "codeNode_532",
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
