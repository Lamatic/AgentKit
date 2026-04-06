// Flow: rag-chatbot
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "RAG Chatbot",
  description: "This flow builds a chatbot that answers questions based on a context database containing all relevant information. User queries are answered using the existing documentation.",
  tags: ["📞 Support", "🚀 Startup"],
  testInput: null,
  deployUrl: "https://studio.lamatic.ai/template/rag-chatbot",
  author: {
    name: "Naitik Kapadia",
    email: "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = {
  prompts: {
    system: "@prompts/system.md"          // → prompts/system.md
  },
  constitutions: {
    default: "@constitutions/default.md"  // → constitutions/default.md
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
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
    "id": "RAGNode_919",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": 5,
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "vectorDB": "",
        "certainty": "0.5",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": {},
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "chatResponseNode_988",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
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
