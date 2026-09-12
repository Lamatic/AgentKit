export default {
  name: "Freelance Proposal Tailor",
  description: "AI agent that writes high-converting, tailored freelance proposals based on job descriptions and user skills.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Abishek", email: "abishek@example.com" },
  tags: ["generative", "freelance", "proposal"],
  steps: [
    { id: "proposal-flow", type: "mandatory" as const, envKey: "LAMATIC_WORKFLOW_ID" }
  ],
  links: {
    github: "https://github.com/HeyyAbishek/AgentKit/tree/main/kits/proposal-tailor",
    deploy: "https://apps-nine-beryl.vercel.app/"
  }
};