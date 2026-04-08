// Flow: agentic-reasoning-data-source

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning - Data Source Search",
  "description": "This flow searches the indexed data source and returns the most relevant references",
  "tags": "",
  "testInput": {
    "steps": "I want to search the documents of how lamatic works, it's deployment process, infrastructure, and how projects are deployed and with this, design the final answer for user query"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_445": [
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
  ],
  "searchNode_278": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
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
    "generate_json_system": "@prompts/generate-json-system.md",
    "agentic_reasoning_data_source_generate_json_user": "@prompts/agentic-reasoning-data-source_generate-json_user.md"
  },
  "modelConfigs": {
    "agentic_reasoning_data_source_generate_json": "@model-configs/agentic-reasoning-data-source_generate-json.ts"
  },
  "scripts": {
    "agentic_reasoning_data_source_collate_results": "@scripts/agentic-reasoning-data-source_collate-results.ts"
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
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
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
    "id": "InstructorLLMNode_445",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"queries\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"required\": true\n      },\n      \"description\": \"This is the collection of queries based on which the research will be prepared\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-reasoning-data-source_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/agentic-reasoning-data-source_generate-json.ts",
        "messages": "@model-configs/agentic-reasoning-data-source_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/agentic-reasoning-data-source_generate-json.ts",
        "generativeModelName": "@model-configs/agentic-reasoning-data-source_generate-json.ts"
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
    "id": "forLoopNode_351",
    "data": {
      "label": "forLoopNode node",
      "modes": {},
      "nodeId": "forLoopNode",
      "values": {
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_384",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{InstructorLLMNode_445.output.queries}}"
      }
    },
    "type": "forLoopNode",
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
    "id": "searchNode_278",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "limit": "3",
        "filters": "[]",
        "nodeName": "Vector Search",
        "vectorDB": "",
        "certainty": "0.6",
        "searchQuery": "{{forLoopNode_351.output.currentValue}}",
        "embeddingModelName": ""
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
    "id": "forLoopEndNode_384",
    "data": {
      "label": "forLoopEndNode node",
      "modes": {},
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_351"
      }
    },
    "type": "forLoopEndNode",
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
    "id": "codeNode_909",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-reasoning-data-source_collate-results.ts",
        "nodeName": "Collate Results"
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
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"research\": \"{{codeNode_909.output.research}}\",\n  \"links\": \"{{codeNode_909.output.links}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_445",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_445",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_445-forLoopNode_351-649",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_445",
    "target": "forLoopNode_351",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_351-searchNode_278-841",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_351",
    "target": "searchNode_278",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_278-forLoopEndNode_384-659",
    "type": "defaultEdge",
    "source": "searchNode_278",
    "target": "forLoopEndNode_384",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_384-codeNode_909",
    "type": "defaultEdge",
    "source": "forLoopEndNode_384",
    "target": "codeNode_909",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_909-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_909",
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
    "id": "forLoopNode_351-forLoopEndNode_384-454",
    "data": {
      "condition": "Loop"
    },
    "type": "loopEdge",
    "source": "forLoopNode_351",
    "target": "forLoopEndNode_384",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_384-forLoopNode_351-433",
    "data": {
      "condition": "Loop",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "forLoopEndNode_384",
    "target": "forLoopNode_351",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
