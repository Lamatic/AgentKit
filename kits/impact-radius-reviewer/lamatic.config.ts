export default {
  name: "Impact Radius Reviewer",
  description:
    "Paste a `diffcontext compile --json` payload plus a PR diff to get a reviewer brief: what will break (callers + overriding subclasses), test-coverage gaps, and the blind spots the static analysis cannot see.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Trakshan Mishra",
    email: "trakshanmishra477@gmail.com",
  },
  tags: ["developer-tools", "code-review", "static-analysis", "git"],
  steps: [
    {
      id: "impact-review",
      type: "mandatory" as const,
      envKey: "FLOW_IMPACT_REVIEW",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/impact-radius-reviewer",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fimpact-radius-reviewer%2Fapps&env=FLOW_IMPACT_REVIEW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
  },
};
