/*
 * # Solution Evaluation Flow
 * Evaluates the subjective quality of a player's final case theory.
 */

// Flow: solution-evaluation

export const meta = {
  "name": "Solution Evaluation",
  "description": "Grading logic for evaluating the player's written detective case hypothesis.",
  "tags": [
    "game",
    "evaluation"
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
    "solution_evaluation_evaluate_user": "@prompts/solution-evaluation_evaluate_user.md",
    "solution_evaluation_evaluate_system": "@prompts/solution-evaluation_evaluate_system.md"
  },
  "modelConfigs": {
    "solution_evaluation_evaluate": "@model-configs/solution-evaluation_evaluate.ts"
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
        "nodeName": "Evaluate Solution",
        "tools": [],
        "prompts": [
          {
            "id": "user-prompt-1",
            "role": "user",
            "content": "@prompts/solution-evaluation_evaluate_user.md"
          },
          {
            "id": "system-prompt-1",
            "role": "system",
            "content": "@prompts/solution-evaluation_evaluate_system.md"
          }
        ],
        "memories": "@model-configs/solution-evaluation_evaluate.ts",
        "messages": "@model-configs/solution-evaluation_evaluate.ts",
        "generativeModelName": "@model-configs/solution-evaluation_evaluate.ts"
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
