// Flow: insurance-jargon-translator

// -- Meta --
export const meta = {
  "name": "insurance-jargon-translator",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Saktheeswari P",
    "email": "p.sakthee@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_601": [
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
    "insurance_jargon_translator_llmnode_601_system_0": "@prompts/insurance-jargon-translator_llmnode-601_system_0.md",
    "insurance_jargon_translator_llmnode_601_user_1": "@prompts/insurance-jargon-translator_llmnode-601_user_1.md"
  },
  "modelConfigs": {
    "insurance_jargon_translator_llmnode_601_generative_model_name": "@model-configs/insurance-jargon-translator_llmnode-601_generative-model-name.ts"
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
        "advance_schema": "{\n  \"policy_clause\": \"string\"\n}",
        "responeType": "realtime",
        "id": "triggerNode_1"
      }
    }
  },
  {
    "id": "LLMNode_601",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "content": "@prompts/insurance-jargon-translator_llmnode-601_system_0.md",
            "role": "system"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "content": "@prompts/insurance-jargon-translator_llmnode-601_user_1.md",
            "role": "user"
          }
        ],
        "tools": [],
        "credentials": "",
        "messages": "[]",
        "memories": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/insurance-jargon-translator_llmnode-601_generative-model-name.ts"
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
        "nodeName": "API Response",
        "outputMapping": "{}",
        "webhookUrl": "",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "retry_delay": "0"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_601",
    "source": "triggerNode_1",
    "target": "LLMNode_601",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_601-responseNode_triggerNode_1",
    "source": "LLMNode_601",
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
