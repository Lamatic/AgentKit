// Flow: receipt-budget-tracker

// -- Meta --
export const meta = {
  "name": "Receipt Budget Tracker",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Palash Pathare",
    "email": "palashpathare@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_575": [
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
    "receipt_budget_tracker_instructor_llmnode_575_system_0": "@prompts/receipt-budget-tracker_instructor-llmnode-575_system_0.md",
    "receipt_budget_tracker_instructor_llmnode_575_user_1": "@prompts/receipt-budget-tracker_instructor-llmnode-575_user_1.md"
  },
  "modelConfigs": {
    "receipt_budget_tracker_instructor_llmnode_575_generative_model_name": "@model-configs/receipt-budget-tracker_instructor-llmnode-575_generative-model-name.ts"
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
      "nodeId": "webhookTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Webhook"
      }
    }
  },
  {
    "id": "plus-node-addNode_728406",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "InstructorLLMNode_575",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Generate JSON",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"vendor\": {\n      \"type\": \"string\"\n    },\n    \"data\": {\n      \"type\": \"string\"\n    },\n    \"total\": {\n      \"type\": \"number\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "content": "@prompts/receipt-budget-tracker_instructor-llmnode-575_system_0.md",
            "role": "system"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "content": "@prompts/receipt-budget-tracker_instructor-llmnode-575_user_1.md",
            "role": "user"
          }
        ],
        "tools": [],
        "messages": "[]",
        "memories": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/receipt-budget-tracker_instructor-llmnode-575_generative-model-name.ts"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_575-437",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_575",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_575-plus-node-addNode_728406-125",
    "source": "InstructorLLMNode_575",
    "target": "plus-node-addNode_728406",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
