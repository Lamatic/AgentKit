// Flow: document-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Document Chatbot",
  "description": "This flow integrates a chatbot widget into your local application, enabling users to get answers based on provided documents or media.",
  "tags": [
    "📞 Support",
    "🏷️ Sales"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/document-chatbot",
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
    "document_chatbot_generate_text_user": "@prompts/document-chatbot_generate-text_user.md",
    "document_chatbot_generate_text_system": "@prompts/document-chatbot_generate-text_system.md"
  },
  "scripts": {
    "document_chatbot_text_extraction": "@scripts/document-chatbot_text-extraction.ts"
  },
  "modelConfigs": {
    "document_chatbot_generate_text": "@model-configs/document-chatbot_generate-text.ts"
  },
  "triggers": {
    "document_chatbot_chat_widget": "@triggers/widgets/document-chatbot_chat-widget.ts"
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
        "chat": "@triggers/widgets/document-chatbot_chat-widget.ts",
        "domains": "@triggers/widgets/document-chatbot_chat-widget.ts"
      }
    }
  },
  {
    "id": "extractFromFileNode_239",
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
    "id": "codeNode_543",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Text Extraction",
        "code": "@scripts/document-chatbot_text-extraction.ts"
      }
    }
  },
  {
    "id": "LLMNode_444",
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
            "content": "@prompts/document-chatbot_generate-text_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/document-chatbot_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/document-chatbot_generate-text.ts",
        "messages": "@model-configs/document-chatbot_generate-text.ts",
        "generativeModelName": "@model-configs/document-chatbot_generate-text.ts"
      }
    }
  },
  {
    "id": "stickyNoteNode_592",
    "type": "stickyNoteNode",
    "position": {
      "x": 262.4254848785547,
      "y": 0.38631993294313816
    },
    "measured": {
      "width": 305,
      "height": 186
    },
    "data": {
      "nodeId": "stickyNoteNode",
      "values": {
        "nodeName": "Sticky Note",
        "text": "# This flow allows for a chatbot widget to be integrated in your local application, which allows for answering questions based on given documents/media.",
        "color": "purple",
        "nodeId": "stickyNoteNode",
        "nodeType": "stickyNoteNode"
      }
    }
  },
  {
    "id": "chatResponseNode_137",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "nodeName": "Chat Response",
        "content": "{{LLMNode_444.output.generatedResponse}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_239",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_239",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_239-codeNode_543",
    "source": "extractFromFileNode_239",
    "target": "codeNode_543",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_543-LLMNode_444",
    "source": "codeNode_543",
    "target": "LLMNode_444",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_444-chatResponseNode_137",
    "source": "LLMNode_444",
    "target": "chatResponseNode_137",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_137",
    "source": "triggerNode_1",
    "target": "chatResponseNode_137",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
