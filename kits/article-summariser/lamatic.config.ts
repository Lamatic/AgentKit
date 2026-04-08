export default {
  name: "Article Summariser",
  description: "This workflow automates summarizing articles. It takes URLs, extracts content using Firecrawl, and generates concise summaries using an LLM, making it easier to quickly understand key points of long articles.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative","support"],
  steps: [
    { id: "article-summariser", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/article-summariser",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/article-summariser"
},
};
