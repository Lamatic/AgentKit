// Flow: github-commit-agent

// -- Meta --
export const meta = {
  "name": "GitHub Commit Agent",
  "description": "Fetches commits between two git refs from a public GitHub repo and generates a structured, human-readable summary grouped by type: features, fixes, breaking changes, and maintenance.",
  "tags": ["Generative", "DevTools", "Automation"],
  "testInput": {
    "message": "What changed in Lamatic/AgentKit since v1.0.0?"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/github-commit-agent",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Kritiman Talukdar",
    "email": "kritiman_ug_24@ee.nits.ac.in"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_parse_50": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_200": [
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
    "github_commit_agent_parse_intent_system": "@prompts/github-commit-agent_parse-intent_system.md",
    "github_commit_agent_parse_intent_user": "@prompts/github-commit-agent_parse-intent_user.md",
    "github_commit_agent_llm_node_system": "@prompts/github-commit-agent_llm-node_system.md",
    "github_commit_agent_llm_node_user": "@prompts/github-commit-agent_llm-node_user.md"
  },
  "scripts": {
    "github_commit_agent_code_node": "@scripts/github-commit-agent_code-node.ts"
  },
  "modelConfigs": {
    "github_commit_agent_parse_intent": "@model-configs/github-commit-agent_parse-intent.ts",
    "github_commit_agent_llm_node": "@model-configs/github-commit-agent_llm-node.ts"
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
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"message\": {\n      \"type\": \"string\",\n      \"description\": \"Natural language request, e.g. what changed in Lamatic/AgentKit since v1.0.0 or show me the last two releases of vercel/next.js\"\n    }\n  },\n  \"required\": [\"message\"]\n}"
      }
    }
  },
  {
    "id": "LLMNode_parse_50",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 200
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Parse Intent",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/github-commit-agent_parse-intent_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/github-commit-agent_parse-intent_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Parse Intent",
        "attachments": "",
        "generativeModelName": "@model-configs/github-commit-agent_parse-intent.ts"
      }
    }
  },
  {
    "id": "codeNode_100",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 400
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Fetch Commits from GitHub",
        "code": "@scripts/github-commit-agent_code-node.ts",
        "inputs": {
          "parsedIntent": "{{LLMNode_parse_50.output.generatedResponse}}"
        }
      }
    }
  },
  {
    "id": "LLMNode_200",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 600
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Classify and Summarise Commits",
        "tools": [],
        "prompts": [
          {
            "id": "287c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/github-commit-agent_llm-node_system.md"
          },
          {
            "id": "287c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/github-commit-agent_llm-node_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Classify and Summarise Commits",
        "attachments": "",
        "generativeModelName": "@model-configs/github-commit-agent_llm-node.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 800
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
        "outputMapping": "{\n  \"summary\": \"{{LLMNode_200.output.generatedResponse}}\",\n  \"compared\": \"{{codeNode_100.output.resolvedBase}}...{{codeNode_100.output.resolvedHead}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_parse_50",
    "source": "triggerNode_1",
    "target": "LLMNode_parse_50",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_parse_50-codeNode_100",
    "source": "LLMNode_parse_50",
    "target": "codeNode_100",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_100-LLMNode_200",
    "source": "codeNode_100",
    "target": "LLMNode_200",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_200-responseNode_triggerNode_1",
    "source": "LLMNode_200",
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
