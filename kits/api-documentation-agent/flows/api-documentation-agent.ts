// Flow: api-documentation-agent

// -- Meta --
export const meta = {
  "name": "api-documentation-agent",
  "description": "Parses an OpenAPI/Swagger spec and generates comprehensive endpoint documentation, realistic code examples, and plain-language explanations.",
  "tags": [],
  "testInput": { "openapi_spec": "{\n  \"openapi\": \"3.0.0\",\n  \"info\": { \"title\": \"Pet Store\", \"version\": \"1.0.0\" },\n  \"paths\": {\n    \"/pets\": {\n      \"get\": {\n        \"summary\": \"List all pets\",\n        \"parameters\": [{ \"name\": \"limit\", \"in\": \"query\", \"schema\": { \"type\": \"integer\" } }],\n        \"responses\": { \"200\": { \"description\": \"A list of pets\" } }\n      },\n      \"post\": {\n        \"summary\": \"Create a pet\",\n        \"requestBody\": { \"content\": { \"application/json\": { \"schema\": { \"type\": \"object\", \"properties\": { \"name\": { \"type\": \"string\" }, \"tag\": { \"type\": \"string\" } }, \"required\": [\"name\"] } } } },\n        \"responses\": { \"201\": { \"description\": \"Pet created\" } }\n      }\n    },\n    \"/pets/{petId}\": {\n      \"get\": {\n        \"summary\": \"Get a pet by ID\",\n        \"parameters\": [{ \"name\": \"petId\", \"in\": \"path\", \"required\": true, \"schema\": { \"type\": \"string\" } }],\n        \"responses\": { \"200\": { \"description\": \"A single pet\" }, \"404\": { \"description\": \"Pet not found\" } }\n      }\n    }\n  }\n}" },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/api-documentation-agent",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/api-documentation-agent",
  "deployUrl": "",
  "author": {
    "name": "Devansh Zalavadiya",
    "email": "devzalavadiya@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_101": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_202": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_303": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_404": [
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
    "api_documentation_agent_instructor_llmnode_101_system_0": "@prompts/api-documentation-agent_instructor-llmnode-101_system_0.md",
    "api_documentation_agent_instructor_llmnode_101_user_1": "@prompts/api-documentation-agent_instructor-llmnode-101_user_1.md",
    "api_documentation_agent_llmnode_202_system_0": "@prompts/api-documentation-agent_llmnode-202_system_0.md",
    "api_documentation_agent_llmnode_202_user_1": "@prompts/api-documentation-agent_llmnode-202_user_1.md",
    "api_documentation_agent_llmnode_303_system_0": "@prompts/api-documentation-agent_llmnode-303_system_0.md",
    "api_documentation_agent_llmnode_303_user_1": "@prompts/api-documentation-agent_llmnode-303_user_1.md",
    "api_documentation_agent_instructor_llmnode_404_system_0": "@prompts/api-documentation-agent_instructor-llmnode-404_system_0.md",
    "api_documentation_agent_instructor_llmnode_404_user_1": "@prompts/api-documentation-agent_instructor-llmnode-404_user_1.md"
  },
  "modelConfigs": {
    "api_documentation_agent_instructor_llmnode_101_generative_model_name": "@model-configs/api-documentation-agent_instructor-llmnode-101_generative-model-name.ts",
    "api_documentation_agent_llmnode_202_generative_model_name": "@model-configs/api-documentation-agent_llmnode-202_generative-model-name.ts",
    "api_documentation_agent_llmnode_303_generative_model_name": "@model-configs/api-documentation-agent_llmnode-303_generative-model-name.ts",
    "api_documentation_agent_instructor_llmnode_404_generative_model_name": "@model-configs/api-documentation-agent_instructor-llmnode-404_generative-model-name.ts"
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
        "nodeName": "triggerNode_1",
        "responeType": "realtime",
        "advance_schema": "{\n  \"openapi_spec\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_101",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_101",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"api_title\": { \"type\": \"string\" },\n    \"api_version\": { \"type\": \"string\" },\n    \"base_url\": { \"type\": \"string\" },\n    \"auth_schemes\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"type\": { \"type\": \"string\" },\n          \"name\": { \"type\": \"string\" },\n          \"in\": { \"type\": \"string\" },\n          \"scheme\": { \"type\": \"string\" }\n        },\n        \"required\": [\"type\"]\n      }\n    },\n    \"endpoints\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"method\": { \"type\": \"string\" },\n          \"path\": { \"type\": \"string\" },\n          \"summary\": { \"type\": \"string\" },\n          \"description\": { \"type\": \"string\" },\n          \"tags\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n          \"parameters\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"name\": { \"type\": \"string\" },\n                \"in\": { \"type\": \"string\" },\n                \"type\": { \"type\": \"string\" },\n                \"required\": { \"type\": \"boolean\" },\n                \"description\": { \"type\": \"string\" }\n              },\n              \"required\": [\"name\", \"in\", \"type\"]\n            }\n          },\n          \"request_body\": {\n            \"type\": [\"object\", \"null\"],\n            \"properties\": {\n              \"content_type\": { \"type\": \"string\" },\n              \"fields\": {\n                \"type\": \"array\",\n                \"items\": {\n                  \"type\": \"object\",\n                  \"properties\": {\n                    \"name\": { \"type\": \"string\" },\n                    \"type\": { \"type\": \"string\" },\n                    \"required\": { \"type\": \"boolean\" },\n                    \"description\": { \"type\": \"string\" }\n                  },\n                  \"required\": [\"name\", \"type\"]\n                }\n              }\n            }\n          },\n          \"responses\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"status_code\": { \"type\": \"string\" },\n                \"description\": { \"type\": \"string\" },\n                \"schema_summary\": { \"type\": \"string\" }\n              },\n              \"required\": [\"status_code\", \"description\"]\n            }\n          },\n          \"auth\": { \"type\": \"string\" }\n        },\n        \"required\": [\"method\", \"path\", \"summary\", \"responses\"]\n      }\n    }\n  },\n  \"required\": [\"api_title\", \"api_version\", \"endpoints\"]\n}",
        "prompts": [
          {
            "id": "a01c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/api-documentation-agent_instructor-llmnode-101_system_0.md"
          },
          {
            "id": "a01c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/api-documentation-agent_instructor-llmnode-101_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "parser",
        "attachments": "",
        "generativeModelName": "@model-configs/api-documentation-agent_instructor-llmnode-101_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_202",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_202",
        "tools": [],
        "prompts": [
          {
            "id": "b02c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/api-documentation-agent_llmnode-202_system_0.md"
          },
          {
            "id": "b02c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/api-documentation-agent_llmnode-202_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "documenter",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/api-documentation-agent_llmnode-202_generative-model-name.ts"
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
        "id": "LLMNode_303",
        "tools": [],
        "prompts": [
          {
            "id": "c03c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/api-documentation-agent_llmnode-303_system_0.md"
          },
          {
            "id": "c03c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/api-documentation-agent_llmnode-303_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "exemplifier",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/api-documentation-agent_llmnode-303_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_404",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_404",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"quality_score\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1 },\n    \"issues\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"summary\": { \"type\": \"string\" }\n  },\n  \"required\": [\"quality_score\", \"issues\", \"summary\"]\n}",
        "prompts": [
          {
            "id": "d04c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/api-documentation-agent_instructor-llmnode-404_system_0.md"
          },
          {
            "id": "d04c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/api-documentation-agent_instructor-llmnode-404_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "reviewer",
        "attachments": "",
        "generativeModelName": "@model-configs/api-documentation-agent_instructor-llmnode-404_generative-model-name.ts"
      }
    }
  },
  {
    "id": "endNode_500",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "endNode",
      "values": {
        "id": "endNode_500",
        "nodeName": "End"
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
        "outputMapping": "{\n  \"documentation\": \"{{LLMNode_202.output.generatedResponse}}\",\n  \"examples\": \"{{LLMNode_303.output.generatedResponse}}\",\n  \"summary\": \"{{InstructorLLMNode_404.output.summary}}\",\n  \"quality_score\": \"{{InstructorLLMNode_404.output.quality_score}}\",\n  \"issues\": \"{{InstructorLLMNode_404.output.issues}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_101",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_101",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_101-LLMNode_202",
    "source": "InstructorLLMNode_101",
    "target": "LLMNode_202",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_101-LLMNode_303",
    "source": "InstructorLLMNode_101",
    "target": "LLMNode_303",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_202-InstructorLLMNode_404",
    "source": "LLMNode_202",
    "target": "InstructorLLMNode_404",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_303-InstructorLLMNode_404",
    "source": "LLMNode_303",
    "target": "InstructorLLMNode_404",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_404-endNode_500",
    "source": "InstructorLLMNode_404",
    "target": "endNode_500",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "endNode_500-responseNode_triggerNode_1",
    "source": "endNode_500",
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
