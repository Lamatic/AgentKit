// Flow: visual-planner

// -- Meta --
export const meta = {
  "name": "visual-planner",
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
  "LLMNode_386": [
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
    "visual_planner_llmnode_386_system_0": "@prompts/visual-planner_llmnode-386_system_0.md",
    "visual_planner_llmnode_386_user_1": "@prompts/visual-planner_llmnode-386_user_1.md"
  },
  "modelConfigs": {
    "visual_planner_llmnode_386_generative_model_name": "@model-configs/visual-planner_llmnode-386_generative-model-name.ts"
  },
  "scripts": {
    "visual_planner_code_node_215_code": "@scripts/visual-planner_code-node-215_code.ts",
    "visual_planner_code_node_112_code": "@scripts/visual-planner_code-node-112_code.ts"
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
        "advance_schema": "{\n  \"topPick\": \"string\",\n  \"runnerUp\": \"string\",\n  \"rankedList\": \"string\",\n  \"finalRecommendation\": \"string\",\n  \"digestId\": \"string\",\n  \"collectedAt\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_386",
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
            "content": "@prompts/visual-planner_llmnode-386_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/visual-planner_llmnode-386_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "visual-planner",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/visual-planner_llmnode-386_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_215",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/visual-planner_code-node-215_code.ts",
        "nodeName": "Parse Visual Plan"
      }
    }
  },
  {
    "id": "codeNode_112",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/visual-planner_code-node-112_code.ts",
        "nodeName": "Fetch Images"
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
        "outputMapping": "{\n  \"digestId\": \"{{triggerNode_1.output.digestId}}\",\n  \"slides\": \"{{codeNode_112.output.slides}}\",\n  \"collectedAt\": \"{{triggerNode_1.output.collectedAt}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_386",
    "source": "triggerNode_1",
    "target": "LLMNode_386",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_386-codeNode_215",
    "source": "LLMNode_386",
    "target": "codeNode_215",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_215-codeNode_112",
    "source": "codeNode_215",
    "target": "codeNode_112",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_112-responseNode_triggerNode_1",
    "source": "codeNode_112",
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
