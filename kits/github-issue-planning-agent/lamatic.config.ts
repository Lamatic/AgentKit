export default {
  name: "IssuePilot Planning Flow",

  description:
    "Transforms GitHub issues into structured engineering implementation plans using a multi-agent workflow with planning, engineering review, and markdown formatting.",

  version: "1.0.0",

  type: "template",

  author: {
    name: "Aman Kumar Singh",
    email: "amansingh7997@gmail.com"
  },

  tags: [
    "github",
    "planning",
    "engineering",
    "technical-lead",
    "issue-analysis",
    "multi-agent",
    "sprint-planning"
  ],

  steps: [
    {
      id: "issue-pilot-planning-flow",
      type: "mandatory"
    }
  ],

  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/github-issue-planning-agent"
  }
};