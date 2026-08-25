// Flow: openapi-result-analyzer

// -- Meta --
export const meta = {
  "name": "openapi-result-analyzer",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Gaurav Keshri",
    "email": "gauravkeshri2095@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_795": [
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
    "openapi_result_analyzer_instructor_llmnode_795_system_0": "@prompts/openapi-result-analyzer_instructor-llmnode-795_system_0.md",
    "openapi_result_analyzer_instructor_llmnode_795_user_1": "@prompts/openapi-result-analyzer_instructor-llmnode-795_user_1.md"
  },
  "modelConfigs": {
    "openapi_result_analyzer_instructor_llmnode_795_generative_model_name": "@model-configs/openapi-result-analyzer_instructor-llmnode-795_generative-model-name.ts"
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
        "advance_schema": "{\n  \"openapiSpec\": \"string\",\n  \"testPayloads\": \"string\",\n  \"executionResults\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_795",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"risk_level\": {\n          \"type\": \"string\"\n        },\n        \"total_tests\": {\n          \"type\": \"number\"\n        },\n        \"confirmed_findings\": {\n          \"type\": \"number\"\n        },\n        \"likely_findings\": {\n          \"type\": \"number\"\n        },\n        \"inconclusive\": {\n          \"type\": \"number\"\n        },\n        \"false_positives\": {\n          \"type\": \"number\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"findings\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"finding_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"status\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          },\n          \"route\": {\n            \"type\": \"string\"\n          },\n          \"test_ids\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"evidence\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"request\": {\n                \"type\": \"string\"\n              },\n              \"response_status\": {\n                \"type\": \"number\"\n              },\n              \"observed_behavior\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"impact\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"recommendation\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"robustness_summary\": {\n      \"type\": \"object\",\n      \"properties\": {},\n      \"additionalProperties\": true\n    },\n    \"coverage_summary\": {\n      \"type\": \"object\",\n      \"properties\": {},\n      \"additionalProperties\": true\n    },\n    \"final_recommendations\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-result-analyzer_instructor-llmnode-795_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-result-analyzer_instructor-llmnode-795_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Supervisor",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-result-analyzer_instructor-llmnode-795_generative-model-name.ts"
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
        "outputMapping": "{\n  \"summary\": \"{{InstructorLLMNode_795.output.summary}}\",\n  \"findings\": \"{{InstructorLLMNode_795.output.findings}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_795",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_795",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_795-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_795",
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
