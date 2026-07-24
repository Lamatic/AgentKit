export default {
  name: "AI Startup Idea Validator",
  description:
    "Validates startup ideas with problem validation, competitor analysis, SWOT analysis, market opportunity assessment, and viability scoring using an LLM.",
  version: "1.0.0",
  type: "kit",

  author: {
    name: "Dheeraj Singh",
    email: "dheerajsingh60058@gmail.com"
  },

  tags: [
    "ai",
    "startup",
    "validation",
    "market-analysis",
    "llm"
  ],

  steps: [
    {
      id: "ai-startup-idea-validator",
      type: "mandatory",
      envKey: "AI_STARTUP_IDEA_VALIDATOR_FLOW_ID"
    }
  ],

  links: {
    deploy: "",
    github: "https://github.com/Lamatic/AgentKit/pull/199"
  }
};