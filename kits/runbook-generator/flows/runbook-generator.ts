// Flow: runbook-generator

// -- Meta --
export const meta = {
  "name": "runbook-generator",
  "description": "Turns messy operational notes and tribal knowledge into a structured, reusable ops runbook with prechecks, steps, validation, rollback, and missing-info flags.",
  "tags": ["ops", "devops", "sre", "runbook"],
  "testInput": {
    "notes": "if redis cache looks poisoned on checkout: check redis-cli ping, then flushdb on the cache shard only (NOT primary), bounce checkout pods, watch error rate on grafana checkout dashboard. if still bad ask platform. don't touch prod db.",
    "service_name": "checkout-api",
    "environment": "prod"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/runbook-generator",
  "documentationUrl": "https://lamatic.ai/docs",
  "deployUrl": "",
  "author": {
    "name": "Tushar Sohal",
    "email": "tshulk2003@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_481": [
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
    "runbook_generator_instructor_llmnode_481_system_0": "@prompts/runbook-generator_instructor-llmnode-481_system_0.md",
    "runbook_generator_instructor_llmnode_481_user_1": "@prompts/runbook-generator_instructor-llmnode-481_user_1.md"
  },
  "modelConfigs": {
    "runbook_generator_instructor_llmnode_481_generative_model_name": "@model-configs/runbook-generator_instructor-llmnode-481_generative-model-name.ts"
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
        "advance_schema": "{\n  \"notes\": \"string\",\n  \"service_name\": \"string\",\n  \"environment\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_481",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"title\": {\n      \"type\": \"string\"\n    },\n    \"purpose\": {\n      \"type\": \"string\"\n    },\n    \"audience\": {\n      \"type\": \"string\"\n    },\n    \"service_name\": {\n      \"type\": \"string\"\n    },\n    \"environment\": {\n      \"type\": \"string\"\n    },\n    \"prechecks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"steps\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"order\": {\n            \"type\": \"number\"\n          },\n          \"action\": {\n            \"type\": \"string\"\n          },\n          \"expected_result\": {\n            \"type\": \"string\"\n          },\n          \"commands\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"risk\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"low\",\n              \"medium\",\n              \"high\"\n            ]\n          }\n        },\n        \"required\": [\n          \"order\",\n          \"action\",\n          \"expected_result\",\n          \"commands\",\n          \"risk\"\n        ],\n        \"additionalProperties\": false\n      }\n    },\n    \"validation\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"rollback\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"assumptions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"missing_info\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"warnings\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\n    \"title\",\n    \"purpose\",\n    \"audience\",\n    \"service_name\",\n    \"environment\",\n    \"prechecks\",\n    \"steps\",\n    \"validation\",\n    \"rollback\",\n    \"assumptions\",\n    \"missing_info\",\n    \"warnings\"\n  ],\n  \"additionalProperties\": false\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/runbook-generator_instructor-llmnode-481_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/runbook-generator_instructor-llmnode-481_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/runbook-generator_instructor-llmnode-481_generative-model-name.ts"
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
        "outputMapping": "{\n  \"title\": \"${{InstructorLLMNode_481.output.title}}\",\n  \"purpose\": \"${{InstructorLLMNode_481.output.purpose}}\",\n  \"audience\": \"${{InstructorLLMNode_481.output.audience}}\",\n  \"service_name\": \"${{InstructorLLMNode_481.output.service_name}}\",\n  \"environment\": \"${{InstructorLLMNode_481.output.environment}}\",\n  \"prechecks\": ${{InstructorLLMNode_481.output.prechecks}},\n  \"steps\": ${{InstructorLLMNode_481.output.steps}},\n  \"validation\": ${{InstructorLLMNode_481.output.validation}},\n  \"rollback\": ${{InstructorLLMNode_481.output.rollback}},\n  \"assumptions\": ${{InstructorLLMNode_481.output.assumptions}},\n  \"missing_info\": ${{InstructorLLMNode_481.output.missing_info}},\n  \"warnings\": ${{InstructorLLMNode_481.output.warnings}}\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_481",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_481",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_481-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_481",
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
