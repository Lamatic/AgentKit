// Flow: mirror-check

// -- Meta --
export const meta = {
  "name": "Mirror Check",
  "description": "A self-check for candidates before they apply: type in what's on your GitHub, portfolio, resume, and/or LinkedIn, and get back an honest first-impression report — hiring score, strengths, red flags, technical and communication assessment, and top improvements.",
  "tags": ["career", "developer-tools", "portfolio-review", "generative"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Saba fathima",
    "email": "sabaf0186@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_797": [
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
    "mirror_check_instructor_llmnode_797_system_0": "@prompts/mirror-check_instructor-llmnode-797_system_0.md",
    "mirror_check_instructor_llmnode_797_user_1": "@prompts/mirror-check_instructor-llmnode-797_user_1.md"
  },
  "modelConfigs": {
    "mirror_check_instructor_llmnode_797_generative_model_name": "@model-configs/mirror-check_instructor-llmnode-797_generative-model-name.ts"
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
    "id": "InstructorLLMNode_797",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"hiring_score\": {\n      \"type\": \"number\",\n      \"required\": true\n    },\n    \"first_impression\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"strengths\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"red_flags\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"technical_assessment\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"communication_assessment\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"would_interview\": {\n      \"type\": \"boolean\",\n      \"required\": true\n    },\n    \"top_improvements\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"verdict\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"formatted_report\": {\n      \"type\": \"string\",\n      \"required\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/mirror-check_instructor-llmnode-797_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/mirror-check_instructor-llmnode-797_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/mirror-check_instructor-llmnode-797_generative-model-name.ts"
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
        "content": "{{InstructorLLMNode_797.output.formatted_report}}",
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
    "id": "triggerNode_1-InstructorLLMNode_797",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_797",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_797-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_797",
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
