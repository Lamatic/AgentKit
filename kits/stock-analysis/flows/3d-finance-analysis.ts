// Flow: 3d-finance-analysis

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3D. Finance - Analysis",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_936": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
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
    "generate_json_system": "@prompts/generate-json-system.md"
  },
  "modelConfigs": {
    "3d_finance_analysis_generate_json": "@model-configs/3d-finance-analysis_generate-json.ts"
  },
  "triggers": {
    "3d_finance_analysis_api_request": "@triggers/webhooks/3d-finance-analysis_api-request.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "@triggers/webhooks/3d-finance-analysis_api-request.ts",
        "advance_schema": "@triggers/webhooks/3d-finance-analysis_api-request.ts"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "branchNode_938",
    "data": {
      "label": "Branch",
      "modes": [],
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_938-addNode_792"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_938-addNode_602"
          },
          {
            "label": "Branch 3",
            "value": "branchNode_938-plus-node-addNode_280145-402"
          }
        ],
        "nodeName": "Fetch Data"
      }
    },
    "type": "branchNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "flowNode_507",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "flowNode",
      "values": {
        "flowId": "8f4818e3-2d0e-4d10-b7c9-9727d92bbcee",
        "nodeName": "Execute 3A. Finance - Fundamentals",
        "requestInput": "{\n  \"companies\": \"{{triggerNode_1.output.companies}}\"\n}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "flowNode_127",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "flowNode",
      "values": {
        "flowId": "5d286fc4-bd7a-457c-bdc8-65a4632247c4",
        "nodeName": "Execute 3B. Finance - Historical Stock Data",
        "requestInput": "{\n  \"companies\": \"{{triggerNode_1.output.companies}}\"\n}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 900,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "flowNode_114",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "flowNode",
      "values": {
        "flowId": "2ce04966-2b53-44ed-8216-1b82b72417e9",
        "nodeName": "Execute 3C. Finance - Market Sentiment",
        "requestInput": "{\n  \"companies\": \"{{triggerNode_1.output.companies}}\"\n}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_667",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "const oneYearAgo = new Date();\nconst fundamentals = {{flowNode_507.output.flowOutput.fundamental_data}};\nconst historicalStockData = {{flowNode_127.output.flowOutput.historic_data}};\nconst marketSentiment = {{flowNode_114.output.flowOutput.sentiment_data}};\n\noutput = {\n   \"date\" : oneYearAgo.toDateString(),\n   \"fundamentals\" : fundamentals,\n   \"historical_data\" : historicalStockData,\n   \"sentiment_data\" : marketSentiment   \n}",
        "nodeName": "Collate Data"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_936",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"comparitive_analysis\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the detailed comparative analysis between all the companies and their data given\"\n    },\n    \"charts\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"title\": {\n            \"type\": \"string\",\n            \"required\": true,\n            \"description\": \"The title of this chart\"\n          },\n          \"description\": {\n            \"type\": \"string\",\n            \"required\": true,\n            \"description\": \"The description of what this chart implies\"\n          },\n          \"code\": {\n            \"type\": \"string\",\n            \"required\": true,\n            \"description\": \"This is the JS Code required to showcase this chart\"\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"This is the collection of charts required to explain the analysis better \"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "DATE TODAY : {{codeNode_667.output.date}}\n\nCOMPANIES : {{triggerNode_1.output.companies}}\n\nCOMPANIES FUNDAMENTALS DATA : {{codeNode_667.output.fundamentals}}\n\nCOMPANIES HISTORIC STOCK DATA : {{codeNode_667.output.historical_data}}\n\nCOMPANIES SENTIMENT DATA : {{codeNode_667.output.sentiment_data}}"
          }
        ],
        "memories": "@model-configs/3d-finance-analysis_generate-json.ts",
        "messages": "@model-configs/3d-finance-analysis_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/3d-finance-analysis_generate-json.ts",
        "generativeModelName": "@model-configs/3d-finance-analysis_generate-json.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 600
    },
    "selected": true
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"comparitive_analysis\": \"{{InstructorLLMNode_936.output.comparitive_analysis}}\",\n  \"charts\": \"{{InstructorLLMNode_936.output.charts}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 750
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "InstructorLLMNode_936-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_936",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_667-InstructorLLMNode_936",
    "type": "defaultEdge",
    "source": "codeNode_667",
    "target": "InstructorLLMNode_936",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-branchNode_938",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "branchNode_938",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_938-flowNode_507-295",
    "data": {
      "condition": "Branch 1",
      "branchName": "Branch 1"
    },
    "type": "branchEdge",
    "source": "branchNode_938",
    "target": "flowNode_507",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "flowNode_507-codeNode_667-229",
    "type": "defaultEdge",
    "source": "flowNode_507",
    "target": "codeNode_667",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_938-flowNode_114-561",
    "data": {
      "branchName": "Branch 3"
    },
    "type": "branchEdge",
    "source": "branchNode_938",
    "target": "flowNode_114",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "flowNode_114-codeNode_667-864",
    "type": "defaultEdge",
    "source": "flowNode_114",
    "target": "codeNode_667",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_938-flowNode_127-800",
    "data": {
      "condition": "Branch 2",
      "branchName": "Branch 2"
    },
    "type": "branchEdge",
    "source": "branchNode_938",
    "target": "flowNode_127",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "flowNode_127-codeNode_667-981",
    "type": "defaultEdge",
    "source": "flowNode_127",
    "target": "codeNode_667",
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
  }
];

export default { meta, inputs, references, nodes, edges };
