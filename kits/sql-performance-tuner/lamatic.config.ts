export default {
  name: "SQL Performance Tuner",
  description:
    "A bounded SQLite experimentation agent that measures a slow query, proposes one safe optimization at a time, verifies equivalent results, and recommends only proven improvements.",
  version: "0.1.0",
  type: "kit" as const,
  author: {
    name: "Vivek Jadav",
    email: "jadavvivek0501@gmail.com",
  },
  tags: ["agentic", "sql", "sqlite", "performance", "developer-tools", "benchmarking", "agentkit-challenge"],
  steps: [
    {
      id: "sql-tuner-strategist",
      type: "mandatory" as const,
      envKey: "SQL_TUNER_STRATEGIST_FLOW_ID",
    },
    {
      id: "sql-tuner-reviewer",
      type: "mandatory" as const,
      envKey: "SQL_TUNER_REVIEWER_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/sql-performance-tuner",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsql-performance-tuner%2Fapps&env=SQL_TUNER_STRATEGIST_FLOW_ID,SQL_TUNER_REVIEWER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,SQL_TUNER_ALLOW_LIVE,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN",
  },
};
