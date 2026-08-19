// Flow: atlas-recommend-assignment

// -- Meta --
export const meta = {
  "name": "Atlas - Recommend Assignment",
  "description": "Scores team members deterministically and adds a faithful explanation.",
  "tags": [
    "assignment",
    "explainability"
  ],
  "testInput": {
    "task": {
      "id": "TASK-1",
      "title": "Implement password reset API",
      "priority": "HIGH",
      "complexity": "COMPLEX",
      "requiredSkills": [
        "python",
        "api"
      ]
    },
    "members": [
      {
        "memberId": "M-1",
        "name": "Arun",
        "role": "TEAM_LEAD",
        "skills": [
          "python",
          "api"
        ],
        "currentOpenTasks": 2,
        "currentHighPriorityTasks": 0
      },
      {
        "memberId": "M-2",
        "name": "Nila",
        "role": "INTERN",
        "skills": [
          "api"
        ],
        "currentOpenTasks": 1,
        "currentHighPriorityTasks": 0
      }
    ]
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "chat",
      "modelType": "generator/text",
      "description": "Model used only to explain the deterministic scorecard.",
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
    "system": "@prompts/atlas-recommend-assignment_explain_system.md",
    "user": "@prompts/atlas-recommend-assignment_explain_user.md"
  },
  "modelConfigs": {
    "explain": "@model-configs/atlas-recommend-assignment_explain.ts"
  },
  "scripts": {
    "score": "@scripts/atlas-recommend-assignment_score.ts"
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
        "advance_schema": "{\n  \"task\": \"object\",\n  \"members\": \"array\"\n}"
      }
    }
  },
  {
    "id": "codeNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 140
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_1",
        "nodeName": "Deterministic Candidate Scoring",
        "code": "@scripts/atlas-recommend-assignment_score.ts"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 280
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "nodeName": "Explain Recommendation",
        "tools": [],
        "prompts": [
          {
            "id": "explain-system",
            "role": "system",
            "content": "@prompts/atlas-recommend-assignment_explain_system.md"
          },
          {
            "id": "explain-user",
            "role": "user",
            "content": "@prompts/atlas-recommend-assignment_explain_user.md"
          }
        ],
        "memories": "@model-configs/atlas-recommend-assignment_explain.ts",
        "messages": "@model-configs/atlas-recommend-assignment_explain.ts",
        "attachments": "@model-configs/atlas-recommend-assignment_explain.ts",
        "generativeModelName": "@model-configs/atlas-recommend-assignment_explain.ts"
      }
    }
  },
  {
    "id": "responseNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 420
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
          "LLMNode_1"
        ],
        "outputMapping": "{\n  \"scorecard\": \"{{codeNode_1.output}}\",\n  \"explanation\": \"{{LLMNode_1.output.generatedResponse}}\",\n  \"requiresApproval\": true\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-score",
    "source": "triggerNode_1",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "score-explain",
    "source": "codeNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "explain-response",
    "source": "LLMNode_1",
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
