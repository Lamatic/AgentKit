export const config = {
  type: "atomic",
  flows: {
    "system-design-analyzer": {
      name: "System Design Analyzer",
      type: "graphQL",
      workflowId: process.env.SYSTEM_DESIGN_ANALYZER_FLOW_ID,
      description: "Analyzes system design specifications and provides comprehensive insights on architecture, backend design, performance, security, cost, and overall system quality.",
      expectedOutput: ["issues", "recommendations", "summary"],
      inputSchema: {
        system_design: "string"
      },
      outputSchema: {
        issues: "array",
        recommendations: "array",
        summary: "string"
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
