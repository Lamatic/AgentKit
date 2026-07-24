export default {
  name: "LostFound Match Agent",
  description:
    "AI workflow that compares lost item reports with found item reports and returns a match score, reasoning, verification questions, and next action.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Rewant Anand",
    email: "rewant23429@iiitd.ac.in",
  },
  tags: ["lost-and-found", "matching", "workflow", "automation", "json"],
  steps: [
    {
      id: "lostfound-match-agent",
      type: "mandatory" as const,
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/lostfound-match-agent",
  },
};
