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
      "description": "Select the vector database containing product, policy, offer, and cart-recovery knowledge.",
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
      "description": "Select the embedding model used for retrieval.",
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
      "description": "Select the model used to generate cart-recovery responses.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    },
    {
      "name": "customer_name",
      "type": "string",
      "label": "Customer Name",
      "required": false,
      "isPrivate": false,
      "description": "Customer name used to personalize the recovery response.",
      "defaultValue": ""
    },
    {
      "name": "cart_items",
      "type": "string",
      "label": "Cart Items",
      "required": true,
      "isPrivate": false,
      "description": "Items currently present in the abandoned cart.",
      "defaultValue": ""
    },
    {
      "name": "cart_value",
      "type": "string",
      "label": "Cart Value",
      "required": true,
      "isPrivate": false,
      "description": "Total value of the abandoned cart.",
      "defaultValue": ""
    },
    {
      "name": "last_activity",
      "type": "string",
      "label": "Last Activity",
      "required": false,
      "isPrivate": false,
      "description": "Most recent relevant customer or cart activity.",
      "defaultValue": ""
    },
    {
      "name": "approved_offer",
      "type": "string",
      "label": "Approved Offer",
      "required": false,
      "isPrivate": false,
      "description": "Approved coupon, promotion, or recovery offer that the agent may recommend. Leave blank when no offer is authorized.",
      "defaultValue": ""
    },
    {
      "name": "discount_limit",
      "type": "string",
      "label": "Discount Limit",
      "required": false,
      "isPrivate": false,
      "description": "Maximum approved discount or eligibility restriction for recovery offers.",
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
        "customer_name": "{{RAGNode_711.input.customer_name}}",
        "cart_items": "{{RAGNode_711.input.cart_items}}",
        "cart_value": "{{RAGNode_711.input.cart_value}}",
        "last_activity": "{{RAGNode_711.input.last_activity}}",
        "approved_offer": "{{RAGNode_711.input.approved_offer}}",
        "discount_limit": "{{RAGNode_711.input.discount_limit}}",
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
