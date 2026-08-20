// Flow: atlas-generate-task-proposals

// -- Meta --
export const meta = {
  "name": "Atlas - Generate Task Proposals",
  "description": "Drafts approval-gated task proposals linked to requirement IDs.",
  "tags": [
    "tasks",
    "human-in-the-loop"
  ],
  "testInput": {
    "requirements": [
      {
        "id": "REQ-001",
        "title": "Password reset",
        "description": "Users must reset forgotten passwords."
      }
    ]
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "modelType": "generator/text",
      "description": "Model used to draft structured proposals.",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "system": "@prompts/atlas-generate-task-proposals_generate_system.md",
    "user": "@prompts/atlas-generate-task-proposals_generate_user.md"
  },
  "modelConfigs": {
    "generate": "@model-configs/atlas-generate-task-proposals_generate.ts"
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
        "advance_schema": "{\n  \"requirements\": \"array\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_1",
        "nodeName": "Generate Task Proposals",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"proposals\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\"type\": \"string\"},\n          \"title\": {\"type\": \"string\"},\n          \"description\": {\"type\": \"string\"},\n          \"priority\": {\"type\": \"string\"},\n          \"complexity\": {\"type\": \"string\"},\n          \"requiredSkills\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}},\n          \"dependencies\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}},\n          \"acceptanceCriteria\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}},\n          \"requirementIds\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}}\n        },\n        \"required\": [\"id\", \"title\", \"description\", \"acceptanceCriteria\", \"requirementIds\"]\n      }\n    }\n  },\n  \"required\": [\"proposals\"]\n}",
        "prompts": [
          {
            "id": "proposal-system",
            "role": "system",
            "content": "@prompts/atlas-generate-task-proposals_generate_system.md"
          },
          {
            "id": "proposal-user",
            "role": "user",
            "content": "@prompts/atlas-generate-task-proposals_generate_user.md"
          }
        ],
        "memories": "@model-configs/atlas-generate-task-proposals_generate.ts",
        "messages": "@model-configs/atlas-generate-task-proposals_generate.ts",
        "attachments": "@model-configs/atlas-generate-task-proposals_generate.ts",
        "generativeModelName": "@model-configs/atlas-generate-task-proposals_generate.ts"
      }
    }
  },
  {
    "id": "responseNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 300
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "isResponseNode": true,
      "values": {
        "id": "responseNode_1",
        "nodeName": "API Response",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "retry_delay": "0",
        "needs": [
          "InstructorLLMNode_1"
        ],
        "outputMapping": "{\n  \"proposals\": \"{{InstructorLLMNode_1.output.proposals}}\",\n  \"requiresApproval\": true\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-proposals",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "proposals-response",
    "source": "InstructorLLMNode_1",
    "target": "responseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-edge",
    "source": "triggerNode_1",
    "target": "responseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
