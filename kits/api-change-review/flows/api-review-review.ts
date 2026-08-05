// Flow: api-review-review

// -- Meta --
export const meta = {
  "name": "api-review-review",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Kyryll Pavlenko",
    "email": "kyryllupwork@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_713": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_804": [
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
    "api_review_review_instructor_llmnode_713_system_0": "@prompts/api-review-review_instructor-llmnode-713_system_0.md",
    "api_review_review_instructor_llmnode_713_user_1": "@prompts/api-review-review_instructor-llmnode-713_user_1.md",
    "api_review_review_llmnode_804_system_0": "@prompts/api-review-review_llmnode-804_system_0.md",
    "api_review_review_llmnode_804_user_1": "@prompts/api-review-review_llmnode-804_user_1.md"
  },
  "modelConfigs": {
    "api_review_review_instructor_llmnode_713_generative_model_name": "@model-configs/api-review-review_instructor-llmnode-713_generative-model-name.ts",
    "api_review_review_llmnode_804_generative_model_name": "@model-configs/api-review-review_llmnode-804_generative-model-name.ts"
  },
  "scripts": {
    "api_review_review_code_node_243_code": "@scripts/api-review-review_code-node-243_code.ts",
    "api_review_review_code_node_343_code": "@scripts/api-review-review_code-node-343_code.ts"
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
        "advance_schema": "{\n  \"changes\": \"[string]\",\n  \"totalChanges\": \"int\",\n  \"oldVersion\": \"string\",\n  \"newVersion\": \"string\",\n  \"endpointsTouched\": \"[string]\",\n  \"audience\": \"string\"\n}"
      }
    }
  },
  {
    "id": "conditionNode_942",
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
            "value": "conditionNode_942-addNode_126",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.totalChanges}}\",\n      \"operator\": \">\",\n      \"value\": \"0\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_942-addNode_318",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_243",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/api-review-review_code-node-243_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "InstructorLLMNode_713",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"assessments\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"kind\": {\n            \"type\": \"string\"\n          },\n          \"location\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          },\n          \"rule\": {\n            \"type\": \"string\"\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          },\n          \"consumerImpact\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"number\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/api-review-review_instructor-llmnode-713_system_0.md"
          },
          {
            "id": "1f97e6a8-19d0-4a15-b0ea-dfbc15d6a763",
            "role": "user",
            "content": "@prompts/api-review-review_instructor-llmnode-713_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/api-review-review_instructor-llmnode-713_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_804",
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
            "content": "@prompts/api-review-review_llmnode-804_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/api-review-review_llmnode-804_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/api-review-review_llmnode-804_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_343",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/api-review-review_code-node-343_code.ts",
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
        "outputMapping": "{\n  \"verdict\": \"{{codeNode_343.output.verdict}}\",\n  \"summary\": \"{{codeNode_343.output.summary}}\",\n  \"oldVersion\": \"{{codeNode_343.output.oldVersion}}\",\n  \"newVersion\": \"{{codeNode_343.output.newVersion}}\",\n  \"totalChanges\": \"{{codeNode_343.output.totalChanges}}\",\n  \"counts\": \"{{codeNode_343.output.counts}}\",\n  \"changes\": \"{{codeNode_343.output.changes}}\",\n  \"migrationNotes\": \"{{codeNode_343.output.migrationNotes}}\",\n  \"changelog\": \"{{codeNode_343.output.changelog}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "conditionNode_942-InstructorLLMNode_713-609",
    "source": "conditionNode_942",
    "target": "InstructorLLMNode_713",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_942-codeNode_243-627",
    "source": "conditionNode_942",
    "target": "codeNode_243",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_713-LLMNode_804-776",
    "source": "InstructorLLMNode_713",
    "target": "LLMNode_804",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_243-LLMNode_804-593",
    "source": "codeNode_243",
    "target": "LLMNode_804",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_804-codeNode_343",
    "source": "LLMNode_804",
    "target": "codeNode_343",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_343-responseNode_triggerNode_1",
    "source": "codeNode_343",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-conditionNode_942-880",
    "source": "triggerNode_1",
    "target": "conditionNode_942",
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
