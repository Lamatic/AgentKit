// Flow: collect-sources

// -- Meta --
export const meta = {
  "name": "collect-sources",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Vishwa Nanavati",
    "email": "vpnanavati@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_434": [
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
    "collect_sources_llmnode_434_user_0": "@prompts/collect-sources_llmnode-434_user_0.md"
  },
  "modelConfigs": {
    "collect_sources_llmnode_434_generative_model_name": "@model-configs/collect-sources_llmnode-434_generative-model-name.ts"
  },
  "scripts": {
    "collect_sources_code_node_565_code": "@scripts/collect-sources_code-node-565_code.ts",
    "collect_sources_code_node_351_code": "@scripts/collect-sources_code-node-351_code.ts",
    "collect_sources_code_node_560_code": "@scripts/collect-sources_code-node-560_code.ts"
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
        "advance_schema": "{\"sampleInput\":\"string\"}"
      }
    }
  },
  {
    "id": "branchNode_535",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "id": "branchNode_535",
        "branches": [
          {
            "label": "arxiv-papers",
            "value": "branchNode_535-apiNode_948"
          },
          {
            "label": "github-trending",
            "value": "branchNode_535-codeNode_351"
          },
          {
            "label": "hackernews-top",
            "value": "branchNode_535-codeNode_565"
          },
          {
            "label": "gemini-search",
            "value": "branchNode_535-LLMNode_434"
          }
        ],
        "nodeName": "Branching"
      }
    }
  },
  {
    "id": "codeNode_565",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/collect-sources_code-node-565_code.ts",
        "nodeName": "Hacker news top stories"
      }
    }
  },
  {
    "id": "codeNode_351",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/collect-sources_code-node-351_code.ts",
        "nodeName": "Fetch github repo"
      }
    }
  },
  {
    "id": "apiNode_948",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_948",
        "url": "https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=15",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "fetch arxiv papers",
        "retry_deplay": "0",
        "convertXmlResponseToJson": true
      }
    }
  },
  {
    "id": "LLMNode_434",
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
            "role": "user",
            "content": "@prompts/collect-sources_llmnode-434_user_0.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Collect sources gemini search",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/collect-sources_llmnode-434_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_560",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/collect-sources_code-node-560_code.ts",
        "nodeName": "Merge Sources"
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
        "outputMapping": "{\n  \"geminiResponse\": \"{{codeNode_560.output.geminiResponse}}\",\n  \"otherSources\": \"{{codeNode_560.output.otherSources}}\",\n  \"collectedAt\": \"{{codeNode_560.output.collectedAt}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-branchNode_535",
    "source": "triggerNode_1",
    "target": "branchNode_535",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "branchNode_535-apiNode_948",
    "source": "branchNode_535",
    "target": "apiNode_948",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "branchNode_535-codeNode_351",
    "source": "branchNode_535",
    "target": "codeNode_351",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "branchNode_535-codeNode_565",
    "source": "branchNode_535",
    "target": "codeNode_565",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "branchNode_535-LLMNode_434",
    "source": "branchNode_535",
    "target": "LLMNode_434",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "codeNode_351-codeNode_560",
    "source": "codeNode_351",
    "target": "codeNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_565-codeNode_560",
    "source": "codeNode_565",
    "target": "codeNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_434-codeNode_560",
    "source": "LLMNode_434",
    "target": "codeNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_948-codeNode_560",
    "source": "apiNode_948",
    "target": "codeNode_560",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_948-responseNode_triggerNode_1",
    "source": "apiNode_948",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_565-responseNode_triggerNode_1",
    "source": "codeNode_565",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_434-responseNode_triggerNode_1",
    "source": "LLMNode_434",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_560-responseNode_triggerNode_1",
    "source": "codeNode_560",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
