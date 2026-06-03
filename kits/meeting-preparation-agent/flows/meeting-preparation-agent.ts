export const meta = {
  "name": "meeting-preparation-agent",
  "description": "AI-powered interview preparation assistant that generates personalized interview preparation guides based on company and role information.",
  "tags": [
    "interview",
    "career",
    "job-preparation",
    "ai-assistant"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "tiyajain28102005",
    "email": "tiyajain28102005@gmail.com"
  }
};

export const inputs = {
  "LLMNode_300": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "meeting_preparation_agent_llmnode_300_system_0": "@prompts/meeting-preparation-agent_llmnode-300_system_0.md",
    "meeting_preparation_agent_llmnode_300_user_1": "@prompts/meeting-preparation-agent_llmnode-300_user_1.md"
  },
  "modelConfigs": {
    "meeting_preparation_agent_llmnode_300_generative_model_name": "@model-configs/meeting-preparation-agent_llmnode-300_generative-model-name.ts"
  }
};


export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "askTriggerNode",
      "trigger": true,
      "values": {
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Ask Trigger",
        "askConfig": {
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "suggestions": [
          "Prepare me for a Software Engineer interview at Google",
          "Help me practice behavioral interview questions",
          "Create a 30-minute interview preparation plan",
          "Generate Backend Developer interview questions",
          "What questions should I ask my interviewer?",
          "Prepare me for a Product Manager interview"
        ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "showCopyButton": true,
          "showNavHelperText": true,
          "initialPlaceholder": "Ask your message",
          "followUpPlaceholder": "Follow up on your message",
          "showFeedbackButtons": true,
          "showEscapeHelperText": true
        }
      }
    }
  },
  {
    "id": "LLMNode_300",
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
            "content": "@prompts/meeting-preparation-agent_llmnode-300_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/meeting-preparation-agent_llmnode-300_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/meeting-preparation-agent_llmnode-300_generative-model-name.ts"
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
      "nodeId": "askResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "content": "LLMNode_300.generatedResponse",
        "nodeName": "Ask Response",
        "references": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_300",
    "source": "triggerNode_1",
    "target": "LLMNode_300",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_300-responseNode_triggerNode_1",
    "source": "LLMNode_300",
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
