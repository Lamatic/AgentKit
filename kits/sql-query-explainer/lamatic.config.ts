export default {
  name: "SQL Query Explainer",
  description: "This workflow accepts any SQL query (SELECT, INSERT, UPDATE, DELETE, CTEs, window functions, etc.) and returns a plain-English explanation, a clause-by-clause breakdown, a list of potential performance issues, and concrete optimisation suggestions. It is useful for developers learning SQL, onboarding engineers reading unfamiliar queries, and anyone who needs to quickly understand what a query does without running it.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Saad Mohammad","email":"saadmd723@gmail.com"},
  tags: ["developer-tools","sql","generative","analytics"],
  steps: [
    { id: "sql-query-explainer", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/sql-query-explainer",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/sql-query-explainer"
  },
};
