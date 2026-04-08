export default {
  name: "Vectorise S3",
  description: "This flow vectorizes S3 data and loads it into a vector database, enabling fast, accurate search and RAG flows grounded in the context of your data.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","apps"],
  steps: [
    { id: "vectorise-s3", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/vectorise-s3",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/vectorise-s3"
},
};
