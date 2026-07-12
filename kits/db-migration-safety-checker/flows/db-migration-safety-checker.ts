// -- Meta --
export const meta = {
  name: "DB Migration Safety Checker",
  description:
    "Analyzes a SQL migration for risky operations - table locks, missing indexes on new foreign keys, non-reversible drops, unsafe NOT NULL additions, and unbounded data migrations - and returns a structured safety report with severity and suggested fixes.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Soujanya Bhirade",
    email: "your-email@example.com"
  },
};

// -- Inputs --
export const inputs = {
  "LLMNode_190": [
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
    "db_migration_safety_checker_llmnode_190_system_0": "@prompts/db-migration-safety-checker_llmnode-190_system_0.md",
    "db_migration_safety_checker_llmnode_190_user_1": "@prompts/db-migration-safety-checker_llmnode-190_user_1.md"
  },
  "modelConfigs": {
    "db_migration_safety_checker_llmnode_190_generative_model_name": "@model-configs/db-migration-safety-checker_llmnode-190_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"migration_sql\": \"string\",\n  \"db_dialect\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_190",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "287c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/db-migration-safety-checker_llmnode-190_system_0.md"
          },
          {
            "id": "287c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/db-migration-safety-checker_llmnode-190_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/db-migration-safety-checker_llmnode-190_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{LLMNode_190.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_190",
    "source": "triggerNode_1",
    "target": "LLMNode_190",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_190-responseNode_triggerNode_1",
    "source": "LLMNode_190",
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
