export default {
  name: "mou-drafter",
  description: "AI-powered Memorandum of Understanding generator that produces a structured, LaTeX-formatted legal draft from a guided form — covering parties, scope, payment, IP, cancellation, and jurisdiction clauses.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Rohith Rathod",
    email: "banothrohithrathod@gmail.com",
  },
  tags: ["legal", "document-generation", "latex", "mou", "contracts"],
  steps: [
    {
      id: "mou-drafter",
      type: "mandatory" as const,
      envKey: "MOU_DRAFTER_FLOW_ID",
    },
  ],
  links: {
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fmou-drafter%2Fapps",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/mou-drafter",
  },
};
