// Flow: api-breaking-change-detector

// -- Meta --
export const meta = {
  "name": "api-breaking-change-detector",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sabeer .h",
    "email": "sabeer.h4774@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_543": [
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
    "api_breaking_change_detector_llmnode_543_system_0": "@prompts/api-breaking-change-detector_llmnode-543_system_0.md",
    "api_breaking_change_detector_llmnode_543_user_1": "@prompts/api-breaking-change-detector_llmnode-543_user_1.md"
  },
  "modelConfigs": {
    "api_breaking_change_detector_llmnode_543_generative_model_name": "@model-configs/api-breaking-change-detector_llmnode-543_generative-model-name.ts"
  },
  "scripts": {
    "api_breaking_change_detector_code_node_676_code": "@scripts/api-breaking-change-detector_code-node-676_code.ts"
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
        "advance_schema": "{\n  \"v1_schema\": \"string\",\n  \"v2_schema\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_676",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/api-breaking-change-detector_code-node-676_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_543",
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
            "content": "@prompts/api-breaking-change-detector_llmnode-543_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/api-breaking-change-detector_llmnode-543_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/api-breaking-change-detector_llmnode-543_generative-model-name.ts"
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
        "outputMapping": "{\n  \"report\": \"{{LLMNode_543.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_676",
    "source": "triggerNode_1",
    "target": "codeNode_676",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_676-LLMNode_543",
    "source": "codeNode_676",
    "target": "LLMNode_543",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_543-responseNode_triggerNode_1",
    "source": "LLMNode_543",
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
