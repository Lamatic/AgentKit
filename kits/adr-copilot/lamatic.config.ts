export default {
  name: "ADR Copilot",
  description: "Automated Architecture Decision Record (ADR) generator that turns engineering proposals and technical design notes into standardized MADR records, trade-off matrices, and risk assessments.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Devaraj", email: "devaraj764@gmail.com" },
  tags: ["architecture", "engineering", "madr", "documentation", "agentic"],
  steps: [
    {
      id: "adr-copilot",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/adr-copilot",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fadr-copilot%2Fapps&env=LAMATIC_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20credentials%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs"
  }
};
