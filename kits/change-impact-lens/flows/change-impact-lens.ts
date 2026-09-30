// Flow: change-impact-lens

// -- Meta --
export const meta = {
  "name": "change impact lens",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "harish chandar",
    "email": "harishchandar9a1013@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_283": [
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
    "change_impact_lens_llmnode_283_system_0": "@prompts/change-impact-lens_llmnode-283_system_0.md",
    "change_impact_lens_llmnode_283_user_1": "@prompts/change-impact-lens_llmnode-283_user_1.md"
  },
  "modelConfigs": {
    "change_impact_lens_llmnode_283_generative_model_name": "@model-configs/change-impact-lens_llmnode-283_generative-model-name.ts"
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
        "advance_schema": "{\n  \"target_file\": \"string\",\n  \"dependents_evidence\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_283",
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
            "content": "@prompts/change-impact-lens_llmnode-283_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/change-impact-lens_llmnode-283_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/change-impact-lens_llmnode-283_generative-model-name.ts"
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
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_283.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_283",
    "source": "triggerNode_1",
    "target": "LLMNode_283",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_283-responseNode_triggerNode_1",
    "source": "LLMNode_283",
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
