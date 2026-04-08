// Flow: plant-care

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Plant Care",
  "description": "This AI-powered plant identification system processes user-provided image links, identifies plants, and generates structured output, enabling seamless analysis and data extraction from images.",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/plant-care",
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
    "plant_care_generate_text_system": "@prompts/plant-care_generate-text_system.md"
  },
  "modelConfigs": {
    "plant_care_generate_text": "@model-configs/plant-care_generate-text.ts"
  },
  "triggers": {
    "plant_care_api_request": "@triggers/webhooks/plant-care_api-request.ts"
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
        "responeType": "@triggers/webhooks/plant-care_api-request.ts",
        "advance_schema": "@triggers/webhooks/plant-care_api-request.ts"
      }
    }
  },
  {
    "id": "LLMNode_507",
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
            "content": "@prompts/plant-care_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/plant-care_generate-text.ts",
        "messages": "@model-configs/plant-care_generate-text.ts",
        "generativeModelName": "@model-configs/plant-care_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_710",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_507.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_507",
    "source": "triggerNode_1",
    "target": "LLMNode_507",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_507-graphqlResponseNode_710",
    "source": "LLMNode_507",
    "target": "graphqlResponseNode_710",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_710",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_710",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
