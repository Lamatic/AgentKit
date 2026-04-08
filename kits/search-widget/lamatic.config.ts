export default {
  name: "Search Widget",
  description: "This flow builds a search widget that retrieves data from a vector database and a RAG Node, presenting the information in the ideal widget format.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support"],
  steps: [
    { id: "search-widget", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/search-widget",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/search-widget"
},
};
