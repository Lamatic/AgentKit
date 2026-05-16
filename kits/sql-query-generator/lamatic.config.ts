export default {
  name: "SQL Query Generator",
  description:
    "An AI-powered agent that converts natural language questions into optimized SQL queries. Paste your database schema, ask a question in plain English, and get production-ready SQL with explanations.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Aakriti", email: "pandey.aakriti1@gmail.com" },
  tags: ["agentic", "sql", "database", "developer-tools"],
  steps: [
    {
      id: "sql-query-generator",
      type: "mandatory",
      envKey: "SQL_QUERY_GENERATOR_FLOW_ID",
    },
  ],
  links: {
    demo: "",
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/sql-query-generator",
    deploy: "",
    docs: "",
  },
};
