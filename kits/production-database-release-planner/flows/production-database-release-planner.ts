// Flow: production-database-release-planner

// -- Meta --
export const meta = {
  "name": "Production Database Release Planner",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "tiya nahar",
    "email": "oneandonlytiya123@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "llmNode": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_860": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_316": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_840": [
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
    "production_database_release_planner_llm_node_system_0": "@prompts/production-database-release-planner_llm-node_system_0.md",
    "production_database_release_planner_llm_node_user_1": "@prompts/production-database-release-planner_llm-node_user_1.md",
    "production_database_release_planner_llmnode_860_system_0": "@prompts/production-database-release-planner_llmnode-860_system_0.md",
    "production_database_release_planner_llmnode_860_user_1": "@prompts/production-database-release-planner_llmnode-860_user_1.md",
    "production_database_release_planner_llmnode_316_system_0": "@prompts/production-database-release-planner_llmnode-316_system_0.md",
    "production_database_release_planner_llmnode_316_user_1": "@prompts/production-database-release-planner_llmnode-316_user_1.md",
    "production_database_release_planner_llmnode_840_system_0": "@prompts/production-database-release-planner_llmnode-840_system_0.md",
    "production_database_release_planner_llmnode_840_user_1": "@prompts/production-database-release-planner_llmnode-840_user_1.md"
  },
  "modelConfigs": {
    "production_database_release_planner_llm_node_generative_model_name": "@model-configs/production-database-release-planner_llm-node_generative-model-name.ts",
    "production_database_release_planner_llmnode_860_generative_model_name": "@model-configs/production-database-release-planner_llmnode-860_generative-model-name.ts",
    "production_database_release_planner_llmnode_316_generative_model_name": "@model-configs/production-database-release-planner_llmnode-316_generative-model-name.ts",
    "production_database_release_planner_llmnode_840_generative_model_name": "@model-configs/production-database-release-planner_llmnode-840_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "trigger",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "chat": "",
        "domains": [
          "http://localhost:3000"
        ],
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
            "What is lamatic?",
            "How do I add data to my chatbot?",
            "Explain this product to me"
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "userMessageBgColor": "#FEF2F2",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#d12323",
          "agentMessageTextColor": "#334155"
        }
      }
    }
  },
  {
    "id": "llmNode",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "llmNode",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"additionalProperties\": false,\n  \"required\": [\n    \"operations\",\n    \"target_table\",\n    \"target_columns\",\n    \"is_destructive\",\n    \"data_loss_potential\",\n    \"explanation\"\n  ],\n  \"properties\": {\n    \"operations\": {\n      \"description\": \"Migration operations extracted from the SQL migration.\",\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"minItems\": 1\n        }\n      ]\n    },\n    \"target_table\": {\n      \"description\": \"Primary table affected by each migration operation.\",\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          },\n          \"minItems\": 1\n        }\n      ]\n    },\n    \"target_columns\": {\n      \"description\": \"A flat string array when there is exactly one operation, or one column-name array per operation when there are multiple. A flat array with more than one operation is ambiguous and is rejected by the application parser (apps/lib/lamatic.ts) before it reaches this schema.\",\n      \"anyOf\": [\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      ]\n    },\n    \"is_destructive\": {\n      \"description\": \"Indicates whether the migration permanently removes schema or data.\",\n      \"type\": \"boolean\"\n    },\n    \"data_loss_potential\": {\n      \"description\": \"Estimated potential for permanent data loss.\",\n      \"type\": \"string\",\n      \"enum\": [\n        \"LOW\",\n        \"MEDIUM\",\n        \"HIGH\"\n      ]\n    },\n    \"explanation\": {\n      \"description\": \"Natural language summary of what the migration does.\",\n      \"type\": \"string\"\n    }\n  }\n}\n",
        "prompts": [
          {
            "id": "b632375f-f156-421c-8912-c41faa3719d6",
            "role": "system",
            "content": "@prompts/production-database-release-planner_llm-node_system_0.md"
          },
          {
            "id": "40edaca9-9a7c-4931-b3c7-750d7c035539",
            "role": "user",
            "content": "@prompts/production-database-release-planner_llm-node_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Migration Understanding Agent",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/production-database-release-planner_llm-node_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_860",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"additionalProperties\": false,\n  \"required\": [\n    \"operations\",\n    \"target_table\",\n    \"target_columns\",\n    \"is_destructive\",\n    \"data_loss_potential\",\n    \"explanation\",\n    \"behavior_analysis\"\n  ],\n  \"properties\": {\n    \"operations\": {\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      ]\n    },\n    \"target_table\": {\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      ]\n    },\n    \"target_columns\": {\n      \"anyOf\": [\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      ]\n    },\n    \"is_destructive\": {\n      \"type\": \"boolean\"\n    },\n    \"data_loss_potential\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"LOW\",\n        \"MEDIUM\",\n        \"HIGH\"\n      ]\n    },\n    \"explanation\": {\n      \"type\": \"string\"\n    },\n    \"behavior_analysis\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"lock_type\",\n        \"table_rewrite\",\n        \"blocking_risk\",\n        \"production_risk\",\n        \"reasoning\"\n      ],\n      \"properties\": {\n        \"lock_type\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"ACCESS EXCLUSIVE\",\n            \"ROW EXCLUSIVE\",\n            \"SHARE UPDATE EXCLUSIVE\",\n            \"SHARE\",\n            \"ROW SHARE\",\n            \"SHARE ROW EXCLUSIVE\",\n            \"EXCLUSIVE\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"table_rewrite\": {\n          \"oneOf\": [\n            {\n              \"type\": \"boolean\"\n            },\n            {\n              \"type\": \"string\",\n              \"enum\": [\n                \"UNKNOWN\"\n              ]\n            }\n          ]\n        },\n        \"blocking_risk\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"production_risk\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"reasoning\": {\n          \"type\": \"string\"\n        }\n      }\n    }\n  }\n}\n",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/production-database-release-planner_llmnode-860_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/production-database-release-planner_llmnode-860_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Database Behavior Evaluator",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/production-database-release-planner_llmnode-860_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_316",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"additionalProperties\": false,\n  \"required\": [\n    \"operations\",\n    \"target_table\",\n    \"target_columns\",\n    \"is_destructive\",\n    \"data_loss_potential\",\n    \"explanation\",\n    \"behavior_analysis\",\n    \"deployment_strategy\"\n  ],\n  \"properties\": {\n    \"operations\": {\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      ]\n    },\n    \"target_table\": {\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      ]\n    },\n    \"target_columns\": {\n      \"anyOf\": [\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      ]\n    },\n    \"is_destructive\": {\n      \"type\": \"boolean\"\n    },\n    \"data_loss_potential\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"LOW\",\n        \"MEDIUM\",\n        \"HIGH\"\n      ]\n    },\n    \"explanation\": {\n      \"type\": \"string\"\n    },\n    \"behavior_analysis\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"lock_type\",\n        \"table_rewrite\",\n        \"blocking_risk\",\n        \"production_risk\",\n        \"reasoning\"\n      ],\n      \"properties\": {\n        \"lock_type\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"ACCESS EXCLUSIVE\",\n            \"ROW EXCLUSIVE\",\n            \"SHARE UPDATE EXCLUSIVE\",\n            \"SHARE\",\n            \"ROW SHARE\",\n            \"SHARE ROW EXCLUSIVE\",\n            \"EXCLUSIVE\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"table_rewrite\": {\n          \"oneOf\": [\n            {\n              \"type\": \"boolean\"\n            },\n            {\n              \"type\": \"string\",\n              \"enum\": [\n                \"UNKNOWN\"\n              ]\n            }\n          ]\n        },\n        \"blocking_risk\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"production_risk\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"reasoning\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    \"deployment_strategy\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"strategy\",\n        \"maintenance_window_required\",\n        \"estimated_downtime\",\n        \"deployment_order\",\n        \"recommendation\"\n      ],\n      \"properties\": {\n        \"strategy\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"EXPAND_CONTRACT\",\n            \"DIRECT_MIGRATION\",\n            \"ONLINE_MIGRATION\",\n            \"PHASED_ROLLOUT\"\n          ]\n        },\n        \"maintenance_window_required\": {\n          \"type\": \"boolean\"\n        },\n        \"estimated_downtime\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"NONE\",\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"deployment_order\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"recommendation\": {\n          \"type\": \"object\",\n          \"additionalProperties\": false,\n          \"required\": [\n            \"summary\",\n            \"why\",\n            \"best_practice\"\n          ],\n          \"properties\": {\n            \"summary\": {\n              \"type\": \"string\"\n            },\n            \"why\": {\n              \"type\": \"string\"\n            },\n            \"best_practice\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      }\n    }\n  }\n}\n",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/production-database-release-planner_llmnode-316_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/production-database-release-planner_llmnode-316_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Deployment Strategy Planner",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/production-database-release-planner_llmnode-316_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_840",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"additionalProperties\": false,\n  \"required\": [\n    \"operations\",\n    \"target_table\",\n    \"target_columns\",\n    \"is_destructive\",\n    \"data_loss_potential\",\n    \"explanation\",\n    \"behavior_analysis\",\n    \"deployment_strategy\",\n    \"release_plan\"\n  ],\n  \"properties\": {\n    \"operations\": {\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      ]\n    },\n    \"target_table\": {\n      \"oneOf\": [\n        {\n          \"type\": \"string\"\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      ]\n    },\n    \"target_columns\": {\n      \"description\": \"A flat string array when there is exactly one operation, or one column-name array per operation when there are multiple. A flat array with more than one operation is ambiguous and is rejected by the application parser (apps/lib/lamatic.ts) before it reaches this schema.\",\n      \"anyOf\": [\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      ]\n    },\n    \"is_destructive\": {\n      \"type\": \"boolean\"\n    },\n    \"data_loss_potential\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"LOW\",\n        \"MEDIUM\",\n        \"HIGH\"\n      ]\n    },\n    \"explanation\": {\n      \"type\": \"string\"\n    },\n    \"behavior_analysis\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"lock_type\",\n        \"table_rewrite\",\n        \"blocking_risk\",\n        \"production_risk\",\n        \"reasoning\"\n      ],\n      \"properties\": {\n        \"lock_type\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"ACCESS EXCLUSIVE\",\n            \"ROW EXCLUSIVE\",\n            \"SHARE UPDATE EXCLUSIVE\",\n            \"SHARE\",\n            \"ROW SHARE\",\n            \"SHARE ROW EXCLUSIVE\",\n            \"EXCLUSIVE\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"table_rewrite\": {\n          \"oneOf\": [\n            {\n              \"type\": \"boolean\"\n            },\n            {\n              \"type\": \"string\",\n              \"enum\": [\n                \"UNKNOWN\"\n              ]\n            }\n          ]\n        },\n        \"blocking_risk\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"production_risk\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"reasoning\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    \"deployment_strategy\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"strategy\",\n        \"maintenance_window_required\",\n        \"estimated_downtime\",\n        \"deployment_order\",\n        \"recommendation\"\n      ],\n      \"properties\": {\n        \"strategy\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"EXPAND_CONTRACT\",\n            \"DIRECT_MIGRATION\",\n            \"ONLINE_MIGRATION\",\n            \"PHASED_ROLLOUT\"\n          ]\n        },\n        \"maintenance_window_required\": {\n          \"type\": \"boolean\"\n        },\n        \"estimated_downtime\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"NONE\",\n            \"LOW\",\n            \"MEDIUM\",\n            \"HIGH\",\n            \"UNKNOWN\"\n          ]\n        },\n        \"deployment_order\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"recommendation\": {\n          \"type\": \"object\",\n          \"additionalProperties\": false,\n          \"required\": [\n            \"summary\",\n            \"why\",\n            \"best_practice\"\n          ],\n          \"properties\": {\n            \"summary\": {\n              \"type\": \"string\"\n            },\n            \"why\": {\n              \"type\": \"string\"\n            },\n            \"best_practice\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      }\n    },\n    \"release_plan\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"release_decision\",\n        \"rollback_strategy\"\n      ],\n      \"properties\": {\n        \"release_decision\": {\n          \"type\": \"object\",\n          \"additionalProperties\": false,\n          \"required\": [\n            \"status\",\n            \"confidence\"\n          ],\n          \"properties\": {\n            \"status\": {\n              \"type\": \"string\",\n              \"enum\": [\n                \"APPROVE\",\n                \"APPROVE_WITH_CAUTION\",\n                \"REJECT\"\n              ]\n            },\n            \"confidence\": {\n              \"type\": \"string\",\n              \"enum\": [\n                \"LOW\",\n                \"MEDIUM\",\n                \"HIGH\"\n              ]\n            }\n          }\n        },\n        \"rollback_strategy\": {\n          \"type\": \"object\",\n          \"additionalProperties\": false,\n          \"required\": [\n            \"rollback_possible\",\n            \"rollback_order\",\n            \"rollback_warning\"\n          ],\n          \"properties\": {\n            \"rollback_possible\": {\n              \"type\": \"boolean\"\n            },\n            \"rollback_order\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"rollback_warning\": {\n              \"type\": \"string\"\n            }\n          }\n        }\n      }\n    }\n  }\n}\n",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/production-database-release-planner_llmnode-840_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/production-database-release-planner_llmnode-840_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Release Decision & Rollback Advisor",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/production-database-release-planner_llmnode-840_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_trigger",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "id": "responseNode_trigger",
        "content": "{{LLMNode_840.output.generatedResponse}}",
        "nodeName": "Chat Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-llmNode",
    "source": "trigger",
    "target": "llmNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "llmNode-LLMNode_860",
    "source": "llmNode",
    "target": "LLMNode_860",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_860-LLMNode_316",
    "source": "LLMNode_860",
    "target": "LLMNode_316",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_316-LLMNode_840",
    "source": "LLMNode_316",
    "target": "LLMNode_840",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_840-responseNode_trigger",
    "source": "LLMNode_840",
    "target": "responseNode_trigger",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_trigger",
    "source": "trigger",
    "target": "responseNode_trigger",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
