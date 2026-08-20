export default {
  name: "DetectiveAI",
  description: "An AI-powered interactive detective investigation engine and game featuring suspect interrogation alibis, forensic evidence analysis, and subjective hypothesis grading.",
  version: "0.1.0",
  type: "kit" as const,
  author: { name: "DetectiveAI Team", email: "info@detectiveai.com" },
  tags: ["game", "agentic", "evaluation"],
  steps: [
    {
      id: "suspect-interrogation",
      type: "mandatory" as const,
      envKey: "LAMATIC_SUSPECT_FLOW_ID"
    },
    {
      id: "evidence-examination",
      type: "mandatory" as const,
      envKey: "LAMATIC_EVIDENCE_FLOW_ID"
    },
    {
      id: "solution-evaluation",
      type: "mandatory" as const,
      envKey: "LAMATIC_SOLUTION_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/detective-ai"
  }
};
