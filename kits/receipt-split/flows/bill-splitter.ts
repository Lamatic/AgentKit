// Flow: bill-splitter

// -- Meta --
export const meta = {
  "name": "bill-splitter",
  "description": "Takes structured receipt data plus plain-English splitting instructions and returns a per-person settlement summary.",
  "tags": [],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-split",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-split#readme",
  "deployUrl": "",
  "author": {
    "name": "HEMANTH AMARTHI",
    "email": "hemanthkumar.amarthi7@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_884": [
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
    "bill_splitter_instructor_llmnode_884_system_0": "@prompts/bill-splitter_instructor-llmnode-884_system_0.md",
    "bill_splitter_instructor_llmnode_884_user_1": "@prompts/bill-splitter_instructor-llmnode-884_user_1.md"
  },
  "modelConfigs": {
    "bill_splitter_instructor_llmnode_884_generative_model_name": "@model-configs/bill-splitter_instructor-llmnode-884_generative-model-name.ts"
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
        "advance_schema": "{\n  \"receiptData\": \"string\",\n  \"splitInstructions\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_884",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"perPerson\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"itemsShare\": {\n            \"type\": \"number\"\n          },\n          \"taxShare\": {\n            \"type\": \"number\"\n          },\n          \"tipShare\": {\n            \"type\": \"number\"\n          },\n          \"total\": {\n            \"type\": \"number\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"subtotal\": {\n      \"type\": \"number\"\n    },\n    \"tax\": {\n      \"type\": \"number\"\n    },\n    \"tip\": {\n      \"type\": \"number\"\n    },\n    \"grandTotal\": {\n      \"type\": \"number\"\n    },\n    \"currency\": {\n      \"type\": \"string\"\n    },\n    \"notes\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/bill-splitter_instructor-llmnode-884_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/bill-splitter_instructor-llmnode-884_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/bill-splitter_instructor-llmnode-884_generative-model-name.ts"
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
    "id": "triggerNode_1-InstructorLLMNode_884",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_884",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_884-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_884",
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
