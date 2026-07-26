// Flow: commit-pr-generator

// -- Meta --
export const meta = {
  "name": "commit-pr-generator",
  "description": "Turns a raw git diff into a Conventional Commits message and a ready-to-paste pull request description.",
  "tags": ["developer-tools", "git", "generative"],
  "testInput": {
    "diff": "diff --git a/utils.py b/utils.py\n@@\n-def add(a, b): return a+b\n+def add(a, b):\n+    if not all(isinstance(x, (int, float)) for x in (a, b)):\n+        raise TypeError('inputs must be numeric')\n+    return a + b"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/commit-pr-generator",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ayaz Saifi",
    "email": "ayazzssaifi@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_223": [
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
    "commit_pr_generator_llmnode_223_system_0": "@prompts/commit-pr-generator_llmnode-223_system_0.md",
    "commit_pr_generator_llmnode_223_user_1": "@prompts/commit-pr-generator_llmnode-223_user_1.md"
  },
  "modelConfigs": {
    "commit_pr_generator_llmnode_223_generative_model_name": "@model-configs/commit-pr-generator_llmnode-223_generative-model-name.ts"
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
        "advance_schema": "{\n  \"diff\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_223",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/commit-pr-generator_llmnode-223_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/commit-pr-generator_llmnode-223_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/commit-pr-generator_llmnode-223_generative-model-name.ts"
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
        "outputMapping": "{\n  \"result\": \"{{LLMNode_223.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_223",
    "source": "triggerNode_1",
    "target": "LLMNode_223",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_223-responseNode_triggerNode_1",
    "source": "LLMNode_223",
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
