export default {
  name: "website-optimiser",
  description: "Autonomous website audit and cold outreach agent. Paste any business website URL to receive a complete SEO audit, performance analysis, UI/UX review, competitor research, AI redesign suggestions, personalized cold email sequence, LinkedIn outreach, and a full business proposal — powered by 12 specialized AI agents.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Rohit",
    email: "rohitindurke@gmail.com"
  },
  tags: ["website-audit", "seo", "cold-outreach", "lead-generation", "sales", "ai-agents", "performance", "ux"],
  steps: [
    {
      id: "webrevive-orchestrator",
      type: "mandatory" as const,
      envKey: "WEBREVIVE_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/website-optimiser",
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit%2Ftree%2Fmain%2Fkits%2Fwebsite-optimiser%2Fapps&root-directory=kits/website-optimiser/apps"
  }
};
