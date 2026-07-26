export default {
  name: "CaseCraft",
  description:
    "Index debate sources and build a citation-backed brief with key claims, clash points, agreed points, themes, and per-source summaries.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "ravijaanthony", email: "ravijaanthony@gmail.com" },
  tags: ["debate", "research", "analysis", "synthesis"],
  steps: [
    {
      id: "index-articles",
      type: "mandatory" as const,
      envKey: "INDEX_ARTICLES_FLOW_ID"
    },
    {
      id: "synthesize-digest",
      type: "mandatory" as const,
      envKey: "SYNTHESIZE_DIGEST_FLOW_ID",
      prerequisiteSteps: ["index-articles"]
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/reading-list-digest",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Freading-list-digest%2Fapps&env=INDEX_ARTICLES_FLOW_ID,SYNTHESIZE_DIGEST_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY"
  }
};
