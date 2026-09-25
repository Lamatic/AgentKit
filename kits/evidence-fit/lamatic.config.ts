export default {
  name: "EvidenceFit",
  description:
    "Compares candidate chunking and retrieval configurations against labelled source-evidence spans and blocks deployment when complete evidence cannot be recovered.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Naman Gupta", email: "namanguptabhopal@gmail.com" },
  tags: ["rag", "retrieval", "evaluation", "chunking", "developer-tools"],
  steps: [
    { id: "evidence-fit-index", type: "mandatory" as const, envKey: "LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID" },
    { id: "evidence-fit-evaluate", type: "mandatory" as const, envKey: "LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/evidence-fit",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fevidence-fit%2Fapps&env=LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID,LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20the%20deployed%20flow%20IDs.&envLink=https%3A%2F%2Flamatic.ai%2Fdocs",
    docs: "https://lamatic.ai/docs",
  },
};
