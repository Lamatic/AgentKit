export default {
  name: "Combined Keyword Search",
  description: "This flow adds keyword search (BM25 Search) to your website. It combines results from different vector databases, runs parallel searches, and returns the combined results to users.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup"],
  steps: [
    { id: "combined-keyword-search", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/combined-keyword-search",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/combined-keyword-search"
},
};
