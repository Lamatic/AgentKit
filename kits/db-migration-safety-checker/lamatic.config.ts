export default {
  name: "DB Migration Safety Checker",
  description:
    "Analyzes a SQL migration for risky operations - table locks, missing indexes on new foreign keys, non-reversible drops, unsafe NOT NULL additions, and unbounded data migrations - and returns a structured safety report with severity and suggested fixes.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Soujanya Bhirade", email: "your-email@example.com" },
  tags: ["postgres", "sql", "database", "developer-tools", "code-review"],
  steps: [
    { id: "db-migration-safety-checker", type: "mandatory" as const },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/db-migration-safety-checker",
    docs: "https://lamatic.ai/docs",
  },
};
