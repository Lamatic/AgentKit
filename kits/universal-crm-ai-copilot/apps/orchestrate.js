export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL || "https://api.lamatic.ai",
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  },
  flows: {
    "universal-crm-ai-copilot": {
      name: "Universal Multi-CRM AI Copilot",
      workflowId: process.env.UNIVERSAL_CRM_AI_COPILOT
    }
  }
};
