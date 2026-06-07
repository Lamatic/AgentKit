export default {
  name: "Paper-to-Project Generator",
  description: "Converts research papers into practical software project roadmaps.",
  version: "1.0.0",
  type: "template" as const,

  author: {
    name: "Arush John",
    email: "arushjohn22@gmail.com",
  },

  tags: ["research", "planning", "nlp", "agent"],

  steps: [
    {
      id: "research-to-project-planner",
      type: "mandatory" as const,
    },
  ],

  links: {
    deploy: "https://studio.lamatic.ai/template/paper-to-project",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/paper-to-project",
  },
};