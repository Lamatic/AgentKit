export default {
  name: "hackathon-project-mentor",

  description:
    "An AI-powered Hackathon Project Mentor that helps teams transform ideas into executable projects by generating feature roadmaps, system architecture, development plans, team task allocation, demo strategies, and pitch guidance.",

  version: "1.0.0",

  type: "template" as const,

  author: {
    name: "Roshan Borkar",
    email: "roshan.22310181@viit.ac.in"
  },

  tags: [
    "hackathon",
    "project-planning",
    "ai",
    "mentor",
    "productivity",
    "education",
    "startup"
  ],

  steps: [
    {
      id: "hackathon-project-mentor",
      type: "mandatory" as const
    }
  ],

  links: {
     github:
"https://github.com/Lamatic/AgentKit/tree/main/kits/hackathon-project-mentor"
  }
};