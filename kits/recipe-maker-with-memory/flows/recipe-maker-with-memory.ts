// Flow: recipe-maker-with-memory

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Recipe Maker with Memory",
  "description": "This AI-powered recipe generation system retains user preferences, dietary restrictions, and past interactions to generate personalised recipes with customised cooking instructions tailored to individual needs.",
  "tags": [
    "✨ Generative",
    "🛠️ Tools"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/recipe-maker-with-memory",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "recipe_maker_with_memory_generate_text_system": "@prompts/recipe-maker-with-memory_generate-text_system.md"
  },
  "modelConfigs": {
    "recipe_maker_with_memory_generate_text": "@model-configs/recipe-maker-with-memory_generate-text.ts"
  },
  "triggers": {
    "recipe_maker_with_memory_api_request": "@triggers/webhooks/recipe-maker-with-memory_api-request.ts"
  },
  "memory": {
    "recipe_maker_with_memory_memory_add": "@memory/recipe-maker-with-memory_memory-add.ts",
    "recipe_maker_with_memory_memory_retrieve": "@memory/recipe-maker-with-memory_memory-retrieve.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
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
        "nodeName": "API Request",
        "responeType": "@triggers/webhooks/recipe-maker-with-memory_api-request.ts",
        "advance_schema": "@triggers/webhooks/recipe-maker-with-memory_api-request.ts"
      }
    }
  },
  {
    "id": "memoryNode_396",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryNode",
      "values": {
        "nodeName": "Memory Add",
        "uniqueId": "@memory/recipe-maker-with-memory_memory-add.ts",
        "sessionId": "@memory/recipe-maker-with-memory_memory-add.ts",
        "memoryValue": "@memory/recipe-maker-with-memory_memory-add.ts",
        "memoryCollection": "@memory/recipe-maker-with-memory_memory-add.ts",
        "embeddingModelName": "@memory/recipe-maker-with-memory_memory-add.ts",
        "generativeModelName": "@memory/recipe-maker-with-memory_memory-add.ts"
      }
    }
  },
  {
    "id": "memoryRetrieveNode_711",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "nodeName": "Memory Retrieve",
        "limit": "@memory/recipe-maker-with-memory_memory-retrieve.ts",
        "filters": "@memory/recipe-maker-with-memory_memory-retrieve.ts",
        "searchQuery": "@memory/recipe-maker-with-memory_memory-retrieve.ts",
        "memoryCollection": "@memory/recipe-maker-with-memory_memory-retrieve.ts",
        "embeddingModelName": "@memory/recipe-maker-with-memory_memory-retrieve.ts",
        "generativeModelName": "@memory/recipe-maker-with-memory_memory-retrieve.ts"
      }
    }
  },
  {
    "id": "LLMNode_730",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/recipe-maker-with-memory_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/recipe-maker-with-memory_generate-text.ts",
        "messages": "@model-configs/recipe-maker-with-memory_generate-text.ts",
        "generativeModelName": "@model-configs/recipe-maker-with-memory_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_127",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"recipe\": \"{{LLMNode_730.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-memoryNode_396",
    "source": "triggerNode_1",
    "target": "memoryNode_396",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryNode_396-memoryRetrieveNode_711",
    "source": "memoryNode_396",
    "target": "memoryRetrieveNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryRetrieveNode_711-LLMNode_730",
    "source": "memoryRetrieveNode_711",
    "target": "LLMNode_730",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_730-graphqlResponseNode_127",
    "source": "LLMNode_730",
    "target": "graphqlResponseNode_127",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_127",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_127",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
