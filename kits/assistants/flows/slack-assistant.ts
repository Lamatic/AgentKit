// Flow: slack-assistant

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Slack Assistant",
  "description": "Contextual Slack assistant with knowledge from Content",
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
  "slackNode_156": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Slack API authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "channelName",
      "type": "resourceLocator",
      "label": "Channel",
      "modes": [
        {
          "name": "list",
          "type": "select",
          "label": "From List",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "id",
          "type": "text",
          "label": "By ID",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "name",
          "type": "text",
          "label": "By Name",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "description": "Specify the Slack channel by selecting from a list or providing the name.",
      "typeOptions": {
        "loadOptionsMethod": "getChannels"
      },
      "displayOptions": {
        "hide": {},
        "show": {
          "action": [
            "postMessage"
          ]
        }
      },
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    }
  ],
  "triggerNode_1": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Slack API authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "channelName",
      "type": "resourceLocator",
      "label": "Channel",
      "modes": [
        {
          "name": "list",
          "type": "select",
          "label": "From List",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "id",
          "type": "text",
          "label": "By ID",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "description": "Specify the Slack channel by selecting from a list or providing the name.",
      "typeOptions": {
        "loadOptionsMethod": "getChannels"
      },
      "defaultModeValue": {
        "mode": "list",
        "value": ""
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
    "slack_assistant_rag_system": "@prompts/slack-assistant_rag_system.md",
    "slack_assistant_rag_user": "@prompts/slack-assistant_rag_user.md"
  },
  "modelConfigs": {
    "slack_assistant_rag": "@model-configs/slack-assistant_rag.ts"
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
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Slack Trigger",
        "command": "ask",
        "immediateResponseData": "typing..."
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
        "limit": "@model-configs/slack-assistant_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/slack-assistant_rag_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/slack-assistant_rag_user.md"
          }
        ],
        "memories": "@model-configs/slack-assistant_rag.ts",
        "messages": "@model-configs/slack-assistant_rag.ts",
        "certainty": "@model-configs/slack-assistant_rag.ts",
        "queryField": "{{triggerNode_1.output.text}}",
        "embeddingModelName": "@model-configs/slack-assistant_rag.ts",
        "generativeModelName": "@model-configs/slack-assistant_rag.ts"
      }
    }
  },
  {
    "id": "slackNode_156",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "values": {
        "nodeName": "Slack",
        "text": "{{RAGNode_233.output.modelResponse}}",
        "action": "postMessage"
      }
    }
  },
  {
    "id": "plus-node-addNode_983981",
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
    "id": "RAGNode_233-slackNode_156",
    "source": "RAGNode_233",
    "target": "slackNode_156",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "slackNode_156-plus-node-addNode_983981",
    "source": "slackNode_156",
    "target": "plus-node-addNode_983981",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
