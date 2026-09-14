export default {
  name: "AI Database Release Planner",
  description:
    "A four-stage AI pipeline that analyzes SQL database migrations and produces a production release report covering intent, PostgreSQL runtime behavior, deployment strategy, and rollback guidance.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Tiya Nahar", email: "ar0944518@gmail.com" },
  tags: ["agentic", "database", "devops", "postgresql", "release-management"],
  steps: [
    {
      id: "production-database-release-planner",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/production-database-release-planner",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fproduction-database-release-planner%2Fapps&env=LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,LAMATIC_FLOW_ID&envDescription=Your%20Lamatic%20project%20keys%20and%20deployed%20flow%20ID%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
