export default {
  name: "MoU Drafter",
  description:
    "Drafts vendor MoUs and small-org contracts from structured input. Outputs LaTeX with in-browser PDF preview, encoded with patterns drawn from real vendor work. First-draft assistance for human review — not legal advice.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Rohith Banoth", email: "banothrohithrathod@gmail.com" },
  tags: ["generative", "document", "automation", "compliance"],
  steps: [
    {
      id: "mou-drafter",
      type: "mandatory" as const,
      envKey: "MOU_DRAFTER_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/mou-drafter",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fmou-drafter%2Fapps&env=MOU_DRAFTER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
    demo: "",
  },
};
