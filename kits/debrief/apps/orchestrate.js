export const config = {
  type: "atomic",
  flows: {
    "summarize-feedback": {
      name: "Summarize Feedback",
      type: "graphQL",
      workflowId: process.env.SUMMARIZE_FEEDBACK,
      description:
        "Single LLM extraction flow for interview feedback summarization",
      expectedOutput: ["result"],
      inputSchema: {
        feedback: "string",
      },
      outputSchema: {
        result: "string",
      },
      mode: "sync",
      polling: "false",
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};
