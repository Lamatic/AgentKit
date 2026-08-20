export default {
  name: "Appeal Copilot",
  description:
    "Turns a pasted insurance claim denial letter into a scored, evidence-checked appeal package: denial classification, deadline urgency, a category-specific draft appeal letter, and a missing-evidence checklist.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Abhineet Saha", github: "AbhineetSaha" },
  tags: ["healthcare", "insurance", "appeals", "billing", "agentic", "structured-output"],
  steps: [
    {
      id: "appeal-analysis",
      name: "Analyze Denial & Draft Appeal",
      description:
        "Classifies a denial reason, computes appeal-deadline urgency, drafts a category-specific appeal letter, and scores its strength with a missing-evidence checklist.",
      type: "mandatory" as const,
      envKey: "APPEAL_ANALYSIS_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/appeal-copilot",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fappeal-copilot%2Fapps&env=APPEAL_ANALYSIS_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Appeal%20Copilot%20keys%20are%20required.",
    docs: "https://lamatic.ai/docs",
  },
};
