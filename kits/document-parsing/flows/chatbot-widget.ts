// Flow: chatbot-widget

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Chatbot Widget - Assistant Bot",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "RAGNode_711": [
    {
      "name": "vectorDB",
      "label": "Database",
      "type": "select",
      "isDB": true,
      "required": true,
      "description": "Select the vector database to be queried.",
      "defaultValue": "",
      "isPrivate": true
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "description": "This field allows the user to select the embedding model used to embed the query into vector space. It loads available embedding models through the listModels method.",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "description": "Select the model to generate responses from the query results.",
      "type": "model",
      "mode": "chat",
      "modelType": "generator/text",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "isPrivate": true,
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
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
    "chatbot_widget_rag_system": "@prompts/chatbot-widget_rag_system.md",
    "chatbot_widget_rag_user": "@prompts/chatbot-widget_rag_user.md"
  },
  "modelConfigs": {
    "chatbot_widget_rag": "@model-configs/chatbot-widget_rag.ts"
  },
  "triggers": {
    "chatbot_widget_chat_widget": "@triggers/widgets/chatbot-widget_chat-widget.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "nodeId": "chatTriggerNode",
      "values": {
        "id": "triggerNode_1",
        "chat": "@triggers/widgets/chatbot-widget_chat-widget.ts",
        "domains": "@triggers/widgets/chatbot-widget_chat-widget.ts",
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://api.lamatic.ai/storage/v1/object/public/widget-avatar/LamaticShowcase/UrlScraperChatbot866/2bf0df6e-04b0-4392-8100-4c8a4d5eeb09/1749111185167.png",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "dialog",
          "placeholder": "Compose your message",
          "suggestions": [],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#4b65d9",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "showAdvancedColors": true,
          "userMessageBgColor": "#faf5ff",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#092395",
          "agentMessageTextColor": "#334155"
        }
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "variablesNode_789",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "variablesNode",
      "values": {
        "mapping": "{\n  \"instructions\": {\n    \"type\": \"string\",\n    \"value\": \"always give answer in a funny and quirky tone\"\n  }\n}",
        "nodeName": "Variables"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "RAGNode_711",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "RAGNode",
      "values": {
        "limit": "@model-configs/chatbot-widget_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/chatbot-widget_rag_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/chatbot-widget_rag_user.md"
          }
        ],
        "memories": "@model-configs/chatbot-widget_rag.ts",
        "messages": "@model-configs/chatbot-widget_rag.ts",
        "nodeName": "RAG",
        "vectorDB": "",
        "certainty": "@model-configs/chatbot-widget_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/chatbot-widget_rag.ts",
        "generativeModelName": "@model-configs/chatbot-widget_rag.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 300
    },
    "selected": true
  },
  {
    "id": "chatResponseNode_988",
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "id": "chatResponseNode_988",
        "content": "{{RAGNode_711.output.modelResponse}}",
        "nodeName": "Chat Response",
        "references": ""
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 450
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "RAGNode_711-chatResponseNode_988-221",
    "type": "defaultEdge",
    "source": "RAGNode_711",
    "target": "chatResponseNode_988",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-variablesNode_789",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_789",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_789-RAGNode_711",
    "type": "defaultEdge",
    "source": "variablesNode_789",
    "target": "RAGNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-chatResponseNode_988",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "chatResponseNode_988",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
