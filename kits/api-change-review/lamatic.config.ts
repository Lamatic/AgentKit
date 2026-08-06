export default {
  name: "API Change Review",
  description:
    "Diffs two OpenAPI specs, classifies every change by consumer impact, and drafts migration notes and a changelog entry.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "1Kyryll", email: "kyryllupwork@gmail.com" },
  tags: ["api", "openapi", "developer-tools", "code-review"],
  steps: [
    {
      // Matches flows/api-review-review.ts — the flow's slug in Lamatic Studio.
      id: "api-review-review",
      type: "mandatory" as const,
      envKey: "LAMATIC_API_CHANGE_REVIEW_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/api-change-review",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fapi-change-review%2Fapps&env=LAMATIC_API_CHANGE_REVIEW_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20the%20deployed%20flow%20ID.&envLink=https%3A%2F%2Flamatic.ai%2Fdocs",
    docs: "https://lamatic.ai/docs",
  },
};
