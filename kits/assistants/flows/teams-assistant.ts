// Flow: teams-assistant

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Teams Assistant",
  "description": "Contextual Microsoft teams bot with knowledge from Content",
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
  "RAGNode_233": [
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
  ],
  "teamsNode_784": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Teams authentication.",
      "defaultValue": "",
      "isCredential": true
    }
  ],
  "triggerNode_1": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Teams authentication.",
      "defaultValue": "",
      "fillFromStep": {
        "name": "credentials",
        "step": 0,
        "nodeId": "teamsNode_784"
      },
      "isCredential": true
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
    "teams_assistant_rag_system": "@prompts/teams-assistant_rag_system.md",
    "teams_assistant_rag_user": "@prompts/teams-assistant_rag_user.md"
  },
  "modelConfigs": {
    "teams_assistant_rag": "@model-configs/teams-assistant_rag.ts"
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
      "nodeId": "teamsNode",
      "modes": {
        "chatId": "list",
        "teamId": "list",
        "channelId": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Teams",
        "conversationType": "botChat"
      }
    }
  },
  {
    "id": "RAGNode_233",
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
        "limit": "@model-configs/teams-assistant_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/teams-assistant_rag_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/teams-assistant_rag_user.md"
          }
        ],
        "memories": "@model-configs/teams-assistant_rag.ts",
        "messages": "@model-configs/teams-assistant_rag.ts",
        "certainty": "@model-configs/teams-assistant_rag.ts",
        "queryField": "{{triggerNode_1.output.text}}"
      }
    }
  },
  {
    "id": "teamsNode_784",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "teamsNode",
      "modes": {
        "chatId": "list",
        "teamId": "list",
        "channelId": "list"
      },
      "values": {
        "nodeName": "Teams",
        "message": "{{RAGNode_233.output.modelResponse}}",
        "botOperation": "sendMessage",
        "chatOperation": "sendMessage",
        "channelMessageId": "{{triggerNode_1.output.id}}",
        "channelOperation": "replyToMessage",
        "conversationId": "{{triggerNode_1.output.conversation.id}}",
        "conversationType": "bot",
        "includePoweredBy": true
      }
    }
  },
  {
    "id": "plus-node-addNode_557807",
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
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_233",
    "source": "triggerNode_1",
    "target": "RAGNode_233",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_233-teamsNode_784",
    "source": "RAGNode_233",
    "target": "teamsNode_784",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "teamsNode_784-plus-node-addNode_557807",
    "source": "teamsNode_784",
    "target": "plus-node-addNode_557807",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
