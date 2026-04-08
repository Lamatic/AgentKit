// Flow: slack-ask-bot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Slack Ask Bot",
  "description": "Delivers instant answers through Slack using the /Ask command by running a RAG retrieval on vectorized data. Provides quick answers to audiences already using Slack.",
  "tags": [
    "📞 Support",
    "🚀 Startup",
    "📱 Apps"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/slack-ask-bot",
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
  "prompts": {
    "slack_ask_bot_rag_system": "@prompts/slack-ask-bot_rag_system.md"
  },
  "modelConfigs": {
    "slack_ask_bot_rag": "@model-configs/slack-ask-bot_rag.ts"
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
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Slack /Ask",
        "text": "$workflow.QuoteSend.output.generatedResponse",
        "action": "postMessage",
        "command": "ask",
        "trigger": "ask",
        "channelName": "help-product",
        "credentials": "Dylan Slack",
        "promptTemplate": "Generate a motivational quote about $slackNode.text",
        "generativeModelName": {},
        "immediateResponseData": "Please wait a moment while I answer your question: {{triggerNode_1.output.text}}"
      }
    }
  },
  {
    "id": "slackNode_207",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "slackNode",
      "values": {
        "nodeName": "Slack Response",
        "text": "{{RAGNode_939.output.modelResponse}}",
        "action": "postMessage",
        "channelName": "help-product",
        "credentials": "Dylan Slack",
        "promptTemplate": "Generate a motivational quote about $slackNode.text",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "RAGNode_939",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/slack-ask-bot_rag.ts",
        "filters": "[]",
        "prompts": [
          {
            "id": "38ac84dc-81e5-4fff-b524-8ce92660916b",
            "role": "system",
            "content": "@prompts/slack-ask-bot_rag_system.md"
          }
        ],
        "vectorDB": "",
        "certainty": "@model-configs/slack-ask-bot_rag.ts",
        "queryField": "{{triggerNode_1.output.text}}",
        "userTemplate": "User Query: {query} \\n Documents: {context}",
        "embeddingModelName": "@model-configs/slack-ask-bot_rag.ts",
        "generativeModelName": "@model-configs/slack-ask-bot_rag.ts"
      }
    }
  },
  {
    "id": "addNode_444",
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
    "id": "RAGNode_939-slackNode_207",
    "source": "RAGNode_939",
    "target": "slackNode_207",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-RAGNode_939",
    "source": "triggerNode_1",
    "target": "RAGNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "slackNode_207-addNode_444",
    "source": "slackNode_207",
    "target": "addNode_444",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
