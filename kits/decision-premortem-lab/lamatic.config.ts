export default {
  name: "Decision Pre-Mortem Lab",
  description:
    "Turns a proposed decision into an evidence-aware assumption ledger, ranked failure modes, and small validation experiments before resources are committed.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Reuben Philipose",
    email: "reubenphilipose25@gmail.com",
  },
  tags: ["decision-making", "risk", "planning", "validation"],
  steps: [
    {
      id: "decision-premortem-lab",
      type: "mandatory" as const,
      envKey: "DECISION_PREMORTEM_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/decision-premortem-lab",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdecision-premortem-lab%2Fapps&env=DECISION_PREMORTEM_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
  },
};
