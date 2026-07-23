/*
 * # AI E-Commerce Cart Recovery Agent
 *
 * This flow helps recover abandoned shopping carts using AI.
 * It analyzes customer cart details, predicts purchase intent,
 * and generates personalized recovery messages to encourage
 * customers to complete their purchases.
 *
 * ## Purpose
 * The agent improves conversion rates by identifying abandoned
 * carts and generating intelligent recovery responses. It can
 * personalize follow-up messages, estimate purchase probability,
 * and recommend discounts only when appropriate.
 *
 * ## Workflow
 * Customer Chat Widget
 *        ↓
 * AI Cart Analysis
 *        ↓
 * Personalized Recovery Response
 *
 * ## Inputs
 * - Customer details
 * - Cart items
 * - Cart value
 * - Last activity
 *
 * ## Outputs
 * - Recovery message
 * - Purchase probability
 * - Suggested discount
 * - Next recommended action
 */
export const meta = {
  "name": "AI E-Commerce Cart Recovery Agent",
  "description": "AI-powered assistant that analyzes abandoned shopping carts, predicts customer intent, and generates personalized recovery messages.",
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
      "description":"Select the vector database that stores customer, cart, and product information used for AI-powered cart recovery.",
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  prompts: {
    cart_recovery_system: "@prompts/cart-recovery-system.md",
    cart_recovery_user: "@prompts/cart-recovery-user.md"
  },

  modelConfigs: {
    cart_recovery: "@model-configs/cart-recovery.ts"
  },

  triggers: {
    cart_recovery_chat_widget: "@triggers/widgets/cart-recovery-chat-widget.ts"
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
        "chat": "",
        "domains": "@triggers/widgets/cart-recovery-chat-widget.ts",
        "chatConfig": "@triggers/widgets/cart-recovery-chat-widget.ts"
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
        "limit": "@model-configs/cart-recovery.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/cart-recovery-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/cart-recovery-user.md"
          }
        ],
        "memories": "@model-configs/cart-recovery.ts",
        "messages": "@model-configs/cart-recovery.ts",
        "certainty": "@model-configs/cart-recovery.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/cart-recovery.ts",
        "generativeModelName": "@model-configs/cart-recovery.ts"
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
