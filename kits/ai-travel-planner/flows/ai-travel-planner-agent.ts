// Flow: ai-travel-planner-agent

// -- Meta --
export const meta = {
  "name": "AI Travel Planner",
  "description": "AI-powered travel planning agent that generates personalized day-wise itineraries, hotel recommendations, local food guides, packing lists, and budget breakdowns for any destination worldwide.",
  "tags": ["travel", "planning", "itinerary", "generative", "chat", "groq"],
  "testInput": { "chatMessage": "Plan a 3-day trip to Goa, India. Budget: ₹15,000. Travel style: budget. Interests: beaches and food." },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/ai-travel-planner",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Abhishek Jain",
    "email": "znabhi02@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_1": [
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
    "ai_travel_planner_agent_llmnode_1_system_0": "@prompts/ai-travel-planner-agent_llmnode-1_system_0.md",
    "ai_travel_planner_agent_llmnode_1_user_1": "@prompts/ai-travel-planner-agent_llmnode-1_user_1.md"
  },
  "modelConfigs": {
    "ai_travel_planner_agent_llmnode_1_generative_model_name": "@model-configs/ai-travel-planner-agent_llmnode-1_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "chatTriggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "id": "chatTriggerNode_1",
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Chat Trigger",
        "chatConfig": {
          "colors": {
            "primary": "#2563EB",
            "secondary": "#F0F9FF"
          },
          "botName": "AI Travel Planner",
          "displayMode": "fullscreen",
          "suggestions": [
            "Plan a 7-day trip to Bali on a $1500 budget",
            "Luxury 5-day Paris trip, interested in food and culture",
            "Backpacker adventure in Thailand for 10 days, $800 budget"
          ],
          "greetingMessage": "✈️ Welcome to your AI Travel Planner! Tell me about your trip — share your destination, number of days, total budget, travel style (budget/luxury/backpacker), and interests (beaches/food/adventure/culture) and I'll craft a complete personalized travel guide for you!"
        }
      }
    }
  },
  {
    "id": "variablesNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "id": "variablesNode_1",
        "mapping": "{\"destination\":{\"type\":\"string\",\"value\":\"workflow.chatTriggerNode_1.output.chatMessage\"},\"days\":{\"type\":\"string\",\"value\":\"workflow.chatTriggerNode_1.output.chatMessage\"},\"budget\":{\"type\":\"string\",\"value\":\"workflow.chatTriggerNode_1.output.chatMessage\"},\"travelStyle\":{\"type\":\"string\",\"value\":\"workflow.chatTriggerNode_1.output.chatMessage\"},\"interests\":{\"type\":\"string\",\"value\":\"workflow.chatTriggerNode_1.output.chatMessage\"},\"userMessage\":{\"type\":\"string\",\"value\":\"workflow.chatTriggerNode_1.output.chatMessage\"}}",
        "nodeName": "Parse Travel Inputs"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "tools": [],
        "prompts": [
          {
            "id": "a8fc693f-4410-4274-b6d5-e68b9cfb3add",
            "role": "system",
            "content": "@prompts/ai-travel-planner-agent_llmnode-1_system_0.md"
          },
          {
            "id": "e4865379-a611-4af4-9127-92130b5f5f26",
            "role": "user",
            "content": "@prompts/ai-travel-planner-agent_llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{chatTriggerNode_1.output.chatHistory}}",
        "nodeName": "Generate Travel Plan",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/ai-travel-planner-agent_llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "chatResponseNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "id": "chatResponseNode_1",
        "content": "{{LLMNode_1.output.generatedResponse}}",
        "nodeName": "Stream Travel Plan Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "chatTriggerNode_1-variablesNode_1",
    "source": "chatTriggerNode_1",
    "target": "variablesNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "variablesNode_1-LLMNode_1",
    "source": "variablesNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_1",
    "source": "chatTriggerNode_1",
    "target": "chatResponseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
