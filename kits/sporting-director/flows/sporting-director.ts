// Flow: sporting-director

// -- Meta --
export const meta = {
  "name": "sporting-director",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Kishohar S",
    "email": "kishohar746@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "webSearchNode_492": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "LLMNode_505": [
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
    "sporting_director_llmnode_505_system_0": "@prompts/sporting-director_llmnode-505_system_0.md",
    "sporting_director_llmnode_505_user_1": "@prompts/sporting-director_llmnode-505_user_1.md"
  },
  "modelConfigs": {
    "sporting_director_llmnode_505_generative_model_name": "@model-configs/sporting-director_llmnode-505_generative-model-name.ts"
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
        "nodeName": "API Request",
        "advance_schema": "{\n  \"playerName\": \"string\",\n  \"buyingClub\": \"string\",\n  \"budget\": \"string\",\n  \"needs\": \"string\"\n}",
        "responeType": "realtime",
        "id": "triggerNode_1"
      }
    }
  },
  {
    "id": "webSearchNode_492",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "nodeName": "Web Search",
        "credentials": "Serper Basic Auth",
        "query": "{{triggerNode_1.output.playerName}} transfer news 2026",
        "type": "https://google.serper.dev/search",
        "dateRange": "qdr:m",
        "results": 10,
        "page": 1,
        "country": "uk",
        "language": "en",
        "location": "United Kingdom",
        "id": "webSearchNode_492"
      }
    }
  },
  {
    "id": "LLMNode_505",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "content": "@prompts/sporting-director_llmnode-505_system_0.md",
            "role": "system"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "content": "@prompts/sporting-director_llmnode-505_user_1.md",
            "role": "user"
          }
        ],
        "tools": [],
        "credentials": "",
        "messages": "[]",
        "memories": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/sporting-director_llmnode-505_generative-model-name.ts"
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
        "nodeName": "API Response",
        "outputMapping": "{\n  \"report\": \"generate Text.text\"\n}",
        "webhookUrl": "",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "retry_delay": "0",
        "id": "responseNode_triggerNode_1"
      }
    }
  }
];

export const edges = [
  {
    "id": "LLMNode_505-responseNode_triggerNode_1",
    "source": "LLMNode_505",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-webSearchNode_492",
    "source": "triggerNode_1",
    "target": "webSearchNode_492",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "webSearchNode_492-LLMNode_505",
    "source": "webSearchNode_492",
    "target": "LLMNode_505",
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
