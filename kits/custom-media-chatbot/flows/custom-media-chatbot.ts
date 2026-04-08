// Flow: custom-media-chatbot
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Custom Media Chatbot",
  "description": "This flow builds a custom media-based chatbot that can answer questions based on your media file content in a ready-made chat interface, supporting text, JSON, HTML, and/or PDF files.",
  "tags": [
    "📞 Support",
    "🏷️ Sales"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/custom-media-chatbot",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "custom_media_chatbot_generate_text_user": "@prompts/custom-media-chatbot_generate-text_user.md",
    "custom_media_chatbot_generate_text_system": "@prompts/custom-media-chatbot_generate-text_system.md"
  },
  "scripts": {
    "custom_media_chatbot_text_extraction": "@scripts/custom-media-chatbot_text-extraction.ts"
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
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Chat Widget",
        "chat": "",
        "domains": []
      }
    }
  },
  {
    "id": "extractFromFileNode_126",
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
        "fileUrl": "https://www.nielit.gov.in/sites/default/files/ccc_syllabus_0.pdf",
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
    "id": "codeNode_140",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Text Extraction",
        "code": "@scripts/custom-media-chatbot_text-extraction.ts"
      }
    }
  },
  {
    "id": "LLMNode_919",
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
            "id": "9cd25ecf-58ad-45b0-8ca3-4412bd0f0f54",
            "role": "user",
            "content": "@prompts/custom-media-chatbot_generate-text_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/custom-media-chatbot_generate-text_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "chatResponseNode_414",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "nodeName": "Chat Response",
        "content": "{{LLMNode_919.output.generatedResponse}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_126",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_126",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_126-codeNode_140",
    "source": "extractFromFileNode_126",
    "target": "codeNode_140",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_140-LLMNode_919",
    "source": "codeNode_140",
    "target": "LLMNode_919",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_919-chatResponseNode_414",
    "source": "LLMNode_919",
    "target": "chatResponseNode_414",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_414",
    "source": "triggerNode_1",
    "target": "chatResponseNode_414",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
