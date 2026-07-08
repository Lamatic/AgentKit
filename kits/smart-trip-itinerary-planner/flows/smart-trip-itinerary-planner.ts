// Flow: smart-trip-itinerary-planner

// -- Meta --
export const meta = {
  name: "Smart Trip Itinerary Planner",
  "description": "AI-powered travel itinerary generator",
  "tags": ["travel", "ai", "trip-planner", "itinerary"],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Dheeraj Singh",
    email: ""
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_159": [
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
    "smart_trip_itinerary_planner_llmnode_159_system_0": "@prompts/smart-trip-itinerary-planner_llmnode-159_system_0.md",
    "smart_trip_itinerary_planner_llmnode_159_user_1": "@prompts/smart-trip-itinerary-planner_llmnode-159_user_1.md"
  },
  "modelConfigs": {
    "smart_trip_itinerary_planner_llmnode_159_generative_model_name": "@model-configs/smart-trip-itinerary-planner_llmnode-159_generative-model-name.ts"
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
          "botName": "Smart Trip Planner",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
            "Plan a 5-day trip to Bali",
            "Suggest a honeymoon itinerary for Switzerland",
            "Create a budget-friendly trip to Goa"
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi! I'm Smart Trip Planner. Tell me your destination, budget, and travel preferences, and I'll create a personalized itinerary for you.",
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
    "id": "LLMNode_159",
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
            "content": "@prompts/smart-trip-itinerary-planner_llmnode-159_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/smart-trip-itinerary-planner_llmnode-159_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{triggerNode_1.output.chatHistory}}",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/smart-trip-itinerary-planner_llmnode-159_generative-model-name.ts"
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
        "content": "{{LLMNode_159.output.generatedResponse}}",
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
    "id": "triggerNode_1-LLMNode_159",
    "source": "triggerNode_1",
    "target": "LLMNode_159",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_159-responseNode_triggerNode_1",
    "source": "LLMNode_159",
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
