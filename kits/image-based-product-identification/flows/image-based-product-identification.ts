// Flow: image-based-product-identification

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Image-Based Product Identification",
  "description": "This flow builds an AI-powered product identification system that processes image links, identifies products, and generates a structured JSON output with product name, description, and shopping link, enabling seamless analysis and data extraction from images.",
  "tags": [
    "🚀 Startup",
    "🔒 Compliance"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/image-based-product-identification",
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
    "image_based_product_identification_generate_text_system": "@prompts/image-based-product-identification_generate-text_system.md"
  },
  "scripts": {
    "image_based_product_identification_code": "@scripts/image-based-product-identification_code.ts"
  },
  "modelConfigs": {
    "image_based_product_identification_generate_text": "@model-configs/image-based-product-identification_generate-text.ts"
  },
  "triggers": {
    "image_based_product_identification_api_request": "@triggers/webhooks/image-based-product-identification_api-request.ts"
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
        "responeType": "@triggers/webhooks/image-based-product-identification_api-request.ts",
        "advance_schema": "@triggers/webhooks/image-based-product-identification_api-request.ts"
      }
    }
  },
  {
    "id": "LLMNode_918",
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
            "id": "ac649ac6-3c1c-4a20-a7fe-a583d11519ae",
            "role": "system",
            "content": "@prompts/image-based-product-identification_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/image-based-product-identification_generate-text.ts",
        "messages": "@model-configs/image-based-product-identification_generate-text.ts",
        "generativeModelName": "@model-configs/image-based-product-identification_generate-text.ts"
      }
    }
  },
  {
    "id": "codeNode_743",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/image-based-product-identification_code.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_410",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"image_data\": \"{{codeNode_743.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_918",
    "source": "triggerNode_1",
    "target": "LLMNode_918",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_918-codeNode_743",
    "source": "LLMNode_918",
    "target": "codeNode_743",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_743-graphqlResponseNode_410",
    "source": "codeNode_743",
    "target": "graphqlResponseNode_410",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_410",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_410",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
