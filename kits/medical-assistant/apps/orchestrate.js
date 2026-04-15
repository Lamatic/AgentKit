export const config = {
  type: "single",
  flows: {
    step1: {
      name: "Medical Assistant Chat",
      workflowId: process.env.MEDICAL_ASSISTANT_CHAT,
      description:
        "Processes medical queries and provides health information, symptom guidance, and wellness tips",
      mode: "sync",
      expectedOutput: "answer",
      inputSchema: {
        query: "string",
      },
      outputSchema: {
        answer: "string",
      },
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};
