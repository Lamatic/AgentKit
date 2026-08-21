export default {
  name: "ai-experiment-planner",
  description: "AI-powered assistant that helps developers and students plan end-to-end AI/ML projects with recommended tech stack, datasets, models, evaluation metrics, and deployment roadmap.",
  version: "1.0.0",
  type: "kit" as const,

  author: {
    name: "Vedika Jawaria"
  },

  tags: [
    "ai",
    "machine-learning",
    "deep-learning",
    "project-planning",
    "developer-tools"
  ],

  steps: [
    {
      id: "ai-experiment-planner",
      type: "mandatory",
      envKey: "LAMATIC_FLOW_ID"
    }
  ],

  links: {},
};