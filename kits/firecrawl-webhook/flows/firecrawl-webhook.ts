// Flow: firecrawl-webhook
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Firecrawl Webhook",
  "description": "This flow fetches pages from a crawler API, extracts only the page contents, and prepares to index them in a vector database, effectively indexing all the pages.",
  "tags": [
    "📱 Apps",
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/firecrawl-webhook",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "firecrawl_webhook_code": "@scripts/firecrawl-webhook_code.ts"
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
        "nodeName": "Webhook"
      }
    }
  },
  {
    "id": "conditionNode_199",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_673-addNode_460",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.type}}\",\n      \"operator\": \"==\",\n      \"value\": \"crawl.page\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_673-addNode_179",
            "condition": {}
          }
        ]
      }
    }
  },
  {
    "id": "addNode_728",
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
    "id": "addNode_817",
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
    "id": "codeNode_474",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/firecrawl-webhook_code.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_657",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_474.output.vectorData}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "IndexNode_117",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index",
        "primaryKeys": "",
        "vectorsField": "{{vectorizeNode_657.output.vectors}}",
        "metadataField": "{{codeNode_474.output.MetaData}}",
        "duplicateOperation": "overwrite"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-conditionNode_199",
    "source": "triggerNode_1",
    "target": "conditionNode_199",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_673-addNode_460",
    "source": "conditionNode_199",
    "target": "addNode_728",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_673-addNode_179",
    "source": "conditionNode_199",
    "target": "codeNode_474",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge"
  },
  {
    "id": "addNode_728-addNode_817",
    "source": "addNode_728",
    "target": "addNode_817",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_117-addNode_817",
    "source": "IndexNode_117",
    "target": "addNode_817",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_474-vectorizeNode_657",
    "source": "codeNode_474",
    "target": "vectorizeNode_657",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_657-IndexNode_117",
    "source": "vectorizeNode_657",
    "target": "IndexNode_117",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
