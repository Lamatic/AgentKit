export default {
  name: "paper-to-project",
  description: "Convert research papers into practical software project roadmaps.",
  version: "1.0.0",
  type: "kit" as const,

  author: {
    name: "Arush John",
    email: "arushjohn22@gmail.com",
  },

  tags: [
    "research",
    "project-planning",
    "roadmap",
    "llm",
    "automation"
  ],

  steps: [
    {
      id: "research-to-project-planner",
      type: "mandatory" as const
    }
  ],

  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/paper-to-project",
    deploy: "",
    docs: "https://lamatic.ai/docs"
  }
};