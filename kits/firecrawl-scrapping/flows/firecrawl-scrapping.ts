// Flow: firecrawl-scrapping
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Firecrawl Scrapping",
  "description": "This flow allows the user to start the crawling process of a webpage and send its pages to a webhook flow to commence indexing the document.",
  "tags": [
    "🚀 Startup",
    "📱 Apps"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/firecrawl-scrapping",
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"url\": \"string\"\n}"
      }
    }
  },
  {
    "id": "crawlerNode_476",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "crawlerNode",
      "values": {
        "nodeName": "Crawler",
        "url": "{{triggerNode_1.output.url}}",
        "crawlDepth": 1,
        "crawlLimit": 10,
        "credentials": "FIRECRAWL_API_KEY",
        "excludePath": [],
        "includePath": [],
        "crawlSubPages": false
      }
    }
  },
  {
    "id": "graphqlResponseNode_412",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"status\": \"{{crawlerNode_476.output.success}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-crawlerNode_476",
    "source": "triggerNode_1",
    "target": "crawlerNode_476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "crawlerNode_476-graphqlResponseNode_412",
    "source": "crawlerNode_476",
    "target": "graphqlResponseNode_412",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_412",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_412",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
