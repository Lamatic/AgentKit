export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    "supply-chain-scan": {
      name: "Supply Chain Scan",
      workflowId: process.env.SUPPLY_CHAIN_SCAN_FLOW_ID ?? "",
    },
    "supply-chain-email-draft": {
      name: "Supply Chain Email Draft",
      workflowId: process.env.SUPPLY_CHAIN_EMAIL_DRAFT_FLOW_ID ?? "",
    },
  },
} as const;
