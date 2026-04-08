// Flow: candidate-screener

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Candidate Screener",
  "description": "This AI-powered GitHub profile screening system automatically analyzes candidates' repositories, matches their experience and skills to job requirements, and generates personalized email responses - congratulating qualified candidates or providing feedback to those who don't meet the criteria.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/candidate-screener",
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
    "candidate_screener_classifier_system": "@prompts/candidate-screener_classifier_system.md",
    "candidate_screener_generate_text_system": "@prompts/candidate-screener_generate-text_system.md"
  },
  "modelConfigs": {
    "candidate_screener_generate_text": "@model-configs/candidate-screener_generate-text.ts"
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
    "id": "scraperNode_352",
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
    "id": "agentClassifierNode_511",
    "type": "agentClassifierNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentClassifierNode",
      "values": {
        "nodeName": "Classifier",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/candidate-screener_classifier_system.md"
          }
        ],
        "classifier": [
          {
            "label": "Selected",
            "value": "agentClassifierNode_818-addNode_161"
          },
          {
            "label": "Rejected",
            "value": "agentClassifierNode_818-addNode_164"
          }
        ],
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "LLMNode_366",
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
            "content": "@prompts/candidate-screener_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/candidate-screener_generate-text.ts",
        "messages": "@model-configs/candidate-screener_generate-text.ts",
        "generativeModelName": "@model-configs/candidate-screener_generate-text.ts"
      }
    }
  },
  {
    "id": "LLMNode_490",
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
            "content": "@prompts/candidate-screener_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/candidate-screener_generate-text.ts",
        "messages": "@model-configs/candidate-screener_generate-text.ts",
        "generativeModelName": "@model-configs/candidate-screener_generate-text.ts"
      }
    }
  },
  {
    "id": "apiNode_413",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "nodeName": "API",
        "url": "https://dhruvlamatic.app.n8n.cloud/webhook/9ed5e934-205e-4383-b783-60049c112985",
        "body": "{\n    \"email\" : {{triggerNode_1.output.email}},\n    \"content\" : {{LLMNode_366.output.generatedResponse}}\n}",
        "method": "POST",
        "headers": "",
        "retries": "0",
        "retry_deplay": "0"
      }
    }
  },
  {
    "id": "apiNode_443",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "nodeName": "API",
        "url": "https://dhruvlamatic.app.n8n.cloud/webhook/9ed5e934-205e-4383-b783-60049c112985",
        "body": "{\n    \"email\" : {{triggerNode_1.output.email}},\n    \"content\" : {{LLMNode_490.output.generatedResponse}}\n}",
        "method": "POST",
        "headers": "",
        "retries": "0",
        "retry_deplay": "0"
      }
    }
  },
  {
    "id": "graphqlResponseNode_921",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"email\": \"{{triggerNode_1.output.email}}\",\n  \"status\": \"{{agentClassifierNode_511.output.class}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_352",
    "source": "triggerNode_1",
    "target": "scraperNode_352",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "scraperNode_352-agentClassifierNode_511",
    "source": "scraperNode_352",
    "target": "agentClassifierNode_511",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentClassifierNode_818-addNode_161",
    "source": "agentClassifierNode_511",
    "target": "LLMNode_366",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Selected"
    },
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_818-addNode_164",
    "source": "agentClassifierNode_511",
    "target": "LLMNode_490",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Rejected"
    },
    "type": "agentClassifierEdge"
  },
  {
    "id": "LLMNode_366-apiNode_413",
    "source": "LLMNode_366",
    "target": "apiNode_413",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_490-apiNode_443",
    "source": "LLMNode_490",
    "target": "apiNode_443",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_413-graphqlResponseNode_921",
    "source": "apiNode_413",
    "target": "graphqlResponseNode_921",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_443-graphqlResponseNode_921",
    "source": "apiNode_443",
    "target": "graphqlResponseNode_921",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_921",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_921",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
