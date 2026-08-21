// Flow: ai-daily-wellness-coach

// -- Meta --
export const meta = {
  "name": "AI Daily Wellness Coach",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Shivani",
    "email": "shivani.mah007@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_292": [
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
    "ai_daily_wellness_coach_instructor_llmnode_292_system_0": "@prompts/ai-daily-wellness-coach_instructor-llmnode-292_system_0.md",
    "ai_daily_wellness_coach_instructor_llmnode_292_user_1": "@prompts/ai-daily-wellness-coach_instructor-llmnode-292_user_1.md"
  },
  "modelConfigs": {
    "ai_daily_wellness_coach_instructor_llmnode_292_generative_model_name": "@model-configs/ai-daily-wellness-coach_instructor-llmnode-292_generative-model-name.ts"
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
    "id": "InstructorLLMNode_292",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": {\n      \"type\": \"string\"\n    },\n    \"morning_routine\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"exercise\": {\n      \"type\": \"string\"\n    },\n    \"yoga\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"diet\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"water_intake\": {\n      \"type\": \"string\"\n    },\n    \"sleep\": {\n      \"type\": \"string\"\n    },\n    \"motivation\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-daily-wellness-coach_instructor-llmnode-292_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-daily-wellness-coach_instructor-llmnode-292_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/ai-daily-wellness-coach_instructor-llmnode-292_generative-model-name.ts"
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
        "content": "Summary: {{InstructorLLMNode_292.output.summary}}Morning Routine:{{InstructorLLMNode_292.output.morning_routine}}Exercise:{{InstructorLLMNode_292.output.exercise}}Yoga:{{InstructorLLMNode_292.output.yoga}}Diet:{{InstructorLLMNode_292.output.diet}}Hydration:{{InstructorLLMNode_292.output.water_intake}}Sleep:{{InstructorLLMNode_292.output.sleep}}Stress Management:{{InstructorLLMNode_292.output.motivation}}",
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
    "id": "triggerNode_1-InstructorLLMNode_292",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_292",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_292-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_292",
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
