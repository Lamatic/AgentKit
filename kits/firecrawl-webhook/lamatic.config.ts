export default {
  name: "Firecrawl Webhook",
  description: "This flow fetches pages from a crawler API, extracts only the page contents, and prepares to index them in a vector database, effectively indexing all the pages.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["apps","startup"],
  steps: [
    { id: "firecrawl-webhook", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/firecrawl-webhook",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/firecrawl-webhook"
},
};
