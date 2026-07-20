export const config = {
  type: "single",
  flows: {
    step1: {
      name: "Why This Code",
      workflowId: process.env.WHY_THIS_CODE,
      description: "Explains code purpose, origin, and usages",
      mode: "sync",
      expectedOutput: "answer",
      inputSchema: {
        url: "string",
      },
      outputSchema: {
        aiResponse: "object",
        context: "object",
      },
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};
