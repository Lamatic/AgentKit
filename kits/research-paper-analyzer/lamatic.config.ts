export default {
  name: "Research Paper Analyzer",
  description:
    "Upload any academic PDF and get a structured breakdown: problem statement, methodology, key findings, limitations, plain-English summary, and follow-up research questions.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Suhas Chowdary", email: "suhaschowdary25@gmail.com" },
  tags: ["research", "education", "pdf", "summarization", "academia"],
  steps: [
    { id: "research-paper-analyzer", type: "mandatory" as const, envKey: "RESEARCH_PAPER_ANALYZER_FLOW_ID" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/research-paper-analyzer",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fresearch-paper-analyzer%2Fapps&env=RESEARCH_PAPER_ANALYZER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Research%20Paper%20Analyzer%20keys%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
