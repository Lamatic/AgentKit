export default {
  name: "API Breaking Change Detector",
  description: "Automated workflow that detects breaking API schema changes between v1 and v2 endpoints and generates migration guides.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Sabeer H",
    email: "sabeer.h4774@gmail.com"
  },
  tags: ["api", "breaking-changes", "gemini", "developer-tools"],
  steps: [
    {
      id: "api-breaking-change-detector",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/api-breaking-change-detector"
  }
};