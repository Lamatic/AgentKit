export default {
  name: "API Breaking Change Detector",
  description:
    "Paste your existing and updated API schemas to instantly analyze breaking changes and generate developer migration guides.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Porus", email: "porus@example.com" },
  tags: ["api", "breaking-changes", "migration", "schema-analysis"],
  steps: [
    {
      id: "api-breaking-change-detector",
      type: "mandatory",
      envKey: "API_BREAKING_CHANGE_DETECTOR",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/api-breaking-change-detector",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fapi-breaking-change-detector%2Fapps&env=API_BREAKING_CHANGE_DETECTOR,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20Breaking%20Change%20Detector%20keys%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
