// Flow: indie-founder-radar

// -- Meta --
export const meta = {
  "name": "Indie Founder Radar",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ragotma",
    "email": "ragotmaragavendar@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "webSearchNode_630": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "LLMNode_276": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "indie_founder_radar_llmnode_276_system_0": "@prompts/indie-founder-radar_llmnode-276_system_0.md",
    "indie_founder_radar_llmnode_276_user_1": "@prompts/indie-founder-radar_llmnode-276_user_1.md"
  },
  "modelConfigs": {
    "indie_founder_radar_llmnode_276_generative_model_name": "@model-configs/indie-founder-radar_llmnode-276_generative-model-name.ts"
  },
  "scripts": {
    "indie_founder_radar_code_node_148_code": "@scripts/indie-founder-radar_code-node-148_code.ts"
  }
};

// -- Nodes & Edges --
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
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"idea\": \"string\"\n}"
      }
    }
  },
  {
    "id": "webSearchNode_630",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_630",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{triggerNode_1.output.idea}}",
        "country": "in",
        "results": 10,
        "language": "en",
        "location": "",
        "nodeName": "Web Search",
        "dateRange": "qdr:m",
        "credentials": "Serper Basic Auth"
      }
    }
  },
  {
    "id": "LLMNode_276",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/indie-founder-radar_llmnode-276_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/indie-founder-radar_llmnode-276_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/indie-founder-radar_llmnode-276_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_148",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/indie-founder-radar_code-node-148_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"report\": \"{{LLMNode_276.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "webSearchNode_630-LLMNode_276",
    "source": "webSearchNode_630",
    "target": "LLMNode_276",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-webSearchNode_630-377",
    "source": "triggerNode_1",
    "target": "webSearchNode_630",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_276-codeNode_148",
    "source": "LLMNode_276",
    "target": "codeNode_148",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_148-responseNode_triggerNode_1",
    "source": "codeNode_148",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
