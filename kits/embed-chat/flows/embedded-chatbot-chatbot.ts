// Flow: embedded-chatbot-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "2. Embedded Chatbot - Chatbot",
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
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "rag_system": "@prompts/rag-system.md",
    "embedded_chatbot_chatbot_rag_user": "@prompts/embedded-chatbot-chatbot_rag_user.md"
  },
  "modelConfigs": {
    "embedded_chatbot_chatbot_rag": "@model-configs/embedded-chatbot-chatbot_rag.ts"
  },
  "triggers": {
    "embedded_chatbot_chatbot_chat_widget": "@triggers/widgets/embedded-chatbot-chatbot_chat-widget.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "nodeId": "chatTriggerNode",
      "values": {
        "id": "triggerNode_1",
        "chat": "",
        "domains": "@triggers/widgets/embedded-chatbot-chatbot_chat-widget.ts",
        "nodeName": "Chat Widget",
        "chatConfig": "@triggers/widgets/embedded-chatbot-chatbot_chat-widget.ts"
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
      "y": 300
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
        "limit": "@model-configs/embedded-chatbot-chatbot_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/rag-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/embedded-chatbot-chatbot_rag_user.md"
          }
        ],
        "memories": "@model-configs/embedded-chatbot-chatbot_rag.ts",
        "messages": "@model-configs/embedded-chatbot-chatbot_rag.ts",
        "nodeName": "RAG",
        "vectorDB": "",
        "certainty": "@model-configs/embedded-chatbot-chatbot_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/embedded-chatbot-chatbot_rag.ts",
        "generativeModelName": "@model-configs/embedded-chatbot-chatbot_rag.ts"
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
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_711",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "RAGNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "RAGNode_711-chatResponseNode_988-221",
    "type": "defaultEdge",
    "source": "RAGNode_711",
    "target": "chatResponseNode_988",
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
