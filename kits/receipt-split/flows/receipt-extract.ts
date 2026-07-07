// Flow: receipt-extract

// -- Meta --
export const meta = {
  "name": "receipt-extract",
  "description": "Reads a photo or scan of a receipt and extracts merchant, line items, tax, tip, and grand total as structured JSON.",
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
  "InstructorLLMNode_841": [
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
    "receipt_extract_instructor_llmnode_841_system_0": "@prompts/receipt-extract_instructor-llmnode-841_system_0.md",
    "receipt_extract_instructor_llmnode_841_user_1": "@prompts/receipt-extract_instructor-llmnode-841_user_1.md"
  },
  "modelConfigs": {
    "receipt_extract_instructor_llmnode_841_generative_model_name": "@model-configs/receipt-extract_instructor-llmnode-841_generative-model-name.ts"
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
        "advance_schema": "{\n  \"imageUrl\": \"string\",\n  \"rawText\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_841",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"items\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"quantity\": {\n            \"type\": \"number\"\n          },\n          \"unitPrice\": {\n            \"type\": \"number\"\n          },\n          \"totalPrice\": {\n            \"type\": \"number\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"subtotal\": {\n      \"type\": \"number\"\n    },\n    \"tax\": {\n      \"type\": \"number\"\n    },\n    \"tip\": {\n      \"type\": \"number\"\n    },\n    \"grandTotal\": {\n      \"type\": \"number\"\n    },\n    \"currency\": {\n      \"type\": \"string\"\n    },\n    \"merchantName\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/receipt-extract_instructor-llmnode-841_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/receipt-extract_instructor-llmnode-841_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "{{triggerNode_1.output.imageUrl}}",
        "generativeModelName": "@model-configs/receipt-extract_instructor-llmnode-841_generative-model-name.ts"
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
    "id": "triggerNode_1-InstructorLLMNode_841",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_841",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_841-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_841",
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
