// Flow: agentkit-challenge

// -- Meta --
export const meta = {
  "name": "Agentkit-challenge",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Vaidik Dave",
    "email": "davevaidik20@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_330": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "vectorizeNode_123": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_260": [
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
    "agentkit_challenge_instructor_llmnode_330_system_0": "@prompts/agentkit-challenge_instructor-llmnode-330_system_0.md",
    "agentkit_challenge_instructor_llmnode_330_user_1": "@prompts/agentkit-challenge_instructor-llmnode-330_user_1.md",
    "agentkit_challenge_instructor_llmnode_260_system_0": "@prompts/agentkit-challenge_instructor-llmnode-260_system_0.md",
    "agentkit_challenge_instructor_llmnode_260_user_1": "@prompts/agentkit-challenge_instructor-llmnode-260_user_1.md"
  },
  "modelConfigs": {
    "agentkit_challenge_instructor_llmnode_330_generative_model_name": "@model-configs/agentkit-challenge_instructor-llmnode-330_generative-model-name.ts",
    "agentkit_challenge_vectorize_node_123_embedding_model_name": "@model-configs/agentkit-challenge_vectorize-node-123_embedding-model-name.ts",
    "agentkit_challenge_instructor_llmnode_260_generative_model_name": "@model-configs/agentkit-challenge_instructor-llmnode-260_generative-model-name.ts"
  },
  "scripts": {
    "agentkit_challenge_code_node_805_code": "@scripts/agentkit-challenge_code-node-805_code.ts",
    "agentkit_challenge_code_node_789_code": "@scripts/agentkit-challenge_code-node-789_code.ts",
    "agentkit_challenge_code_node_832_code": "@scripts/agentkit-challenge_code-node-832_code.ts",
    "agentkit_challenge_code_node_676_code": "@scripts/agentkit-challenge_code-node-676_code.ts",
    "agentkit_challenge_code_node_978_code": "@scripts/agentkit-challenge_code-node-978_code.ts",
    "agentkit_challenge_code_node_575_code": "@scripts/agentkit-challenge_code-node-575_code.ts",
    "agentkit_challenge_code_node_476_code": "@scripts/agentkit-challenge_code-node-476_code.ts"
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
        "advance_schema": "{\n  \"logs\": [\n    {\n      \"id\": \"string\",\n      \"prompt\": \"string\",\n      \"context\": \"string\",\n      \"response\": \"string\",\n      \"expected_schema\": {}\n    }\n  ]\n}"
      }
    }
  },
  {
    "id": "forLoopNode_584",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "id": "forLoopNode_584",
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_195",
        "iterateOver": "list",
        "iteratorValue": "{{triggerNode_1.output.logs}}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_330",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"is_grounded\": {\n      \"type\": \"boolean\"\n    },\n    \"ungrounded_claims\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"reason\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agentkit-challenge_instructor-llmnode-330_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentkit-challenge_instructor-llmnode-330_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/agentkit-challenge_instructor-llmnode-330_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_805",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-805_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "forLoopEndNode_195",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_584"
      }
    }
  },
  {
    "id": "codeNode_789",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-789_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "conditionNode_234",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_234-addNode_633",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_789.output.flagged_count}}\",\n      \"operator\": \"<=\",\n      \"value\": \"1\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_234-addNode_753",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "forLoopNode_824",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "id": "forLoopNode_824",
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_781",
        "iterateOver": "list",
        "iteratorValue": "{{codeNode_789.output.flagged_logs}}"
      }
    }
  },
  {
    "id": "codeNode_832",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-832_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_123",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_123",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_832.output.texts}}",
        "embeddingModelName": "@model-configs/agentkit-challenge_vectorize-node-123_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "forLoopEndNode_781",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_824"
      }
    }
  },
  {
    "id": "codeNode_676",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-676_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "forLoopNode_344",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "values": {
        "id": "forLoopNode_344",
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_282",
        "iterateOver": "list",
        "iteratorValue": "{{codeNode_676.output.clusters}}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_260",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"name\": {\n      \"type\": \"string\"\n    },\n    \"description\": {\n      \"type\": \"string\"\n    },\n    \"suggested_direction\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agentkit-challenge_instructor-llmnode-260_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentkit-challenge_instructor-llmnode-260_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/agentkit-challenge_instructor-llmnode-260_generative-model-name.ts"
      }
    }
  },
  {
    "id": "forLoopEndNode_282",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_344"
      }
    }
  },
  {
    "id": "codeNode_978",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-978_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "codeNode_575",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-575_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "codeNode_476",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentkit-challenge_code-node-476_code.ts",
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
        "outputMapping": "{\n  \"result\": \"{{codeNode_476.output.result}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-forLoopNode_584-177",
    "source": "triggerNode_1",
    "target": "forLoopNode_584",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopNode_584-InstructorLLMNode_330-706",
    "source": "forLoopNode_584",
    "target": "InstructorLLMNode_330",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_330-codeNode_805",
    "source": "InstructorLLMNode_330",
    "target": "codeNode_805",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_805-forLoopEndNode_195",
    "source": "codeNode_805",
    "target": "forLoopEndNode_195",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_195-codeNode_789",
    "source": "forLoopEndNode_195",
    "target": "codeNode_789",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_789-conditionNode_234",
    "source": "codeNode_789",
    "target": "conditionNode_234",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_234-codeNode_575-930",
    "source": "conditionNode_234",
    "target": "codeNode_575",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_234-forLoopNode_824-475",
    "source": "conditionNode_234",
    "target": "forLoopNode_824",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "vectorizeNode_123-forLoopEndNode_781-170",
    "source": "vectorizeNode_123",
    "target": "forLoopEndNode_781",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_781-codeNode_676",
    "source": "forLoopEndNode_781",
    "target": "codeNode_676",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_676-forLoopNode_344-961",
    "source": "codeNode_676",
    "target": "forLoopNode_344",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopNode_344-InstructorLLMNode_260-524",
    "source": "forLoopNode_344",
    "target": "InstructorLLMNode_260",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_260-forLoopEndNode_282-128",
    "source": "InstructorLLMNode_260",
    "target": "forLoopEndNode_282",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_282-codeNode_978",
    "source": "forLoopEndNode_282",
    "target": "codeNode_978",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopNode_824-codeNode_832",
    "source": "forLoopNode_824",
    "target": "codeNode_832",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_832-vectorizeNode_123",
    "source": "codeNode_832",
    "target": "vectorizeNode_123",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_978-codeNode_476-728",
    "source": "codeNode_978",
    "target": "codeNode_476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_575-codeNode_476-113",
    "source": "codeNode_575",
    "target": "codeNode_476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_476-responseNode_triggerNode_1-956",
    "source": "codeNode_476",
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
  },
  {
    "id": "forLoopNode_584-forLoopEndNode_195-432",
    "source": "forLoopNode_584",
    "target": "forLoopEndNode_195",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopEndNode_195-forLoopNode_584-960",
    "source": "forLoopEndNode_195",
    "target": "forLoopNode_584",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopNode_824-forLoopEndNode_781-643",
    "source": "forLoopNode_824",
    "target": "forLoopEndNode_781",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopEndNode_781-forLoopNode_824-588",
    "source": "forLoopEndNode_781",
    "target": "forLoopNode_824",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopNode_344-forLoopEndNode_282-899",
    "source": "forLoopNode_344",
    "target": "forLoopEndNode_282",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "forLoopEndNode_282-forLoopNode_344-572",
    "source": "forLoopEndNode_282",
    "target": "forLoopNode_344",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
