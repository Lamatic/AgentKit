export default {
  name: "Postgres Index",
  description: "This template indexes data from a PostgresDB, periodically running a cron job to check for new files. It helps teams set up automatic data pipelines from Postgres, vectorizing and indexing data to Lamatic.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","database"],
  steps: [
    { id: "postgres-index", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/postgres-index",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/postgres-index"
},
};
