// Flow: commit-activity-digest

// -- Meta --
export const meta = {
  "name": "commit-activity-digest",
  "description": "Takes raw git log output and produces a structured engineering activity digest with work type breakdown, technology detection, and key highlights.",
  "tags": ["git", "developer-tools", "productivity", "reporting", "automation"],
  "testInput": {
    "git_log": "a]1f2e3d4 feat: add JWT refresh endpoint\n src/auth/refresh.ts | 45 ++++\n src/auth/middleware.ts | 12 +-\n\nb2c3d4e5 fix: prevent crash on empty CSV upload\n src/upload/parser.ts | 8 ++--\n src/upload/validate.ts | 3 +-\n\nc3d4e5f6 refactor: extract shared validation logic\n src/lib/validators.ts | 62 ++++++\n src/api/users.ts | 18 +--\n src/api/billing.ts | 14 +--\n\nd4e5f6g7 chore: bump next from 15.1 to 16.0\n package.json | 2 +-\n package-lock.json | 1842 ++++--\n\ne5f6g7h8 feat: add dark mode toggle to settings\n src/components/settings.tsx | 34 ++++\n src/styles/theme.css | 22 ++++\n\nf6g7h8i9 fix: correct timezone offset in scheduled posts\n src/queue/scheduler.ts | 6 +-\n\ng7h8i9j0 test: add integration tests for webhook retry\n tests/webhook.test.ts | 89 ++++++\n src/webhooks/retry.ts | 4 +-",
    "context": "Last 7 days of activity on our main product repo"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/commit-activity-digest",
  "documentationUrl": "https://lamatic.ai/docs",
  "deployUrl": "",
  "author": {
    "name": "Ajay Raghav",
    "email": "22BCS16075@cuchd.in"
  }
};

// -- Inputs --
export const inputs = {
  "analyzeActivity": [
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
    "commit_activity_digest_analyze_activity_system": "@prompts/commit-activity-digest_analyze-activity_system.md",
    "commit_activity_digest_analyze_activity_user": "@prompts/commit-activity-digest_analyze-activity_user.md"
  },
  "modelConfigs": {
    "commit_activity_digest_analyzeActivity_generative_model_name": "@model-configs/commit-activity-digest_analyzeActivity_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "apiRequest",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "apiRequest",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"git_log\": \"string\",\n  \"context\": \"string\"\n}"
      }
    }
  },
  {
    "id": "analyzeActivity",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "analyzeActivity",
        "tools": [],
        "prompts": [
          {
            "id": "prompt_system",
            "role": "system",
            "content": "@prompts/commit-activity-digest_analyze-activity_system.md"
          },
          {
            "id": "prompt_user",
            "role": "user",
            "content": "@prompts/commit-activity-digest_analyze-activity_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Analyze Activity",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/commit-activity-digest_analyzeActivity_generative-model-name.ts"
      }
    }
  },
  {
    "id": "apiResponse",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "apiResponse",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"digest\": \"{{analyzeActivity.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "apiRequest-analyzeActivity",
    "source": "apiRequest",
    "target": "analyzeActivity",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "analyzeActivity-apiResponse",
    "source": "analyzeActivity",
    "target": "apiResponse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_apiRequest",
    "source": "apiRequest",
    "target": "apiResponse",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
