export default {
  name: "Application Answer Memory Agent",
  description:
    "Reuses and adapts a job applicant's previous application answers to draft consistent, honest responses to new application questions.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Nicolas Brun",
    email: "nicolaabrun@gmail.com",
  },
  tags: ["job-search", "productivity", "text-generation", "career"],
  steps: [
    {
      id: "application-answer-memory-agent",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/application-answer-memory-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/application-answer-memory-agent/apps",
  },
};
