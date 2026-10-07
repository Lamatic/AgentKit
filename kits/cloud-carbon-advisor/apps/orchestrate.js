// Flow registry — the single place that maps this kit's deployed Lamatic flow
// to the environment variable that holds its ID. `lib/lamatic-client.ts` reads
// `config.flows` from here; the app never hard-codes a flow ID.
export const config = {
  type: "single",
  flows: {
    step1: {
      name: "Carbon Advisor",
      workflowId: process.env.LAMATIC_CARBON_ADVISOR_FLOW_ID,
      description:
        "Diagnoses the dominant carbon driver of each cloud usage hotspot and recommends a decarbonization lever — as judgment, never as a number.",
      mode: "sync",
      expectedOutput: ["diagnoses", "recommendations"],
      inputSchema: {
        hotspots: "array",
        periodLabel: "string",
        currency: "string",
      },
      outputSchema: {
        diagnoses: "array",
        recommendations: "array",
      },
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};
