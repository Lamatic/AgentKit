export default {
  name: "Index GitHub Actions",
  description: "Vectorizes GitHub Actions data and loads it into a vector database. Enables fast, accurate search and RAG Flows using the contextual data.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup"],
  steps: [
    { id: "index-github-actions", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/index-github-actions",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/index-github-actions"
},
};
