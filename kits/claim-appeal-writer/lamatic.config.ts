export default {
  name: "Claim Appeal Writer",
  description: "Turns an insurance denial letter and your policy document into a cited, ready-to-send appeal letter with an evidence checklist and deadline tracker.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Reuben O Jacob", email: "reubenjacob16@gmail.com" },
  tags: ["agentic", "rag", "insurance", "consumer", "document-analysis", "legal"],
  steps: [
    {
      id: "index-policy",
      type: "mandatory" as const,
      envKey: "CLAIM_APPEAL_INDEX_POLICY"
    },
    {
      id: "analyze-denial",
      type: "mandatory" as const,
      envKey: "CLAIM_APPEAL_ANALYZE_DENIAL"
    },
    {
      id: "draft-appeal",
      type: "mandatory" as const,
      envKey: "CLAIM_APPEAL_DRAFT_APPEAL",
      prerequisiteSteps: ["index-policy", "analyze-denial"]
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/claim-appeal-writer",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fclaim-appeal-writer%2Fapps&env=CLAIM_APPEAL_INDEX_POLICY,CLAIM_APPEAL_ANALYZE_DENIAL,CLAIM_APPEAL_DRAFT_APPEAL,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20flow%20IDs%20and%20API%20credentials&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/claim-appeal-writer#setup"
  }
};
