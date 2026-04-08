// Flow: webpage-qa

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Webpage QA",
  "description": "This AI-powered system scrapes data from a website, processes it using AI, and enables users to ask questions based on the extracted information.",
  "tags": [
    "🚀 Startup",
    "📱 Apps"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/webpage-qa",
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
    "webpage_qa_generate_text_system": "@prompts/webpage-qa_generate-text_system.md"
  },
  "modelConfigs": {
    "webpage_qa_generate_text": "@model-configs/webpage-qa_generate-text.ts"
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "scraperNode_601",
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
        "credentials": "FIRECRAWL_API_KEY",
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    }
  },
  {
    "id": "LLMNode_449",
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
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/webpage-qa_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/webpage-qa_generate-text.ts",
        "messages": "@model-configs/webpage-qa_generate-text.ts",
        "generativeModelName": "@model-configs/webpage-qa_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_147",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_449.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_601",
    "source": "triggerNode_1",
    "target": "scraperNode_601",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "scraperNode_601-LLMNode_449",
    "source": "scraperNode_601",
    "target": "LLMNode_449",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_449-graphqlResponseNode_147",
    "source": "LLMNode_449",
    "target": "graphqlResponseNode_147",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_147",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_147",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
