// Flow: scale-pilot

// -- Meta --
export const meta = {
  "name": "ScalePilot",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Samakcha Mishra",
    "email": "samakchakrmishra03@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_493": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_741": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_558": [
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
    "scale_pilot_instructor_llmnode_493_system_0": "@prompts/scale-pilot_instructor-llmnode-493_system_0.md",
    "scale_pilot_instructor_llmnode_493_user_1": "@prompts/scale-pilot_instructor-llmnode-493_user_1.md",
    "scale_pilot_llmnode_741_system_0": "@prompts/scale-pilot_llmnode-741_system_0.md",
    "scale_pilot_llmnode_741_user_1": "@prompts/scale-pilot_llmnode-741_user_1.md",
    "scale_pilot_llmnode_558_system_0": "@prompts/scale-pilot_llmnode-558_system_0.md",
    "scale_pilot_llmnode_558_system_1": "@prompts/scale-pilot_llmnode-558_system_1.md",
    "scale_pilot_llmnode_558_system_2": "@prompts/scale-pilot_llmnode-558_system_2.md",
    "scale_pilot_llmnode_558_system_3": "@prompts/scale-pilot_llmnode-558_system_3.md",
    "scale_pilot_llmnode_558_user_4": "@prompts/scale-pilot_llmnode-558_user_4.md"
  },
  "modelConfigs": {
    "scale_pilot_instructor_llmnode_493_generative_model_name": "@model-configs/scale-pilot_instructor-llmnode-493_generative-model-name.ts",
    "scale_pilot_llmnode_741_generative_model_name": "@model-configs/scale-pilot_llmnode-741_generative-model-name.ts",
    "scale_pilot_llmnode_558_generative_model_name": "@model-configs/scale-pilot_llmnode-558_generative-model-name.ts"
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
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
            "What is lamatic?",
            "How do I add data to my chatbot?",
            "Explain this product to me"
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "userMessageBgColor": "#FEF2F2",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#d12323",
          "agentMessageTextColor": "#334155"
        }
      }
    }
  },
  {
    "id": "InstructorLLMNode_493",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"application_type\": {\n      \"type\": \"string\"\n    },\n    \"architecture\": {\n      \"type\": \"string\"\n    },\n    \"language\": {\n      \"type\": \"string\"\n    },\n    \"backend\": {\n      \"type\": \"string\"\n    },\n    \"frontend\": {\n      \"type\": \"string\"\n    },\n    \"database\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"cache\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"message_queue\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"cloud_provider\": {\n      \"type\": \"string\"\n    },\n    \"containerization\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"current_users\": {\n      \"type\": \"string\"\n    },\n    \"target_users\": {\n      \"type\": \"string\"\n    },\n    \"bottlenecks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"constraints\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"missing_information\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"has_missing_information\": {\n      \"type\": \"boolean\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/scale-pilot_instructor-llmnode-493_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/scale-pilot_instructor-llmnode-493_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{triggerNode_1.output.chatHistory}}",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/scale-pilot_instructor-llmnode-493_generative-model-name.ts"
      }
    }
  },
  {
    "id": "conditionNode_766",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_766-addNode_931",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{InstructorLLMNode_493.output.has_missing_information}}\",\n      \"operator\": \"==\",\n      \"value\": \"true\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_766-addNode_612",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "LLMNode_741",
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
            "id": "94028817-e782-4c07-b894-c3f526238fef",
            "role": "system",
            "content": "@prompts/scale-pilot_llmnode-741_system_0.md"
          },
          {
            "id": "d39f9956-0b0d-4f6c-a310-3fe5697aab81",
            "role": "user",
            "content": "@prompts/scale-pilot_llmnode-741_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/scale-pilot_llmnode-741_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_558",
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
            "content": "@prompts/scale-pilot_llmnode-558_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "system",
            "content": "@prompts/scale-pilot_llmnode-558_system_1.md"
          },
          {
            "id": "9b8ffd4f-7a57-43dd-9e8a-36f662805497",
            "role": "system",
            "content": "@prompts/scale-pilot_llmnode-558_system_2.md"
          },
          {
            "id": "99c2222e-b087-42a8-abe4-3af42f2bc693",
            "role": "system",
            "content": "@prompts/scale-pilot_llmnode-558_system_3.md"
          },
          {
            "id": "5454461f-4382-4b84-a5a1-f156237a75e7",
            "role": "user",
            "content": "@prompts/scale-pilot_llmnode-558_user_4.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/scale-pilot_llmnode-558_generative-model-name.ts"
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
      "nodeId": "chatResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "content": "{{LLMNode_558.output.generatedResponse}}{{LLMNode_741.output.generatedResponse}}",
        "nodeName": "Chat Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_493-167",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_493",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_493-conditionNode_766",
    "source": "InstructorLLMNode_493",
    "target": "conditionNode_766",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_766-LLMNode_558-866",
    "source": "conditionNode_766",
    "target": "LLMNode_558",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_766-LLMNode_741-949",
    "source": "conditionNode_766",
    "target": "LLMNode_741",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_558-responseNode_triggerNode_1-173",
    "source": "LLMNode_558",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_741-responseNode_triggerNode_1-864",
    "source": "LLMNode_741",
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
