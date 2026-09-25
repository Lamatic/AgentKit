// Flow: curate-pick

// -- Meta --
export const meta = {
  "name": "curate-pick",
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
  "LLMNode_532": [
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
    "curate_pick_llmnode_532_system_0": "@prompts/curate-pick_llmnode-532_system_0.md",
    "curate_pick_llmnode_532_user_1": "@prompts/curate-pick_llmnode-532_user_1.md"
  },
  "modelConfigs": {
    "curate_pick_llmnode_532_generative_model_name": "@model-configs/curate-pick_llmnode-532_generative-model-name.ts"
  },
  "scripts": {
    "curate_pick_code_node_243_code": "@scripts/curate-pick_code-node-243_code.ts",
    "curate_pick_code_node_754_code": "@scripts/curate-pick_code-node-754_code.ts",
    "curate_pick_code_node_842_code": "@scripts/curate-pick_code-node-842_code.ts"
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
        "advance_schema": "{\n  \"geminiResponse\": \"string\",\n  \"otherSources\": \"string\",\n  \"collectedAt\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_243",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/curate-pick_code-node-243_code.ts",
        "nodeName": "Format Sources For Ranking"
      }
    }
  },
  {
    "id": "tablesNode_332",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_332",
        "data": "{}",
        "limit": "15",
        "query": "SELECT * FROM your_table WHERE id = ?",
        "where": {
          "conditions": [
            {
              "value": "now() - 5d",
              "column": "publishedAt",
              "operator": ">="
            },
            {
              "value": "skipped",
              "column": "status",
              "operator": "!="
            }
          ],
          "conjunction": "AND"
        },
        "action": "select",
        "offset": "0",
        "columns": "*",
        "orderBy": "",
        "nodeName": "Fetch Recent Picks",
        "tableName": "digest_history"
      }
    }
  },
  {
    "id": "codeNode_754",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/curate-pick_code-node-754_code.ts",
        "nodeName": "Format Recent History"
      }
    }
  },
  {
    "id": "LLMNode_532",
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
            "content": "@prompts/curate-pick_llmnode-532_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/curate-pick_llmnode-532_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Rank, Corroborate, And Dedup",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/curate-pick_llmnode-532_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_842",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/curate-pick_code-node-842_code.ts",
        "nodeName": "Parse Rank Output"
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
        "outputMapping": "{\n  \"topPick\": \"{{codeNode_842.output.topPick}}\",\n  \"runnerUp\": \"{{codeNode_842.output.runnerUp}}\",\n  \"rankedList\": \"{{codeNode_842.output.rankedList}}\",\n  \"finalRecommendation\": \"{{codeNode_842.output.finalRecommendation}}\",\n  \"skipReason\": \"{{codeNode_842.output.skipReason}}\",\n  \"digestId\": \"{{codeNode_842.output.digestId}}\",\n  \"collectedAt\": \"{{triggerNode_1.output.collectedAt}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_243",
    "source": "triggerNode_1",
    "target": "codeNode_243",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_243-tablesNode_332",
    "source": "codeNode_243",
    "target": "tablesNode_332",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "tablesNode_332-codeNode_754",
    "source": "tablesNode_332",
    "target": "codeNode_754",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_754-LLMNode_532",
    "source": "codeNode_754",
    "target": "LLMNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_532-codeNode_842",
    "source": "LLMNode_532",
    "target": "codeNode_842",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_842-responseNode_triggerNode_1-142",
    "source": "codeNode_842",
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
