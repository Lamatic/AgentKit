// Flow: openapi-payload-generator

// -- Meta --
export const meta = {
  "name": "openapi-payload-generator",
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
  "InstructorLLMNode_975": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_193": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_428": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_195": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_990": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_111": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_857": [
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
    "openapi_payload_generator_instructor_llmnode_975_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-975_system_0.md",
    "openapi_payload_generator_instructor_llmnode_975_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-975_user_1.md",
    "openapi_payload_generator_instructor_llmnode_193_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-193_system_0.md",
    "openapi_payload_generator_instructor_llmnode_193_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-193_user_1.md",
    "openapi_payload_generator_instructor_llmnode_428_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-428_system_0.md",
    "openapi_payload_generator_instructor_llmnode_428_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-428_user_1.md",
    "openapi_payload_generator_instructor_llmnode_195_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-195_system_0.md",
    "openapi_payload_generator_instructor_llmnode_195_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-195_user_1.md",
    "openapi_payload_generator_instructor_llmnode_990_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-990_system_0.md",
    "openapi_payload_generator_instructor_llmnode_990_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-990_user_1.md",
    "openapi_payload_generator_instructor_llmnode_111_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-111_system_0.md",
    "openapi_payload_generator_instructor_llmnode_111_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-111_user_1.md",
    "openapi_payload_generator_instructor_llmnode_857_system_0": "@prompts/openapi-payload-generator_instructor-llmnode-857_system_0.md",
    "openapi_payload_generator_instructor_llmnode_857_user_1": "@prompts/openapi-payload-generator_instructor-llmnode-857_user_1.md"
  },
  "modelConfigs": {
    "openapi_payload_generator_instructor_llmnode_975_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-975_generative-model-name.ts",
    "openapi_payload_generator_instructor_llmnode_193_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-193_generative-model-name.ts",
    "openapi_payload_generator_instructor_llmnode_428_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-428_generative-model-name.ts",
    "openapi_payload_generator_instructor_llmnode_195_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-195_generative-model-name.ts",
    "openapi_payload_generator_instructor_llmnode_990_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-990_generative-model-name.ts",
    "openapi_payload_generator_instructor_llmnode_111_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-111_generative-model-name.ts",
    "openapi_payload_generator_instructor_llmnode_857_generative_model_name": "@model-configs/openapi-payload-generator_instructor-llmnode-857_generative-model-name.ts"
  },
  "scripts": {
    "openapi_payload_generator_code_node_919_code": "@scripts/openapi-payload-generator_code-node-919_code.ts",
    "openapi_payload_generator_code_node_372_code": "@scripts/openapi-payload-generator_code-node-372_code.ts"
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
        "advance_schema": "{\n  \"openapiSpec\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_919",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/openapi-payload-generator_code-node-919_code.ts",
        "nodeName": "Orchestrator"
      }
    }
  },
  {
    "id": "InstructorLLMNode_975",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-975_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-975_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Auth Hacker",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-975_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_193",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-193_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-193_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "IDOR Hacker",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-193_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_428",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-428_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-428_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Injection Hacker",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-428_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_195",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-195_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-195_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "XSS Hacker",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-195_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_990",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-990_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-990_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "SSRF Hacker",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-990_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_111",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-111_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-111_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Business Logic Hacker",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-111_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_857",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"agent\": {\n      \"type\": \"string\"\n    },\n    \"route\": {\n      \"type\": \"string\"\n    },\n    \"tests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"test_id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"headers\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expected_secure_behavior\": {\n            \"type\": \"string\"\n          },\n          \"severity_if_confirmed\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-857_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/openapi-payload-generator_instructor-llmnode-857_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Robustness Tester",
        "attachments": "",
        "generativeModelName": "@model-configs/openapi-payload-generator_instructor-llmnode-857_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_372",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/openapi-payload-generator_code-node-372_code.ts",
        "nodeName": "Accumulator"
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
        "outputMapping": "{\n  \"testSuite\": \"{{codeNode_372.output.testSuite}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_919",
    "source": "triggerNode_1",
    "target": "codeNode_919",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_372-responseNode_triggerNode_1-620",
    "source": "codeNode_372",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_919-InstructorLLMNode_975",
    "source": "codeNode_919",
    "target": "InstructorLLMNode_975",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_975-InstructorLLMNode_193",
    "source": "InstructorLLMNode_975",
    "target": "InstructorLLMNode_193",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_193-InstructorLLMNode_428",
    "source": "InstructorLLMNode_193",
    "target": "InstructorLLMNode_428",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_428-InstructorLLMNode_195",
    "source": "InstructorLLMNode_428",
    "target": "InstructorLLMNode_195",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_195-InstructorLLMNode_990",
    "source": "InstructorLLMNode_195",
    "target": "InstructorLLMNode_990",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_990-InstructorLLMNode_111",
    "source": "InstructorLLMNode_990",
    "target": "InstructorLLMNode_111",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_111-InstructorLLMNode_857",
    "source": "InstructorLLMNode_111",
    "target": "InstructorLLMNode_857",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_857-codeNode_372",
    "source": "InstructorLLMNode_857",
    "target": "codeNode_372",
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
