export default {
  name: "Vectorise Link",
  description: "This automation allows you to scrape webpage content, vectorize it, and store it in a context store. The vectorized content can then be used to chat with and answer questions about the webpage.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","apps"],
  steps: [
    { id: "vectorise-link", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/vectorise-link",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/vectorise-link"
},
};
