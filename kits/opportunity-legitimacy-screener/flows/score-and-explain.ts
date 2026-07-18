// Flow: score-and-explain

// -- Meta --
export const meta = {
  "name": "score-and-explain",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Muhammad Hamza Nawaz",
    "email": "muhammadhamzanawaz89@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_645": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_419": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_353": [
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
    "score_and_explain_llmnode_645_system_0": "@prompts/score-and-explain_llmnode-645_system_0.md",
    "score_and_explain_llmnode_645_user_1": "@prompts/score-and-explain_llmnode-645_user_1.md",
    "score_and_explain_llmnode_419_system_0": "@prompts/score-and-explain_llmnode-419_system_0.md",
    "score_and_explain_llmnode_419_user_1": "@prompts/score-and-explain_llmnode-419_user_1.md",
    "score_and_explain_llmnode_353_system_0": "@prompts/score-and-explain_llmnode-353_system_0.md",
    "score_and_explain_llmnode_353_user_1": "@prompts/score-and-explain_llmnode-353_user_1.md"
  },
  "modelConfigs": {
    "score_and_explain_llmnode_645_generative_model_name": "@model-configs/score-and-explain_llmnode-645_generative-model-name.ts",
    "score_and_explain_llmnode_419_generative_model_name": "@model-configs/score-and-explain_llmnode-419_generative-model-name.ts",
    "score_and_explain_llmnode_353_generative_model_name": "@model-configs/score-and-explain_llmnode-353_generative-model-name.ts"
  },
  "scripts": {
    "score_and_explain_code_node_396_code": "@scripts/score-and-explain_code-node-396_code.ts",
    "score_and_explain_code_node_905_code": "@scripts/score-and-explain_code-node-905_code.ts",
    "score_and_explain_code_node_529_code": "@scripts/score-and-explain_code-node-529_code.ts"
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
        "advance_schema": "{\n  \"company_name\": \"string\",\n  \"claimed_domain\": \"string\",\n  \"sender_email\": \"string\",\n  \"stated_compensation\": \"string\",\n  \"role_title\": \"string\",\n  \"contact_method\": \"string\",\n  \"search_results\": \"string\"\n}"
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
        "code": "@scripts/score-and-explain_code-node-396_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "conditionNode_429",
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
            "value": "conditionNode_429-addNode_798",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_396.output.risk_tier}}\",\n      \"operator\": \"==\",\n      \"value\": \"low\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_429-addNode_751",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_429-plus-node-addNode_217791-568",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_396.output.risk_tier}}\",\n      \"operator\": \"==\",\n      \"value\": \"medium\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 3",
            "value": "conditionNode_429-plus-node-addNode_136603-199",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_396.output.risk_tier}}\",\n      \"operator\": \"==\",\n      \"value\": \"high\"\n    }\n  ]\n}"
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_905",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/score-and-explain_code-node-905_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_645",
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
            "content": "@prompts/score-and-explain_llmnode-645_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/score-and-explain_llmnode-645_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/score-and-explain_llmnode-645_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_419",
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
            "content": "@prompts/score-and-explain_llmnode-419_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/score-and-explain_llmnode-419_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/score-and-explain_llmnode-419_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_353",
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
            "content": "@prompts/score-and-explain_llmnode-353_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/score-and-explain_llmnode-353_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/score-and-explain_llmnode-353_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_529",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/score-and-explain_code-node-529_code.ts",
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"risk_tier\": \"{{codeNode_529.output.risk_tier}}\",\n  \"explanation\": \"{{codeNode_529.output.explanation}}\",\n  \"recommended_action\": \"{{codeNode_529.output.recommended_action}}\"\n}",
        "id": "responseNode_triggerNode_1"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_396",
    "source": "triggerNode_1",
    "target": "codeNode_396",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_396-conditionNode_429",
    "source": "codeNode_396",
    "target": "conditionNode_429",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_429-LLMNode_645-987",
    "source": "conditionNode_429",
    "target": "LLMNode_645",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_429-LLMNode_419-810",
    "source": "conditionNode_429",
    "target": "LLMNode_419",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_429-LLMNode_353-452",
    "source": "conditionNode_429",
    "target": "LLMNode_353",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_429-codeNode_905-233",
    "source": "conditionNode_429",
    "target": "codeNode_905",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_645-codeNode_529-831",
    "source": "LLMNode_645",
    "target": "codeNode_529",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_419-codeNode_529-139",
    "source": "LLMNode_419",
    "target": "codeNode_529",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_353-codeNode_529-675",
    "source": "LLMNode_353",
    "target": "codeNode_529",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_905-codeNode_529-751",
    "source": "codeNode_905",
    "target": "codeNode_529",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_529-responseNode_triggerNode_1-438",
    "source": "codeNode_529",
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
