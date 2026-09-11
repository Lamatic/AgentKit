// Flow: chilly-apartment

// -- Meta --
export const meta = {
  "name": "Incident Response Agent",
  "description": "A lightweight incident-response advisory template flow that receives incident queries or logs and generates real-time guidance using an LLM.",
  "tags": [
    "ai",
    "incident-response",
    "automation",
    "lamatic"
  ],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/incident-response-agent",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "GADDAM AVINASH",
    "email": "avinash.gaddam798@gmail.com"
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
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "chilly_apartment_llmnode_645_system_0": "@prompts/chilly-apartment_llmnode-645_system_0.md",
    "chilly_apartment_llmnode_645_user_1": "@prompts/chilly-apartment_llmnode-645_user_1.md"
  },
  "modelConfigs": {
    "chilly_apartment_llmnode_645_generative_model_name": "@model-configs/chilly-apartment_llmnode-645_generative-model-name.ts"
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
        "advance_schema": "{\n  \"sampleInput\": \"string\"\n}"
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
            "content": "@prompts/chilly-apartment_llmnode-645_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/chilly-apartment_llmnode-645_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/chilly-apartment_llmnode-645_generative-model-name.ts"
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
        "outputMapping": "{}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_645",
    "source": "triggerNode_1",
    "target": "LLMNode_645",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_645-responseNode_triggerNode_1",
    "source": "LLMNode_645",
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
