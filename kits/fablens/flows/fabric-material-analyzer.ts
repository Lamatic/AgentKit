// Flow: fabric-material-analyzer

// -- Meta --
export const meta = {
  "name": "fabric-material-analyzer",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Yashasvi Vij",
    "email": "yashasvivij01@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "scraperNode_601": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "LLMNode_449": [
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
    "fabric_material_analyzer_llmnode_449_system_0": "@prompts/fabric-material-analyzer_llmnode-449_system_0.md"
  },
  "modelConfigs": {
    "fabric_material_analyzer_llmnode_449_generative_model_name": "@model-configs/fabric-material-analyzer_llmnode-449_generative-model-name.ts"
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
        "responeType": "realtime",
        "advance_schema": "{\n  \"question\": \"string\",\n  \"url\": \"string\"\n}"
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
        "id": "scraperNode_601",
        "url": "{{triggerNode_1.output.url}}",
        "mobile": false,
        "waitFor": 123,
        "nodeName": "Scraper",
        "credentials": "{{scraperNode_601.input.credentials}}",
        "excludeTags": [
          "nav",
          "footer",
          "header",
          "script",
          "style"
        ],
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
        "id": "LLMNode_449",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/fabric-material-analyzer_llmnode-449_system_0.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "generativeModelName": "@model-configs/fabric-material-analyzer_llmnode-449_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_147",
    "type": "responseNode",
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
