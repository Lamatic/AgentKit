// Flow: currency-converter

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Currency Converter",
  "description": "This flow builds a currency converter that fetches real-time exchange rates, enabling users to accurately convert between any currencies.",
  "tags": [
    "🛠️ Tools"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/currency-converter",
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
    "currency_converter_generate_text_system": "@prompts/currency-converter_generate-text_system.md"
  },
  "modelConfigs": {
    "currency_converter_generate_text": "@model-configs/currency-converter_generate-text.ts"
  },
  "triggers": {
    "currency_converter_api_request": "@triggers/webhooks/currency-converter_api-request.ts"
  },
  "tools": {
    "currency_converter_generate_text_tools": "@tools/currency-converter_generate-text_tools.ts"
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
        "responeType": "@triggers/webhooks/currency-converter_api-request.ts",
        "advance_schema": "@triggers/webhooks/currency-converter_api-request.ts"
      }
    }
  },
  {
    "id": "LLMNode_424",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": "@tools/currency-converter_generate-text_tools.ts",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/currency-converter_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/currency-converter_generate-text.ts",
        "messages": "@model-configs/currency-converter_generate-text.ts",
        "generativeModelName": "@model-configs/currency-converter_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_737",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_424.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_424",
    "source": "triggerNode_1",
    "target": "LLMNode_424",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_424-graphqlResponseNode_737",
    "source": "LLMNode_424",
    "target": "graphqlResponseNode_737",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_737",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_737",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
