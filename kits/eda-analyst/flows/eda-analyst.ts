// Flow: eda-analyst

// -- Meta --
export const meta = {
  "name": "EDA Analyst",
  "description": "Autonomous EDA agent: profile a CSV, clean it (impute/drop/dedupe) behind a validation gate, plan and run analyses with a conditional re-plan, and render a self-contained interactive dashboard. Code computes every number; the LLM only decides.",
  "tags": ["agentic", "data-analysis", "eda", "dashboard", "visualization"],
  "testInput": {
    "fileUrl": "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Rishabh Rajput",
    "email": "rishabhrajput081@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_400": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_740": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_832": [
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
    "eda_analyst_instructor_llmnode_400_system_0": "@prompts/eda-analyst_instructor-llmnode-400_system_0.md",
    "eda_analyst_instructor_llmnode_400_user_1": "@prompts/eda-analyst_instructor-llmnode-400_user_1.md",
    "eda_analyst_instructor_llmnode_740_system_0": "@prompts/eda-analyst_instructor-llmnode-740_system_0.md",
    "eda_analyst_instructor_llmnode_740_user_1": "@prompts/eda-analyst_instructor-llmnode-740_user_1.md",
    "eda_analyst_instructor_llmnode_832_system_0": "@prompts/eda-analyst_instructor-llmnode-832_system_0.md",
    "eda_analyst_instructor_llmnode_832_user_1": "@prompts/eda-analyst_instructor-llmnode-832_user_1.md"
  },
  "modelConfigs": {
    "eda_analyst_instructor_llmnode_400_generative_model_name": "@model-configs/eda-analyst_instructor-llmnode-400_generative-model-name.ts",
    "eda_analyst_instructor_llmnode_740_generative_model_name": "@model-configs/eda-analyst_instructor-llmnode-740_generative-model-name.ts",
    "eda_analyst_instructor_llmnode_832_generative_model_name": "@model-configs/eda-analyst_instructor-llmnode-832_generative-model-name.ts"
  },
  "scripts": {
    "eda_analyst_code_node_579_code": "@scripts/eda-analyst_code-node-579_code.ts",
    "eda_analyst_code_node_941_code": "@scripts/eda-analyst_code-node-941_code.ts",
    "eda_analyst_code_node_773_code": "@scripts/eda-analyst_code-node-773_code.ts",
    "eda_analyst_code_node_629_code": "@scripts/eda-analyst_code-node-629_code.ts",
    "eda_analyst_code_node_781_code": "@scripts/eda-analyst_code-node-781_code.ts",
    "eda_analyst_code_node_458_code": "@scripts/eda-analyst_code-node-458_code.ts",
    "eda_analyst_code_node_459_code": "@scripts/eda-analyst_code-node-459_code.ts",
    "eda_analyst_code_node_443_code": "@scripts/eda-analyst_code-node-443_code.ts",
    "eda_analyst_code_node_159_code": "@scripts/eda-analyst_code-node-159_code.ts",
    "eda_analyst_code_node_706_code": "@scripts/eda-analyst_code-node-706_code.ts",
    "eda_analyst_code_node_396_code": "@scripts/eda-analyst_code-node-396_code.ts"
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
        "advance_schema": "{\n  \"fileUrl\": \"string\"\n}"
      }
    }
  },
  {
    "id": "extractFromFileNode_202",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "id": "extractFromFileNode_202",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "csv",
        "comment": "",
        "fileUrl": "{{triggerNode_1.output.fileUrl}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "nodeName": "Extract from File",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": false,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    }
  },
  {
    "id": "codeNode_579",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-579_code.ts",
        "nodeName": "parse_rows"
      }
    }
  },
  {
    "id": "codeNode_941",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-941_code.ts",
        "nodeName": "Profile"
      }
    }
  },
  {
    "id": "codeNode_773",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-773_code.ts",
        "nodeName": "Chunker"
      }
    }
  },
  {
    "id": "batchNode_486",
    "type": "batchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "batchNode",
      "values": {
        "id": "batchNode_486",
        "endValue": 10,
        "nodeName": "Batch",
        "increment": 1,
        "connectedTo": "batchEndNode_630",
        "iterateOver": "list",
        "initialValue": 0,
        "iteratorValue": "{{codeNode_773.output.chunks}}",
        "concurrencyLimit": 10
      }
    }
  },
  {
    "id": "InstructorLLMNode_400",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"columns\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"column\": {\n            \"type\": \"string\"\n          },\n          \"action\": {\n            \"type\": \"string\"\n          },\n          \"impute\": {\n            \"type\": \"string\"\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/eda-analyst_instructor-llmnode-400_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/eda-analyst_instructor-llmnode-400_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "CleanPlanner",
        "attachments": "",
        "generativeModelName": "@model-configs/eda-analyst_instructor-llmnode-400_generative-model-name.ts"
      }
    }
  },
  {
    "id": "batchEndNode_630",
    "type": "batchEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "batchEndNode",
      "values": {
        "nodeName": "Batch End",
        "connectedTo": "batchNode_486"
      }
    }
  },
  {
    "id": "codeNode_629",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-629_code.ts",
        "nodeName": "Merge"
      }
    }
  },
  {
    "id": "codeNode_781",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-781_code.ts",
        "nodeName": "ApplyCleaning"
      }
    }
  },
  {
    "id": "codeNode_458",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-458_code.ts",
        "nodeName": "ValidationGate"
      }
    }
  },
  {
    "id": "InstructorLLMNode_740",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"tasks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"column\": {\n            \"type\": \"string\"\n          },\n          \"groupBy\": {\n            \"type\": \"string\"\n          },\n          \"measure\": {\n            \"type\": \"string\"\n          },\n          \"agg\": {\n            \"type\": \"string\"\n          },\n          \"x\": {\n            \"type\": \"string\"\n          },\n          \"y\": {\n            \"type\": \"string\"\n          },\n          \"action\": {\n            \"type\": \"string\"\n          },\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/eda-analyst_instructor-llmnode-740_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/eda-analyst_instructor-llmnode-740_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "InsightPlanner",
        "attachments": "",
        "generativeModelName": "@model-configs/eda-analyst_instructor-llmnode-740_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_459",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-459_code.ts",
        "nodeName": "InsightValidation"
      }
    }
  },
  {
    "id": "batchNode_695",
    "type": "batchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "batchNode",
      "values": {
        "id": "batchNode_695",
        "endValue": 10,
        "nodeName": "Re-Planner",
        "increment": 1,
        "connectedTo": "batchEndNode_210",
        "iterateOver": "list",
        "initialValue": 0,
        "iteratorValue": "{{codeNode_459.output.replanPayload}}",
        "concurrencyLimit": 10
      }
    }
  },
  {
    "id": "InstructorLLMNode_832",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"tasks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"method\": {\n            \"type\": \"string\"\n          },\n          \"column\": {\n            \"type\": \"string\"\n          },\n          \"groupBy\": {\n            \"type\": \"string\"\n          },\n          \"measure\": {\n            \"type\": \"string\"\n          },\n          \"agg\": {\n            \"type\": \"string\"\n          },\n          \"x\": {\n            \"type\": \"string\"\n          },\n          \"y\": {\n            \"type\": \"string\"\n          },\n          \"action\": {\n            \"type\": \"string\"\n          },\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/eda-analyst_instructor-llmnode-832_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/eda-analyst_instructor-llmnode-832_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/eda-analyst_instructor-llmnode-832_generative-model-name.ts"
      }
    }
  },
  {
    "id": "batchEndNode_210",
    "type": "batchEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "batchEndNode",
      "values": {
        "nodeName": "Re-Planner End",
        "connectedTo": "batchNode_695"
      }
    }
  },
  {
    "id": "codeNode_443",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-443_code.ts",
        "nodeName": "MergeInsights"
      }
    }
  },
  {
    "id": "codeNode_159",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-159_code.ts",
        "nodeName": "Executor"
      }
    }
  },
  {
    "id": "codeNode_706",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-706_code.ts",
        "nodeName": "FindingsGate"
      }
    }
  },
  {
    "id": "codeNode_396",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/eda-analyst_code-node-396_code.ts",
        "nodeName": "Renderer"
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
        "outputMapping": "{\n  \"dashboardHtml\": \"{{codeNode_396.output.dashboardHtml}}\",\n  \"chartCount\": \"{{codeNode_396.output.chartCount}}\",\n  \"validated\": \"{{codeNode_458.output.validation.passed}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_202",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_202",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_202-codeNode_579",
    "source": "extractFromFileNode_202",
    "target": "codeNode_579",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_579-codeNode_941",
    "source": "codeNode_579",
    "target": "codeNode_941",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_941-codeNode_773",
    "source": "codeNode_941",
    "target": "codeNode_773",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_773-batchNode_486-478",
    "source": "codeNode_773",
    "target": "batchNode_486",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "batchNode_486-InstructorLLMNode_400-167",
    "source": "batchNode_486",
    "target": "InstructorLLMNode_400",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_400-batchEndNode_630-661",
    "source": "InstructorLLMNode_400",
    "target": "batchEndNode_630",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "batchEndNode_630-codeNode_629",
    "source": "batchEndNode_630",
    "target": "codeNode_629",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_629-codeNode_781",
    "source": "codeNode_629",
    "target": "codeNode_781",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_781-codeNode_458",
    "source": "codeNode_781",
    "target": "codeNode_458",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_458-InstructorLLMNode_740",
    "source": "codeNode_458",
    "target": "InstructorLLMNode_740",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_396-responseNode_triggerNode_1",
    "source": "codeNode_396",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_740-codeNode_459",
    "source": "InstructorLLMNode_740",
    "target": "codeNode_459",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_459-batchNode_695-789",
    "source": "codeNode_459",
    "target": "batchNode_695",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "batchNode_695-InstructorLLMNode_832-243",
    "source": "batchNode_695",
    "target": "InstructorLLMNode_832",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_832-batchEndNode_210-754",
    "source": "InstructorLLMNode_832",
    "target": "batchEndNode_210",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "batchEndNode_210-codeNode_443",
    "source": "batchEndNode_210",
    "target": "codeNode_443",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_443-codeNode_159",
    "source": "codeNode_443",
    "target": "codeNode_159",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_159-codeNode_706",
    "source": "codeNode_159",
    "target": "codeNode_706",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_706-codeNode_396",
    "source": "codeNode_706",
    "target": "codeNode_396",
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
  },
  {
    "id": "batchNode_486-batchEndNode_630-104",
    "source": "batchNode_486",
    "target": "batchEndNode_630",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "batchEndNode_630-batchNode_486-483",
    "source": "batchEndNode_630",
    "target": "batchNode_486",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "batchNode_695-batchEndNode_210-160",
    "source": "batchNode_695",
    "target": "batchEndNode_210",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "batchEndNode_210-batchNode_695-332",
    "source": "batchEndNode_210",
    "target": "batchNode_695",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
