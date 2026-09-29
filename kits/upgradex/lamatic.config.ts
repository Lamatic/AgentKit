export default {
  name: "UpgradeX",
  description:
    "Dependency upgrade risk analyzer that inspects a GitHub repository, identifies dependency usage, analyzes release changes, and produces an evidence-based upgrade, validation, and rollback plan.",
  version: "1.0.0",
  type: "kit" as const,

  author: {
    name: "Sagar Mudgal",
    email: "mudgalsagar42@gmail.com",
  },

  tags: [
    "agentic",
    "dependency-analysis",
    "github",
    "software-engineering",
    "risk-analysis",
  ],

  steps: [
    {
      id: "upgrade-analyzer",
      type: "mandatory",
    },
  ],

  links: {
    demo: "",
    github: "",
    deploy: "",
    docs: "",
  },
};
