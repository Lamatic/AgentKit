// Flow: analyze-journal

// -- Meta --
export const meta = {
  "name": "analyze-journal",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "VAIBHAV YADAV",
    "email": "vaibhavyadav.977@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_301": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_629": [
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
    "analyze_journal_llmnode_301_system_0": "@prompts/analyze-journal_llmnode-301_system_0.md",
    "analyze_journal_llmnode_301_user_1": "@prompts/analyze-journal_llmnode-301_user_1.md",
    "analyze_journal_llmnode_629_system_0": "@prompts/analyze-journal_llmnode-629_system_0.md",
    "analyze_journal_llmnode_629_user_1": "@prompts/analyze-journal_llmnode-629_user_1.md"
  },
  "modelConfigs": {
    "analyze_journal_llmnode_301_generative_model_name": "@model-configs/analyze-journal_llmnode-301_generative-model-name.ts",
    "analyze_journal_llmnode_629_generative_model_name": "@model-configs/analyze-journal_llmnode-629_generative-model-name.ts"
  },
  "scripts": {
    "analyze_journal_code_node_439_code": "@scripts/analyze-journal_code-node-439_code.ts"
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
        "advance_schema": "{\n  \"trades\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_439",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/analyze-journal_code-node-439_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_301",
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
            "content": "@prompts/analyze-journal_llmnode-301_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/analyze-journal_llmnode-301_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/analyze-journal_llmnode-301_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_629",
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
            "content": "@prompts/analyze-journal_llmnode-629_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/analyze-journal_llmnode-629_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Coach",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/analyze-journal_llmnode-629_generative-model-name.ts"
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
        "outputMapping": "{}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_439",
    "source": "triggerNode_1",
    "target": "codeNode_439",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_439-LLMNode_301",
    "source": "codeNode_439",
    "target": "LLMNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_301-LLMNode_629",
    "source": "LLMNode_301",
    "target": "LLMNode_629",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_629-responseNode_triggerNode_1",
    "source": "LLMNode_629",
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
