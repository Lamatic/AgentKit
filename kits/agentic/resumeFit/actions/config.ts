export const config = {
  flows: {
    resumeFit: {
      name: "Resume Fit Flow",
      workflowId: process.env.AGENTIC_GENERATE_CONTENT,
      inputSchema: {
        instructions: "string",
        mode: "string"
      }
    }
  }
}