// Flow: recipe-generation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Recipe Generation",
  "description": "This AI-powered recipe generation system processes user-provided image links, identifies food items, and generates structured output, enabling seamless analysis and recipe ideation from food images.",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/recipe-generation",
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
    "recipe_generation_generate_text_system": "@prompts/recipe-generation_generate-text_system.md"
  },
  "modelConfigs": {
    "recipe_generation_generate_text": "@model-configs/recipe-generation_generate-text.ts"
  },
  "triggers": {
    "recipe_generation_api_request": "@triggers/webhooks/recipe-generation_api-request.ts"
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
        "responeType": "@triggers/webhooks/recipe-generation_api-request.ts",
        "advance_schema": "@triggers/webhooks/recipe-generation_api-request.ts"
      }
    }
  },
  {
    "id": "LLMNode_254",
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
            "content": "@prompts/recipe-generation_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/recipe-generation_generate-text.ts",
        "messages": "@model-configs/recipe-generation_generate-text.ts",
        "generativeModelName": "@model-configs/recipe-generation_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_393",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"receipe\": \"{{LLMNode_254.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_254",
    "source": "triggerNode_1",
    "target": "LLMNode_254",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_254-graphqlResponseNode_393",
    "source": "LLMNode_254",
    "target": "graphqlResponseNode_393",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_393",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_393",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
