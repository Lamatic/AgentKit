export default {
  name: "Vectorize Google Sheets",
  description: "This flow vectorizes Google Sheets data and loads it into a vector database, enabling fast, accurate search and RAG flows grounded in the context of your data.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","apps"],
  steps: [
    { id: "vectorize-google-sheets", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/vectorize-google-sheets",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/vectorize-google-sheets"
},
};
