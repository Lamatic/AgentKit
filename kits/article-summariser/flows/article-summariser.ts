// Flow: article-summariser
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Article Summariser",
  "description": "This workflow automates summarizing articles. It takes URLs, extracts content using Firecrawl, and generates concise summaries using an LLM, making it easier to quickly understand key points of long articles.",
  "tags": [
    "✨ Generative",
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/article-summariser",
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
  "prompts": {
    "article_summariser_generate_text_user": "@prompts/article-summariser_generate-text_user.md",
    "article_summariser_generate_text_system": "@prompts/article-summariser_generate-text_system.md"
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
    "id": "scraperNode_252",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "scraperNode",
      "values": {
        "nodeName": "Scraper",
        "url": "{{triggerNode_1.output.url}}",
        "mobile": false,
        "waitFor": 123,
        "credentials": null,
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    }
  },
  {
    "id": "LLMNode_160",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "201de7d9-b31f-4065-bbae-3363983ce3bf",
            "role": "user",
            "content": "@prompts/article-summariser_generate-text_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/article-summariser_generate-text_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "graphqlResponseNode_651",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"summary\": \"{{LLMNode_160.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_252",
    "source": "triggerNode_1",
    "target": "scraperNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "scraperNode_252-LLMNode_160",
    "source": "scraperNode_252",
    "target": "LLMNode_160",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_160-graphqlResponseNode_651",
    "source": "LLMNode_160",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_651",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
