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
  "git_diff": {
    "type": "string",
    "description": "The git diff to generate a commit message for"
  }
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
    "nodeId": "apiRequest",
    "type": "interface.apiRequest",
    "values": {
      "schema": {
        "git_diff": "string"
      },
      "responseType": "realtime"
    }
  },
  {
    "nodeId": "generateText",
    "type": "ai.generateText",
    "values": {
      "prompts": [
        {
          "role": "system",
          "content": "@prompts/commit-message-generator_llm-node_system.md"
        },
        {
          "role": "user",
          "content": "@prompts/commit-message-generator_llm-node_user.md"
        }
      ],
      "generativeModelName": "@model-configs/commit-message-generator_generateText_generative-model-name.ts"
    }
  },
  {
    "nodeId": "apiResponse",
    "type": "interface.apiResponse",
    "values": {
      "response": "{{generateText.output.response}}"
    }
  }
];

export const edges = [
  {
    "source": "apiRequest",
    "target": "generateText"
  },
  {
    "source": "generateText",
    "target": "apiResponse"
  }
];

export default { meta, inputs, references, nodes, edges };
