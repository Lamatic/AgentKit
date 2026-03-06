export const config = {
  type: "atomic",
  flows: {
    legalAssistant: {
      name: "Legal Assistant",
      type: "graphQL",
      workflowId: process.env.ASSISTANT_LEGAL_ADVISOR,
      description:
        "Analyze a legal question, return an informational summary, references, and practical next steps.",
      expectedOutput: ["answer", "references", "nextSteps", "disclaimer"],
      inputSchema: {
        question: "string",
        jurisdiction: "string",
        context: "string"
      },
      outputSchema: {
        answer: "string",
        references: "array",
        nextSteps: "array",
        disclaimer: "string"
      },
      mode: "sync",
      polling: false
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
}
