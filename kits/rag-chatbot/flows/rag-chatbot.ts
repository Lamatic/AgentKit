// Flow: rag-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "RAG Chatbot",
  "description": "This flow builds a chatbot that answers questions based on a context database containing all relevant information. User queries are answered using the existing documentation.",
  "tags": [
    "📞 Support",
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/rag-chatbot",
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
    "rag_chatbot_rag_system": "@prompts/rag-chatbot_rag_system.md"
  },
  "modelConfigs": {
    "rag_chatbot_rag": "@model-configs/rag-chatbot_rag.ts"
  },
  "triggers": {
    "rag_chatbot_chat_widget": "@triggers/widgets/rag-chatbot_chat-widget.ts"
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
        "chat": "@triggers/widgets/rag-chatbot_chat-widget.ts",
        "domains": "@triggers/widgets/rag-chatbot_chat-widget.ts"
      }
    }
  },
  {
    "id": "RAGNode_919",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/rag-chatbot_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/rag-chatbot_rag_system.md"
          }
        ],
        "memories": "@model-configs/rag-chatbot_rag.ts",
        "messages": "@model-configs/rag-chatbot_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/rag-chatbot_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/rag-chatbot_rag.ts",
        "generativeModelName": "@model-configs/rag-chatbot_rag.ts"
      }
    }
  },
  {
    "id": "chatResponseNode_988",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "nodeName": "Chat Response",
        "content": "{{RAGNode_919.output.modelResponse}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_919",
    "source": "triggerNode_1",
    "target": "RAGNode_919",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_919-chatResponseNode_988",
    "source": "RAGNode_919",
    "target": "chatResponseNode_988",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_988",
    "source": "triggerNode_1",
    "target": "chatResponseNode_988",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
