// Flow: linkedin-post-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Linkedin Post Generator",
  "description": "This flow builds an AI-powered LinkedIn post automation system. It fetches newsletter emails via API, extracts key content, and generates engaging LinkedIn posts.",
  "tags": [
    "🌱 Growth",
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/linkedin-post-generator",
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
  "prompts": {
    "linkedin_post_generator_generate_text_system": "@prompts/linkedin-post-generator_generate-text_system.md"
  },
  "scripts": {
    "linkedin_post_generator_code": "@scripts/linkedin-post-generator_code.ts"
  },
  "modelConfigs": {
    "linkedin_post_generator_generate_text": "@model-configs/linkedin-post-generator_generate-text.ts"
  },
  "triggers": {
    "linkedin_post_generator_api_request": "@triggers/webhooks/linkedin-post-generator_api-request.ts"
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
        "responeType": "@triggers/webhooks/linkedin-post-generator_api-request.ts",
        "advance_schema": "@triggers/webhooks/linkedin-post-generator_api-request.ts"
      }
    }
  },
  {
    "id": "apiNode_485",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "nodeName": "API",
        "url": "https://dhruvlamatic.app.n8n.cloud/webhook/8cfe684a-6b95-495f-b29d-afb7a2c012e2",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "retry_deplay": "0"
      }
    }
  },
  {
    "id": "LLMNode_985",
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
            "content": "@prompts/linkedin-post-generator_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/linkedin-post-generator_generate-text.ts",
        "messages": "@model-configs/linkedin-post-generator_generate-text.ts",
        "generativeModelName": "@model-configs/linkedin-post-generator_generate-text.ts"
      }
    }
  },
  {
    "id": "forLoopNode_555",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "nodeName": "Loop",
        "wait": 0,
        "endValue": "10",
        "increment": "1",
        "connectedTo": "forLoopEndNode_724",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{codeNode_706.output}}"
      }
    }
  },
  {
    "id": "forLoopEndNode_724",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_555"
      }
    }
  },
  {
    "id": "LLMNode_522",
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
            "content": "@prompts/linkedin-post-generator_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/linkedin-post-generator_generate-text.ts",
        "messages": "@model-configs/linkedin-post-generator_generate-text.ts",
        "generativeModelName": "@model-configs/linkedin-post-generator_generate-text.ts"
      }
    }
  },
  {
    "id": "codeNode_706",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/linkedin-post-generator_code.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_676",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"posts\": \"{{forLoopEndNode_724.output.loopOutput}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-apiNode_485",
    "source": "triggerNode_1",
    "target": "apiNode_485",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_485-LLMNode_985",
    "source": "apiNode_485",
    "target": "LLMNode_985",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_706-forLoopNode_555",
    "source": "codeNode_706",
    "target": "forLoopNode_555",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_555-LLMNode_522",
    "source": "forLoopNode_555",
    "target": "LLMNode_522",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    }
  },
  {
    "id": "forLoopNode_555-forLoopEndNode_724",
    "source": "forLoopNode_555",
    "target": "forLoopEndNode_724",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": false
    }
  },
  {
    "id": "LLMNode_522-forLoopEndNode_724",
    "source": "LLMNode_522",
    "target": "forLoopEndNode_724",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_724-forLoopNode_555",
    "source": "forLoopEndNode_724",
    "target": "forLoopNode_555",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": true
    }
  },
  {
    "id": "LLMNode_985-codeNode_706",
    "source": "LLMNode_985",
    "target": "codeNode_706",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_724-graphqlResponseNode_676",
    "source": "forLoopEndNode_724",
    "target": "graphqlResponseNode_676",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_676",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_676",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
