export default {
  name: "Firecrawl Scrapping",
  description: "This flow allows the user to start the crawling process of a webpage and send its pages to a webhook flow to commence indexing the document.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","apps"],
  steps: [
    { id: "firecrawl-scrapping", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/firecrawl-scrapping",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/firecrawl-scrapping"
},
};
