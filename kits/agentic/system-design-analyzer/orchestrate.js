export const config = {
  type: "atomic",
  flows: {
    "check-your-saas": {
      name: "Check Your SaaS",
      type: "graphQL",
      workflowId: process.env.SYSTEM_DESIGN_ANALYZER_FLOW_ID,
      description: "Analyzes system design specifications and extracts components, data flow, and assumptions using AI agents.",
      expectedOutput: ["components", "data_flow", "assumptions"],
      inputSchema: {
        system_design: "string"
      },
      outputSchema: {
        components: "array",
        data_flow: "string",
        assumptions: "array"
      },
      mode: "sync",
      polling: "false"
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
}
