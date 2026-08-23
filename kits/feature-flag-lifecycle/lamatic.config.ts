export default {
  name: "Feature Flag Lifecycle Manager",
  description:
    "Discovers feature flags in your codebase, evaluates their lifecycle status, and generates prioritized cleanup plans with risk assessment and deprecation timelines.",
  version: "1.0.0",
  type: "bundle" as const,
  author: { name: "Meetraj Singh", email: "meetrajsingh@example.com" },
  tags: [
    "developer-tools",
    "feature-flags",
    "technical-debt",
    "code-quality",
  ],
  steps: [
    {
      id: "flag-scan",
      type: "mandatory" as const,
    },
    {
      id: "flag-cleanup-plan",
      type: "mandatory" as const,
      prerequisiteSteps: ["flag-scan"],
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/feature-flag-lifecycle",
  },
};
