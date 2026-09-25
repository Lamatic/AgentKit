/*
 * # Suspect Interrogation Flow
 * Conducts natural language suspect interrogation based on whitelisted alibis and history.
 */

// Flow: suspect-interrogation

export const meta = {
  "name": "Suspect Interrogation",
  "description": "Performs in-character dialogue roleplay with a suspect based on their whitelisted alibi and statements history.",
  "tags": [
    "game",
    "interrogation"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "DetectiveAI Team",
    "email": "info@detectiveai.com"
  }
};

export const inputs = {};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "suspect_interrogation_interrogate_user": "@prompts/suspect-interrogation_interrogate_user.md",
    "suspect_interrogation_interrogate_system": "@prompts/suspect-interrogation_interrogate_system.md"
  },
  "modelConfigs": {
    "suspect_interrogation_interrogate": "@model-configs/suspect-interrogation_interrogate.ts"
  }
};

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
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Interrogate Suspect",
        "tools": [],
        "prompts": [
          {
            "id": "user-prompt-1",
            "role": "user",
            "content": "@prompts/suspect-interrogation_interrogate_user.md"
          },
          {
            "id": "system-prompt-1",
            "role": "system",
            "content": "@prompts/suspect-interrogation_interrogate_system.md"
          }
        ],
        "memories": "@model-configs/suspect-interrogation_interrogate.ts",
        "messages": "@model-configs/suspect-interrogation_interrogate.ts",
        "generativeModelName": "@model-configs/suspect-interrogation_interrogate.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 300
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"response\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-graphqlResponseNode_1",
    "source": "LLMNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
