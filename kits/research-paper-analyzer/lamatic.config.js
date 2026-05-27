/** @type {import('lamatic').Config} */
const config = {
  name: "Research Paper Analyzer",
  description:
    "Upload any academic PDF and get a structured breakdown: problem statement, methodology, key findings, limitations, plain-English summary, and follow-up research questions.",
  version: "1.0.0",
  type: "kit",
  author: { name: "Suhas Chowdary", email: "suhaschowdary25@gmail.com" },
  tags: ["research", "education", "pdf", "summarization", "academia"],
  steps: [
    { id: "research-paper-analyzer", type: "mandatory", envKey: "RESEARCH_PAPER_ANALYZER_FLOW_ID" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/research-paper-analyzer",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit/tree/main/kits/research-paper-analyzer/apps&env=RESEARCH_PAPER_ANALYZER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&root-directory=kits/research-paper-analyzer/apps",
    docs: "https://lamatic.ai/docs",
  },
};

module.exports = config;
