export default {
  name: "Blog Writer Agent",
  description: "This automation generates a blog on any given topic by searching the internet for the most relevant source, then writing the blog in the user's desired tone.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative"],
  steps: [
    { id: "blog-writer-agent", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/blog-writer-agent",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/blog-writer-agent"
},
};
