// Flow: index-github-actions

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Index GitHub Actions",
  "description": "Vectorizes GitHub Actions data and loads it into a vector database. Enables fast, accurate search and RAG Flows using the contextual data.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/index-github-actions",
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
  "scripts": {
    "index_github_actions_prepare_metadata": "@scripts/index-github-actions_prepare-metadata.ts"
  },
  "triggers": {
    "index_github_actions_github_action_webhook": "@triggers/webhooks/index-github-actions_github-action-webhook.ts"
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
      "nodeId": "webhookTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Github Action Webhook"
      }
    }
  },
  {
    "id": "chunkNode_860",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{triggerNode_1.output.content}}",
        "numOfChars": 1000,
        "separators": [
          "\n\n",
          "\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 100
      }
    }
  },
  {
    "id": "vectorizeNode_814",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{chunkNode_860.output.chunks[:].pageContent}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "IndexNode_998",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": "",
        "vectorsField": "{{codeNode_443.output.vectors}}",
        "metadataField": "{{codeNode_443.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "addNode_917",
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
  },
  {
    "id": "codeNode_443",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Prepare Metadata",
        "code": "@scripts/index-github-actions_prepare-metadata.ts"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-chunkNode_860",
    "source": "triggerNode_1",
    "target": "chunkNode_860",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_860-vectorizeNode_814",
    "source": "chunkNode_860",
    "target": "vectorizeNode_814",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_443-IndexNode_998",
    "source": "codeNode_443",
    "target": "IndexNode_998",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_998-addNode_917",
    "source": "IndexNode_998",
    "target": "addNode_917",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_814-codeNode_443",
    "source": "vectorizeNode_814",
    "target": "codeNode_443",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
