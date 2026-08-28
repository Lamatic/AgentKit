export default {
  name: "ChangeGraph",

  description:
    "Pre-deployment semantic change intelligence, deterministic risk scoring, and safe release planning for Lamatic workflows.",

  version: "1.0.0",

  type: "kit" as const,

  author: {
    name: "Mayank Verma",
    email: "mayankverma210405@gmail.com",
  },

  tags: [
    "developer-tools",
    "deployment",
    "reliability",
    "testing",
    "observability",
  ],

  steps: [
    {
      id: "analyze-change-impact",
      type: "mandatory" as const,
      envKey: "6c1feb26-1cfb-4a43-b56d-7f792fffdd87",
    },
    {
      id: "generate-release-plan",
      type: "mandatory" as const,
      envKey: "883f0526-5d88-44a1-875a-e0a95a5a37c9",
    },
  ],

    links: {
    demo:
      "https://changegraph-release-intelligence.vercel.app",

    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/changegraph-release-intelligence",

    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fchangegraph-release-intelligence%2Fapps&env=LAMATIC_API_KEY%2CLAMATIC_PROJECT_ID%2CLAMATIC_API_URL%2CANALYZE_CHANGE_IMPACT_FLOW_ID%2CGENERATE_RELEASE_PLAN_FLOW_ID",
  },
};
