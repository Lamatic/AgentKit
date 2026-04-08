export default {
  name: "Vectorize Google Drive",
  description: "Vectorizes Google Drive data and loads it into a vector database. Enables fast, accurate search and RAG Flows grounded in the context of your data.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","apps"],
  steps: [
    { id: "vectorize-google-drive", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/vectorize-google-drive",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/vectorize-google-drive"
},
};
