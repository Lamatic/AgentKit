export default {
  name: "Supply Chain Risk Oracle",
  description: "An autonomous agent that ingests a supplier list, scans global news and weather for disruption events, assigns a Disruption Probability Score (0–100) to each supplier, and auto-drafts mitigation emails for high-risk nodes.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Deepanshu Yadav", email: "deepanshuyadav@example.com" },
  tags: ["supply-chain", "risk-management", "logistics", "enterprise", "agentic"],
  steps: [
    {
      id: "supply-chain-scan",
      type: "mandatory" as const,
      envKey: "SUPPLY_CHAIN_SCAN_FLOW_ID"
    },
    {
      id: "supply-chain-email-draft",
      type: "mandatory" as const,
      envKey: "SUPPLY_CHAIN_EMAIL_DRAFT_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/supply-chain-risk-oracle",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsupply-chain-risk-oracle%2Fapps&env=SUPPLY_CHAIN_SCAN_FLOW_ID,SUPPLY_CHAIN_EMAIL_DRAFT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic+API+credentials+and+deployed+flow+IDs&envLink=https://lamatic.ai/docs"
  }
};
