export default {
  name: "CollectFlow",
  description:
    "An AI-native Accounts Receivable decision engine that ranks customer portfolios, recommends customer-specific collection strategies, applies approval controls, and tracks collection outcomes.",
  version: "1.0.0",
  type: "kit" as const,

  author: {
    name: "Sahil Shitole",
    email: "sahilmshitole1483@gmail.com",
  },

  tags: [
    "accounts-receivable",
    "collections",
    "finance",
    "agentic-workflow",
    "decision-support",
  ],

  steps: [
    {
      id: "collect-flow-portfolio-intelligence",
      type: "mandatory" as const,
      envKey: "LAMATIC_PORTFOLIO_FLOW_ID",
    },
    {
      id: "collect-flow-customer-strategy",
      type: "mandatory" as const,
      envKey: "LAMATIC_CUSTOMER_STRATEGY_FLOW_ID",
      prerequisiteSteps: ["collect-flow-portfolio-intelligence"],
    },
  ],

  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/collectflow",
    demo: "https://collectflow-nine.vercel.app",
    deploy: "https://collectflow-nine.vercel.app",
  },
};
