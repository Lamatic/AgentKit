// Flow: commit-message-generator

// -- Meta --
export const meta = {
  "name": "commit-message-generator",
  "description": "Paste a git diff and instantly get a perfect conventional commit message following the Conventional Commits specification.",
  "tags": ["git", "developer-tools", "productivity", "code", "automation"],
  "testInput": {
    "git_diff": "diff --git a/utils.py b/utils.py\n@@\n-def add(a, b): return a+b\n+def add(a, b):\n+    if not all(isinstance(x, (int, float)) for x in (a, b)):\n+        raise TypeError('inputs must be numeric')\n+    return a + b"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/commit-message-generator",
  "documentationUrl": "https://lamatic.ai/docs",
  "deployUrl": "",
  "author": {
    "name": "Aadithya Ram Durga Moravineni",
    "email": "aadithya.moravineni@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "generateText": [
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
    "commit_message_generator_llm_node_system": "@prompts/commit-message-generator_llm-node_system.md",
    "commit_message_generator_llm_node_user": "@prompts/commit-message-generator_llm-node_user.md"
  },
  "modelConfigs": {
    "commit_message_generator_generateText_generative_model_name": "@model-configs/commit-message-generator_generateText_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "apiRequest",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "apiRequest",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"git_diff\": \"string\"\n}"
      }
    }
  },
  {
    "id": "generateText",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "generateText",
        "tools": [],
        "prompts": [
          {
            "id": "prompt_system",
            "role": "system",
            "content": "@prompts/commit-message-generator_llm-node_system.md"
          },
          {
            "id": "prompt_user",
            "role": "user",
            "content": "@prompts/commit-message-generator_llm-node_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/commit-message-generator_generateText_generative-model-name.ts"
      }
    }
  },
  {
    "id": "apiResponse",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "apiResponse",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"response\": \"{{generateText.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "apiRequest-generateText",
    "source": "apiRequest",
    "target": "generateText",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "generateText-apiResponse",
    "source": "generateText",
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
