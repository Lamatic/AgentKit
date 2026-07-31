// Flow: hackathon-project-mentor

// -- Meta --
export const meta = {
  "name": "hackathon-project-mentor",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Roshan Borkar",
    "email": "roshan.22310181@viit.ac.in"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_665": [
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
    "hackathon_project_mentor_llmnode_665_system_0": "@prompts/hackathon-project-mentor_llmnode-665_system_0.md",
    "hackathon_project_mentor_llmnode_665_user_1": "@prompts/hackathon-project-mentor_llmnode-665_user_1.md"
  },
  "modelConfigs": {
    "hackathon_project_mentor_llmnode_665_generative_model_name": "@model-configs/hackathon-project-mentor_llmnode-665_generative-model-name.ts"
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
        "id": "triggerNode_1",
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Hackathon Project Mentor",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
             "Help me build an AI healthcare hackathon project in 36 hours.",
  "Suggest an MVP for a Smart City hackathon idea.",
  "Create a project roadmap for a team of 4 developers.",
  "Generate a winning pitch for my hackathon project."
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Describe your hackathon idea, theme, team, and timeline. I'll help you build a winning project plan.",
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
    "id": "LLMNode_665",
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
            "content": "@prompts/hackathon-project-mentor_llmnode-665_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/hackathon-project-mentor_llmnode-665_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[{{triggerNode_1.output.chatMessage}}]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/hackathon-project-mentor_llmnode-665_generative-model-name.ts"
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
        "content": "{{LLMNode_665.output.generatedResponse}}",
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
    "id": "triggerNode_1-LLMNode_665",
    "source": "triggerNode_1",
    "target": "LLMNode_665",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_665-responseNode_triggerNode_1",
    "source": "LLMNode_665",
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
