export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    offerNegotiator: {
      name: "Offer Negotiator",
      workflowId: process.env.OFFER_NEGOTIATOR ?? "",
      inputSchema: {
        role: "string",
        company: "string",
        location: "string",
        seniority: "string",
        current_base: "string",
        current_bonus: "string",
        current_equity: "string",
        offered_base: "string",
        offered_bonus: "string",
        offered_equity: "string",
        competing_offers: "string",
        priorities: "string",
        constraints: "string",
      },
    },
  },
};
