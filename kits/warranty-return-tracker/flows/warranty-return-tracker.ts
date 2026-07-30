// Flow: warranty-return-tracker

// -- Meta --
export const meta = {
  "name": "Warranty Return Tracker",
  "description": "Extracts return and warranty terms from purchase text and deterministically calculates deadlines, urgency, and recommended actions.",
  "tags": ["warranty", "returns", "receipts", "deadline-tracking"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Cherukuri Manojna",
    "email": "cherukurimanojna@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_194": [
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
    "warranty_return_tracker_instructor_llmnode_194_system_0": "@prompts/warranty-return-tracker_instructor-llmnode-194_system_0.md",
    "warranty_return_tracker_instructor_llmnode_194_user_1": "@prompts/warranty-return-tracker_instructor-llmnode-194_user_1.md"
  },
  "modelConfigs": {
    "warranty_return_tracker_instructor_llmnode_194_generative_model_name": "@model-configs/warranty-return-tracker_instructor-llmnode-194_generative-model-name.ts"
  },
  "scripts": {
    "warranty_return_tracker_code_node_313_code": "@scripts/warranty-return-tracker_code-node-313_code.ts"
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
        "advance_schema": "{\n  \"receipt_text\": \"string\",\n  \"today_date\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_194",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"purchase\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"retailer\": {\n          \"type\": \"string\"\n        },\n        \"purchase_date\": {\n          \"type\": \"string\"\n        },\n        \"invoice_number\": {\n          \"type\": \"string\"\n        },\n        \"currency\": {\n          \"type\": \"string\"\n        },\n        \"purchase_channel\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"items\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"brand\": {\n            \"type\": \"string\"\n          },\n          \"price\": {\n            \"type\": \"number\"\n          },\n          \"return_policy\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"window_days\": {\n                \"type\": \"number\"\n              },\n              \"source_text\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          },\n          \"warranty\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"period_months\": {\n                \"type\": \"number\"\n              },\n              \"type\": {\n                \"type\": \"string\"\n              },\n              \"source_text\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          },\n          \"notes\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/warranty-return-tracker_instructor-llmnode-194_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/warranty-return-tracker_instructor-llmnode-194_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/warranty-return-tracker_instructor-llmnode-194_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_313",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/warranty-return-tracker_code-node-313_code.ts",
        "nodeName": "Code"
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
        "outputMapping": "{\n  \"purchase\": \"{{codeNode_313.output.purchase}}\",\n  \"items\": \"{{codeNode_313.output.items}}\",\n  \"needs_confirmation\": \"{{codeNode_313.output.needs_confirmation}}\",\n  \"missing_required_fields\": \"{{codeNode_313.output.missing_required_fields}}\",\n  \"digest\": \"{{codeNode_313.output.digest}}\",\n  \"parse_error\": \"{{codeNode_313.output.parse_error}}\",\n  \"error_code\": \"{{codeNode_313.output.error_code}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_194",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_194",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_194-codeNode_313",
    "source": "InstructorLLMNode_194",
    "target": "codeNode_313",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_313-responseNode_triggerNode_1",
    "source": "codeNode_313",
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
