export default {
  name: "Trade Finance Document Validator",
  description: "Automates the first-pass review of trade finance documents (Letters of Credit, trade licenses, invoices) by extracting structured fields and validating them against a compliance rule checklist.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Sivaprasad", email: "sivaprasad@example.com" },
  tags: ["trade-finance", "document-validation", "extraction", "compliance", "banking"],
  steps: [
    {
      id: "trade-finance-validator",
      type: "mandatory" as const,
      envKey: "TRADE_FINANCE_VALIDATOR_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/trade-finance-validator",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Ftrade-finance-validator%2Fapps&env=TRADE_FINANCE_VALIDATOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20credentials%20and%20deployed%20flow%20ID.&envLink=https://lamatic.ai/docs"
  }
};
