export default {
  name: "Introduction to RAG",
  description: "This flow acts as an introduction to RAG, where you can ask a query based on a given text and get your answers from that specific knowledge base.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","startup"],
  steps: [
    { id: "introduction-to-rag", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/introduction-to-rag",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/introduction-to-rag"
},
};
