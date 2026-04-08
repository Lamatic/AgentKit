// Flow: get-started

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Get Started",
  "description": "This flow introduces Lamatic AI and demonstrates how to fetch output from an LLM node. It provides a basic example of integrating an LLM into an automation workflow.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/get-started",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "get_started_generate_text_system": "@prompts/get-started_generate-text_system.md"
  },
  "modelConfigs": {
    "get_started_generate_text": "@model-configs/get-started_generate-text.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
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
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_398",
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
            "content": "@prompts/get-started_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/get-started_generate-text.ts",
        "messages": "@model-configs/get-started_generate-text.ts",
        "generativeModelName": "@model-configs/get-started_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_231",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_398.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_398",
    "source": "triggerNode_1",
    "target": "LLMNode_398",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_398-graphqlResponseNode_231",
    "source": "LLMNode_398",
    "target": "graphqlResponseNode_231",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_231",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_231",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
