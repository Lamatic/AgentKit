// Flow: pii-sovereign-guardrail

// -- Meta --
export const meta = {
  "name": "pii-sovereign-guardrail",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Keerthana Sasidaran",
    "email": "keerthana08sasidaran@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_588": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_925": [
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
    "pii_sovereign_guardrail_llmnode_588_system_0": "@prompts/pii-sovereign-guardrail_llmnode-588_system_0.md",
    "pii_sovereign_guardrail_llmnode_588_user_1": "@prompts/pii-sovereign-guardrail_llmnode-588_user_1.md",
    "pii_sovereign_guardrail_llmnode_925_system_0": "@prompts/pii-sovereign-guardrail_llmnode-925_system_0.md",
    "pii_sovereign_guardrail_llmnode_925_user_1": "@prompts/pii-sovereign-guardrail_llmnode-925_user_1.md"
  },
  "modelConfigs": {
    "pii_sovereign_guardrail_llmnode_588_generative_model_name": "@model-configs/pii-sovereign-guardrail_llmnode-588_generative-model-name.ts",
    "pii_sovereign_guardrail_llmnode_925_generative_model_name": "@model-configs/pii-sovereign-guardrail_llmnode-925_generative-model-name.ts"
  },
  "scripts": {
    "pii_sovereign_guardrail_code_node_163_code": "@scripts/pii-sovereign-guardrail_code-node-163_code.ts",
    "pii_sovereign_guardrail_code_node_591_code": "@scripts/pii-sovereign-guardrail_code-node-591_code.ts",
    "pii_sovereign_guardrail_code_node_527_code": "@scripts/pii-sovereign-guardrail_code-node-527_code.ts"
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
        "advance_schema": "{\n  \"rawUserPrompt\": \"string\",\n  \"targetModel\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_163",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/pii-sovereign-guardrail_code-node-163_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_588",
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
            "content": "@prompts/pii-sovereign-guardrail_llmnode-588_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/pii-sovereign-guardrail_llmnode-588_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/pii-sovereign-guardrail_llmnode-588_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_591",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/pii-sovereign-guardrail_code-node-591_code.ts",
        "nodeName": "merge-layers"
      }
    }
  },
  {
    "id": "LLMNode_925",
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
            "content": "@prompts/pii-sovereign-guardrail_llmnode-925_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/pii-sovereign-guardrail_llmnode-925_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "target-model-call",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/pii-sovereign-guardrail_llmnode-925_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_527",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/pii-sovereign-guardrail_code-node-527_code.ts",
        "nodeName": "rehydrate"
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
        "outputMapping": "{\n  \"secureResponse\": \"{{codeNode_527.output.secureResponse}}\",\n  \"maskedPromptSent\": \"{{codeNode_527.output.maskedPromptSent}}\",\n  \"tokensRedacted\": {\n    \"deterministic\": \"{{codeNode_163.output.deterministicCount}}\",\n    \"probabilistic\": \"{{codeNode_591.output.probabilisticCount}}\",\n    \"total\": \"{{codeNode_591.output.totalRedacted}}\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_163",
    "source": "triggerNode_1",
    "target": "codeNode_163",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_163-LLMNode_588",
    "source": "codeNode_163",
    "target": "LLMNode_588",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_163-codeNode_591",
    "source": "codeNode_163",
    "target": "codeNode_591",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_588-codeNode_591",
    "source": "LLMNode_588",
    "target": "codeNode_591",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_591-LLMNode_925",
    "source": "codeNode_591",
    "target": "LLMNode_925",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_925-codeNode_527",
    "source": "LLMNode_925",
    "target": "codeNode_527",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_591-codeNode_527",
    "source": "codeNode_591",
    "target": "codeNode_527",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_527-responseNode_triggerNode_1",
    "source": "codeNode_527",
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
