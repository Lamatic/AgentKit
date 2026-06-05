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
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/meeting-preparation-agent",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/blob/main/kits/meeting-preparation-agent/README.md",
  "deployUrl": "https://app.lamatic.ai",
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
