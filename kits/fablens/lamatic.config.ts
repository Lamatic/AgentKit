export default {
  name: "fabric-material-analyzer",
  description:
    "Analyzes clothing product URLs to identify materials and provide factual environmental and skin safety insights.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Yashasvi",
    email: "yashasvivij01@email.com",
  },
  tags: ["sustainability", "fashion", "environment", "skin-safety", "consumer"],
  steps: [
    {
      id: "fabric-material-analyzer",
      type: "mandatory" as const,
    },
  ],
  links: {
    github: "https://github.com/yashasvij-19/AgentKit/tree/main/kits/fablens",
  },
};