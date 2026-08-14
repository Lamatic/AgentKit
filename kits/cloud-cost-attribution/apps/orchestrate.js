export const config = {
  type: "single",
  flows: {
    step1: {
      name: "Cost Attribution",
      workflowId: process.env.LAMATIC_COST_ATTRIBUTION_FLOW_ID,
      description: "Attributes cloud spend anomalies to the change that caused them and returns a costed remediation plan",
      mode: "sync",
      expectedOutput: ["anomalies", "totalDeltaAbs", "execSummary"],
      inputSchema: {
        anomalies: "array",
        changeEvents: "array",
        periodLabel: "string",
        currency: "string",
      },
      outputSchema: {
        periodLabel: "string",
        currency: "string",
        totalCurrent: "number",
        totalBaseline: "number",
        totalDeltaAbs: "number",
        totalDeltaPct: "number",
        anomalies: "array",
        totalEstimatedSavings: "number",
        unattributedCount: "number",
        execSummary: "string",
      },
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};
