// Flow: docsense-intake

// -- Meta --
export const meta = {
  "name": "docsense-intake",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Mehwish Afsa",
    "email": "mehwishafsa44@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_599": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_421": [
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
    "docsense_intake_llmnode_599_system_0": "@prompts/docsense-intake_llmnode-599_system_0.md",
    "docsense_intake_llmnode_599_user_1": "@prompts/docsense-intake_llmnode-599_user_1.md",
    "docsense_intake_llmnode_421_system_0": "@prompts/docsense-intake_llmnode-421_system_0.md",
    "docsense_intake_llmnode_421_user_1": "@prompts/docsense-intake_llmnode-421_user_1.md"
  },
  "modelConfigs": {
    "docsense_intake_llmnode_599_generative_model_name": "@model-configs/docsense-intake_llmnode-599_generative-model-name.ts",
    "docsense_intake_llmnode_421_generative_model_name": "@model-configs/docsense-intake_llmnode-421_generative-model-name.ts"
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
        "advance_schema": "{\"document\":\"string\"}"
      }
    }
  },
  {
    "id": "LLMNode_599",
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
            "content": "@prompts/docsense-intake_llmnode-599_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/docsense-intake_llmnode-599_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "extraction.",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/docsense-intake_llmnode-599_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_421",
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
            "content": "@prompts/docsense-intake_llmnode-421_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/docsense-intake_llmnode-421_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "reasoning",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/docsense-intake_llmnode-421_generative-model-name.ts"
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
        "outputMapping": "{\"result\":\"{{LLMNode_421.output.generatedResponse}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_599",
    "source": "triggerNode_1",
    "target": "LLMNode_599",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_599-LLMNode_421",
    "source": "LLMNode_599",
    "target": "LLMNode_421",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_421-responseNode_triggerNode_1",
    "source": "LLMNode_421",
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
