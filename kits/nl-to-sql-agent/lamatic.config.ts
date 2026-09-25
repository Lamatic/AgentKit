export default {
  name: "Queryline",
  description: "Natural-language to safe read-only Microsoft SQL Server query generator and explainer.",
  version: "0.2.0",
  type: "kit" as const,
  author: { name: "Suraj Sonawane", email: "sonawanesuraj7@gmail.com" },
  tags: ["nl-to-sql", "mssql", "sql-generation", "agentkit"],
  steps: [
    { id: "nl-to-sql-flow", type: "mandatory" as const, envKey: "NL_TO_SQL_FLOW_ID" }
  ],
  links: {
    demo: "https://agent-kit-omega.vercel.app",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/nl-to-sql-agent",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fnl-to-sql-agent%2Fapps&env=NL_TO_SQL_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,SESSION_PASSWORD,DEMO_AUTH_ENABLED,DEMO_USERNAME,DEMO_PASSWORD&envDescription=Required:%20Lamatic%20credentials%20(LAMATIC_API_URL,%20LAMATIC_PROJECT_ID,%20LAMATIC_API_KEY),%20the%20deployed%20Queryline%20flow%20ID%20(NL_TO_SQL_FLOW_ID),%20session%20cookie%20password%20(SESSION_PASSWORD,%20min%2032%20chars),%20and%20demo%20authentication%20(DEMO_AUTH_ENABLED=true,%20DEMO_USERNAME,%20DEMO_PASSWORD).",
    docs: "https://lamatic.ai/docs/"
  }
};
