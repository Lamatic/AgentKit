// Flow: review-responder

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Review Responder",
  "description": "This AI-powered review analysis and response system automatically classifies customer reviews, analyzes sentiment, and generates personalized email responses tailored to your needs.",
  "tags": [
    "🚀 Startup",
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/review-responder",
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
    "review_responder_generate_text_system": "@prompts/review-responder_generate-text_system.md"
  },
  "scripts": {
    "review_responder_code": "@scripts/review-responder_code.ts"
  },
  "modelConfigs": {
    "review_responder_generate_text": "@model-configs/review-responder_generate-text.ts"
  },
  "triggers": {
    "review_responder_api_request": "@triggers/webhooks/review-responder_api-request.ts"
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
        "responeType": "@triggers/webhooks/review-responder_api-request.ts",
        "advance_schema": "@triggers/webhooks/review-responder_api-request.ts"
      }
    }
  },
  {
    "id": "LLMNode_773",
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
            "content": "@prompts/review-responder_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/review-responder_generate-text.ts",
        "messages": "@model-configs/review-responder_generate-text.ts",
        "generativeModelName": "@model-configs/review-responder_generate-text.ts"
      }
    }
  },
  {
    "id": "conditionNode_550",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_625-addNode_150",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \" {{LLMNode_312.output.generatedResponse}}\",\n      \"operator\": \"==\",\n      \"value\": \"product\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_625-addNode_466",
            "condition": {}
          }
        ]
      }
    }
  },
  {
    "id": "LLMNode_263",
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
            "content": "@prompts/review-responder_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/review-responder_generate-text.ts",
        "messages": "@model-configs/review-responder_generate-text.ts",
        "generativeModelName": "@model-configs/review-responder_generate-text.ts"
      }
    }
  },
  {
    "id": "LLMNode_704",
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
            "content": "@prompts/review-responder_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/review-responder_generate-text.ts",
        "messages": "@model-configs/review-responder_generate-text.ts",
        "generativeModelName": "@model-configs/review-responder_generate-text.ts"
      }
    }
  },
  {
    "id": "codeNode_252",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/review-responder_code.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_617",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"email\": \"{{codeNode_252.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_773",
    "source": "triggerNode_1",
    "target": "LLMNode_773",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_773-conditionNode_550",
    "source": "LLMNode_773",
    "target": "conditionNode_550",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_625-addNode_150",
    "source": "conditionNode_550",
    "target": "LLMNode_263",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_625-addNode_466",
    "source": "conditionNode_550",
    "target": "LLMNode_704",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_263-codeNode_252",
    "source": "LLMNode_263",
    "target": "codeNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_704-codeNode_252",
    "source": "LLMNode_704",
    "target": "codeNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_252-graphqlResponseNode_617",
    "source": "codeNode_252",
    "target": "graphqlResponseNode_617",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_617",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_617",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
