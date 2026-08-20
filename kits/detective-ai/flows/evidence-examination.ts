/*
 * # Evidence Examination Flow
 * Performs forensic analysis of a discovered evidence item.
 */

// Flow: evidence-examination

export const meta = {
  "name": "Evidence Examination",
  "description": "Performs forensic analysis and interpretation of discovered case evidence without revealing hidden ground truth.",
  "tags": [
    "game",
    "forensics"
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
    "evidence_examination_examine_user": "@prompts/evidence-examination_examine_user.md",
    "evidence_examination_examine_system": "@prompts/evidence-examination_examine_system.md"
  },
  "modelConfigs": {
    "evidence_examination_examine": "@model-configs/evidence-examination_examine.ts"
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
        "nodeName": "Examine Evidence",
        "tools": [],
        "prompts": [
          {
            "id": "user-prompt-1",
            "role": "user",
            "content": "@prompts/evidence-examination_examine_user.md"
          },
          {
            "id": "system-prompt-1",
            "role": "system",
            "content": "@prompts/evidence-examination_examine_system.md"
          }
        ],
        "memories": "@model-configs/evidence-examination_examine.ts",
        "messages": "@model-configs/evidence-examination_examine.ts",
        "generativeModelName": "@model-configs/evidence-examination_examine.ts"
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
