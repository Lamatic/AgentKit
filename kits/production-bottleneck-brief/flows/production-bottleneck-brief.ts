// Flow: production-bottleneck-brief

// -- Meta --
export const meta = {
  "name": "production-bottleneck-brief",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ibrahim Khan",
    "email": "gr25816@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_303": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_430": [
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
    "production_bottleneck_brief_llmnode_303_system_0": "@prompts/production-bottleneck-brief_llmnode-303_system_0.md",
    "production_bottleneck_brief_llmnode_303_user_1": "@prompts/production-bottleneck-brief_llmnode-303_user_1.md",
    "production_bottleneck_brief_llmnode_430_system_0": "@prompts/production-bottleneck-brief_llmnode-430_system_0.md",
    "production_bottleneck_brief_llmnode_430_user_1": "@prompts/production-bottleneck-brief_llmnode-430_user_1.md"
  },
  "modelConfigs": {
    "production_bottleneck_brief_llmnode_303_generative_model_name": "@model-configs/production-bottleneck-brief_llmnode-303_generative-model-name.ts",
    "production_bottleneck_brief_llmnode_430_generative_model_name": "@model-configs/production-bottleneck-brief_llmnode-430_generative-model-name.ts"
  },
  "scripts": {
    "production_bottleneck_brief_code_node_969_code": "@scripts/production-bottleneck-brief_code-node-969_code.ts"
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
        "advance_schema": "{\n  \"orders\": [\n    {\n      \"id\": \"string\",\n      \"dueDate\": \"string\",\n      \"stages\": \"[string]\",\n      \"currentStage\": \"string\",\n      \"stageEnteredDate\": \"string\",\n      \"quantity\": \"string\",\n      \"completedQuantity\": \"string\"\n    }\n  ]\n}"
      }
    }
  },
  {
    "id": "codeNode_969",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/production-bottleneck-brief_code-node-969_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_303",
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
            "content": "@prompts/production-bottleneck-brief_llmnode-303_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/production-bottleneck-brief_llmnode-303_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/production-bottleneck-brief_llmnode-303_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_430",
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
            "content": "@prompts/production-bottleneck-brief_llmnode-430_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/production-bottleneck-brief_llmnode-430_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/production-bottleneck-brief_llmnode-430_generative-model-name.ts"
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
        "outputMapping": "{\n  \"brief\": \"{{LLMNode_303.output.generatedResponse}}\",\n  \"stats\": \"{{codeNode_969.output}}\",\n  \"emailDraft\": \"{{LLMNode_430.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_969",
    "source": "triggerNode_1",
    "target": "codeNode_969",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_969-LLMNode_303",
    "source": "codeNode_969",
    "target": "LLMNode_303",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_303-LLMNode_430",
    "source": "LLMNode_303",
    "target": "LLMNode_430",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_430-responseNode_triggerNode_1",
    "source": "LLMNode_430",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
