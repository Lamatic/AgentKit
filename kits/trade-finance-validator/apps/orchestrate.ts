// Root-level orchestration config — maps env vars to flow IDs and API credentials
// This file is imported by apps/lib/lamatic-client.ts and apps/actions/orchestrate.ts

export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? null,
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    tradeFinanceValidator: {
      name: "Trade Finance Document Validator",
      workflowId: process.env.TRADE_FINANCE_VALIDATOR_FLOW_ID ?? "",
      inputSchema: {
        document_text: "string",
        file_name: "string",
        today_date: "string",
      },
    },
  },
};
