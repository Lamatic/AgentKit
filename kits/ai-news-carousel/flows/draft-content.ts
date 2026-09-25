// Flow: draft-content

// -- Meta --
export const meta = {
  "name": "draft-content",
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
  "LLMNode_644": [
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
    "draft_content_llmnode_644_system_0": "@prompts/draft-content_llmnode-644_system_0.md",
    "draft_content_llmnode_644_user_1": "@prompts/draft-content_llmnode-644_user_1.md"
  },
  "modelConfigs": {
    "draft_content_llmnode_644_generative_model_name": "@model-configs/draft-content_llmnode-644_generative-model-name.ts"
  },
  "scripts": {
    "draft_content_code_node_327_code": "@scripts/draft-content_code-node-327_code.ts"
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
        "advance_schema": "{\n  \"topPick\": \"string\",\n  \"runnerUp\": \"string\",\n  \"rankedList\": \"string\",\n  \"finalRecommendation\": \"string\",\n  \"digestId\": \"string\",\n  \"skipReason\": \"string\",\n  \"collectedAt\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_644",
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
            "content": "@prompts/draft-content_llmnode-644_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/draft-content_llmnode-644_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/draft-content_llmnode-644_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_327",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/draft-content_code-node-327_code.ts",
        "nodeName": "Parse Response"
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
        "outputMapping": "{\n  \"slides\": \"{{codeNode_327.output.slides}}\",\n  \"caption\": \"{{codeNode_327.output.caption}}\",\n  \"hashtags\": \"{{codeNode_327.output.hashtags}}\",\n  \"finalRecommendation\": \"{{triggerNode_1.output.finalRecommendation}}\",\n  \"digestId\": \"{{triggerNode_1.output.digestId}}\",\n  \"collectedAt\": \"{{triggerNode_1.output.collectedAt}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_644",
    "source": "triggerNode_1",
    "target": "LLMNode_644",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_644-codeNode_327",
    "source": "LLMNode_644",
    "target": "codeNode_327",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_327-responseNode_triggerNode_1",
    "source": "codeNode_327",
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
