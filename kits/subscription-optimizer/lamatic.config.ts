export default {
  name: "Subscription Optimizer",
  description: "Analyzes a list of user subscriptions, identifies redundant services, calculates total costs, and provides actionable cost-saving recommendations.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Baran Onala", email: "onalabaran6@gmail.com" },
  tags: ["finance", "optimization"],
  steps: [
    { id: "subscription-optimizer", type: "mandatory" as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/subscription-optimizer",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/subscription-optimizer"
  }
};