// Flow: json-summariser

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "JSON Summariser",
  "description": "This workflow builds a JSON summarization system. It takes a URL of a JSON file as input, processes the data using a Generate Text node, and produces a concise summary of the key information, enabling efficient data analysis and easier extraction of insights from complex JSON structures.",
  "tags": [
    "📞 Support",
    "🌱 Growth"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/json-summariser",
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
    "json_summariser_generate_text_system": "@prompts/json-summariser_generate-text_system.md"
  },
  "modelConfigs": {
    "json_summariser_generate_text": "@model-configs/json-summariser_generate-text.ts"
  },
  "triggers": {
    "json_summariser_api_request": "@triggers/webhooks/json-summariser_api-request.ts"
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
        "responeType": "@triggers/webhooks/json-summariser_api-request.ts",
        "advance_schema": "@triggers/webhooks/json-summariser_api-request.ts"
      }
    }
  },
  {
    "id": "extractFromFileNode_674",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "nodeName": "Extract from File",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    }
  },
  {
    "id": "LLMNode_306",
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
            "content": "@prompts/json-summariser_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/json-summariser_generate-text.ts",
        "messages": "@model-configs/json-summariser_generate-text.ts",
        "generativeModelName": "@model-configs/json-summariser_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_153",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_306.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_674",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_674",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_674-LLMNode_306",
    "source": "extractFromFileNode_674",
    "target": "LLMNode_306",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_306-graphqlResponseNode_153",
    "source": "LLMNode_306",
    "target": "graphqlResponseNode_153",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_153",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_153",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
