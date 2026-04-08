export default {
  name: "Multi Vector Search",
  description: "This flow integrates vector search into your website, allowing you to combine results from multiple vector databases and run parallel searches. It then consolidates the results and returns them to users.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup"],
  steps: [
    { id: "multi-vector-search", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/multi-vector-search",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/multi-vector-search"
},
};
