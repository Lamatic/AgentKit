// Flow: knowledge-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Knowledge Chatbot",
  "description": "Contextual api to answer queries with knowledge from Content",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "RAGNode_711": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Database",
      "required": true,
      "isPrivate": true,
      "description": "Select the vector database to be queried.",
      "defaultValue": ""
    },
    {
      "mode": "embedding",
      "name": "embeddingModelName",
      "type": "model",
      "label": "Embedding Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "embedder/text",
      "description": "This field allows the user to select the embedding model used to embed the query into vector space. It loads available embedding models through the listModels method.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    },
    {
      "mode": "chat",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model to generate responses from the query results.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "knowledge_chatbot_rag_system": "@prompts/knowledge-chatbot_rag_system.md",
    "knowledge_chatbot_rag_user": "@prompts/knowledge-chatbot_rag_user.md"
  },
  "modelConfigs": {
    "knowledge_chatbot_rag": "@model-configs/knowledge-chatbot_rag.ts"
  },
  "triggers": {
    "knowledge_chatbot_chat_widget": "@triggers/widgets/knowledge-chatbot_chat-widget.ts"
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
        "chat": "@triggers/widgets/knowledge-chatbot_chat-widget.ts",
        "domains": "@triggers/widgets/knowledge-chatbot_chat-widget.ts",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://api.lamatic.ai/storage/v1/object/public/widget-avatar/LamaticShowcase/UrlScraperChatbot866/2bf0df6e-04b0-4392-8100-4c8a4d5eeb09/1749111185167.png",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "showAdvancedColors": true,
          "userMessageBgColor": "#FEF2F2",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#d12323",
          "agentMessageTextColor": "#334155"
        }
      }
    }
  },
  {
    "id": "RAGNode_711",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "modes": {},
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/knowledge-chatbot_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/knowledge-chatbot_rag_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/knowledge-chatbot_rag_user.md"
          }
        ],
        "memories": "@model-configs/knowledge-chatbot_rag.ts",
        "messages": "@model-configs/knowledge-chatbot_rag.ts",
        "certainty": "@model-configs/knowledge-chatbot_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/knowledge-chatbot_rag.ts",
        "generativeModelName": "@model-configs/knowledge-chatbot_rag.ts"
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
        "content": "{{RAGNode_711.output.modelResponse}}",
        "references": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_711",
    "source": "triggerNode_1",
    "target": "RAGNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_711-chatResponseNode_988",
    "source": "RAGNode_711",
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
