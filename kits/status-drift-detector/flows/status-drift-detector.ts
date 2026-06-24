// Flow: status-drift-detector

// -- Meta --
export const meta = {
  "name": "status-drift-detector",
  "description": "Compares status across two tracking sources and flags drift with a suggested reconciled status.",
  "tags": ["productivity", "automation", "reasoning"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/status-drift-detector",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Shreya Salimath",
    "email": "shreya.salimath20@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_190": [
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
    "status_drift_detector_llmnode_190_system_0": "@prompts/status-drift-detector_llmnode-190_system_0.md",
    "status_drift_detector_llmnode_190_user_1": "@prompts/status-drift-detector_llmnode-190_user_1.md"
  },
  "modelConfigs": {
    "status_drift_detector_llmnode_190_generative_model_name": "@model-configs/status-drift-detector_llmnode-190_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"source_a_status\": \"string\",\n  \"source_b_status\": \"string\",\n  \"context\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_190",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/status-drift-detector_llmnode-190_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/status-drift-detector_llmnode-190_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/status-drift-detector_llmnode-190_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{LLMNode_190.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_190",
    "source": "triggerNode_1",
    "target": "LLMNode_190",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_190-responseNode_triggerNode_1",
    "source": "LLMNode_190",
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
