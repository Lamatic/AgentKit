export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    analyze: {
      name: "Founder Lens - Analyze",
      workflowId: process.env.FOUNDER_LENS_ANALYZE_FLOW_ID ?? "",
      inputSchema: {
        idea: "string",
        userId: "string",
        sessionId: "string",
      },
    },
    chat: {
      name: "Founder Lens - Chat",
      workflowId: process.env.FOUNDER_LENS_CHAT_FLOW_ID ?? "",
      inputSchema: {
        message: "string",
        userId: "string",
        sessionId: "string",
      },
    },
  },
};
