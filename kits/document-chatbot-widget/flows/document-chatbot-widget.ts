// Flow: document-chatbot-widget

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Document Chatbot (Widget)",
  "description": "A conversational AI chat widget that engages users with interactive discussions about content from a connected vector database. Easily deployable to applications and websites, ideal for user documentation, release notes, and more.",
  "tags": [
    "📞 Support",
    "🏷️ Sales"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/document-chatbot-widget",
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
  "modelConfigs": {
    "document_chatbot_widget_rag": "@model-configs/document-chatbot-widget_rag.ts"
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
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Chat Widget",
        "chat": ""
      }
    }
  },
  {
    "id": "RAGNode_314",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/document-chatbot-widget_rag.ts",
        "filters": "[]",
        "messages": "@model-configs/document-chatbot-widget_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/document-chatbot-widget_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "systemPrompt": "You are a helpful AI assistant that answers user queries based on the context provided to you.",
        "embeddingModelName": "@model-configs/document-chatbot-widget_rag.ts",
        "generativeModelName": "@model-configs/document-chatbot-widget_rag.ts"
      }
    }
  },
  {
    "id": "addNode_930",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {
        "nodeName": ""
      }
    }
  },
  {
    "id": "chatResponseNode_842",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "nodeName": "Chat Response",
        "content": "{{RAGNode_314.output.modelResponse}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_314",
    "source": "triggerNode_1",
    "target": "RAGNode_314",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_314-addNode_930",
    "source": "RAGNode_314",
    "target": "addNode_930",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_930-chatResponseNode_842",
    "source": "addNode_930",
    "target": "chatResponseNode_842",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_842",
    "source": "triggerNode_1",
    "target": "chatResponseNode_842",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
