/*
 * # Reddit Scout
 * A retrieval-and-synthesis flow that turns a user-provided product or topic query into a structured Reddit-based review summary, serving as the primary end-to-end execution path in the broader Reddit Scout system.
 */

// Flow: reddit-scout

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Reddit Scout",
  "description": "",
  "tags": [
    "6028052f-e3bf-48ad-95d2-a83909a45bf1"
  ],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_988": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "webSearchNode_187": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "description": "Select the credentials for Serper authentication.",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "webSearchNode_141": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "description": "Select the credentials for Serper authentication.",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "LLMNode_936": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
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
    "reddit_scout_generate_text_system": "@prompts/reddit-scout_generate-text_system.md",
    "reddit_scout_generate_text_user": "@prompts/reddit-scout_generate-text_user.md"
  },
  "scripts": {
    "reddit_scout_code": "@scripts/reddit-scout_code.ts"
  },
  "modelConfigs": {
    "reddit_scout_generate_text": "@model-configs/reddit-scout_generate-text.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"query\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "LLMNode_988",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_988",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/reddit-scout_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/reddit-scout_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/reddit-scout_generate-text.ts",
        "messages": "@model-configs/reddit-scout_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/reddit-scout_generate-text.ts",
        "credentials": "@model-configs/reddit-scout_generate-text.ts",
        "generativeModelName": "@model-configs/reddit-scout_generate-text.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "webSearchNode_187",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_187",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{LLMNode_988.output.generatedResponse}}",
        "country": "in",
        "results": "4",
        "language": "en",
        "location": "India",
        "nodeName": "Web Search",
        "dateRange": "qdr:y",
        "credentials": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "codeNode_892",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "redditData": "string"
      },
      "values": {
        "id": "codeNode_892",
        "code": "@scripts/reddit-scout_code.ts",
        "nodeName": "Code"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "batchNode_890",
    "data": {
      "label": "batchNode node",
      "modes": {},
      "nodeId": "batchNode",
      "values": {
        "id": "batchNode_890",
        "endValue": 10,
        "nodeName": "Batch",
        "increment": 1,
        "connectedTo": "batchEndNode_732",
        "iterateOver": "list",
        "initialValue": 0,
        "iteratorValue": "{{codeNode_892.output}}",
        "concurrencyLimit": "1"
      }
    },
    "type": "batchNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false
  },
  {
    "id": "webSearchNode_141",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_141",
        "page": 1,
        "type": "https://scrape.serper.dev",
        "query": "{{batchNode_890.output.currentValue}}",
        "country": "",
        "results": "1",
        "language": "",
        "location": "",
        "nodeName": "Web Search",
        "dateRange": "",
        "credentials": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "batchEndNode_732",
    "data": {
      "label": "batchEndNode node",
      "modes": {},
      "nodeId": "batchEndNode",
      "values": {
        "nodeName": "Batch End",
        "connectedTo": "batchNode_890"
      }
    },
    "type": "batchEndNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    }
  },
  {
    "id": "codeNode_524",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "allRedditData": "string"
      },
      "values": {
        "id": "codeNode_524",
        "code": "@scripts/reddit-scout_code.ts",
        "nodeName": "Code"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 910
    },
    "selected": false
  },
  {
    "id": "LLMNode_936",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_936",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/reddit-scout_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/reddit-scout_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/reddit-scout_generate-text.ts",
        "messages": "@model-configs/reddit-scout_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/reddit-scout_generate-text.ts",
        "credentials": "@model-configs/reddit-scout_generate-text.ts",
        "generativeModelName": "@model-configs/reddit-scout_generate-text.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 1040
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_936.output.generatedResponse}}\"\n}"
      },
      "disabled": false,
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 1170
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_988",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_988",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_988-webSearchNode_187",
    "type": "defaultEdge",
    "source": "LLMNode_988",
    "target": "webSearchNode_187",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "webSearchNode_187-codeNode_892",
    "type": "defaultEdge",
    "source": "webSearchNode_187",
    "target": "codeNode_892",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_892-batchNode_890-137",
    "type": "defaultEdge",
    "source": "codeNode_892",
    "target": "batchNode_890",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "batchNode_890-webSearchNode_141-175",
    "data": {
      "condition": "Batch Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "batchNode_890",
    "target": "webSearchNode_141",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "webSearchNode_141-batchEndNode_732-738",
    "type": "defaultEdge",
    "source": "webSearchNode_141",
    "target": "batchEndNode_732",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "batchEndNode_732-codeNode_524-777",
    "type": "defaultEdge",
    "source": "batchEndNode_732",
    "target": "codeNode_524",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_524-LLMNode_936",
    "type": "defaultEdge",
    "source": "codeNode_524",
    "target": "LLMNode_936",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_936-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_936",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  },
  {
    "id": "batchNode_890-batchEndNode_732-990",
    "data": {
      "condition": "Batch"
    },
    "type": "loopEdge",
    "source": "batchNode_890",
    "target": "batchEndNode_732",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "batchEndNode_732-batchNode_890-440",
    "data": {
      "condition": "Batch",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "batchEndNode_732",
    "target": "batchNode_890",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
