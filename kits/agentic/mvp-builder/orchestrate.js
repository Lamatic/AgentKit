export const config = {
  flows: {
    mvp: {
      workflowId: process.env.AGENTIC_GENERATE_CONTENT,
      inputSchema: {
        idea: "string",
      },
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};