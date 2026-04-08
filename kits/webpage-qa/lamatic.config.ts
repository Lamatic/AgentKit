export default {
  name: "Webpage QA",
  description: "This AI-powered system scrapes data from a website, processes it using AI, and enables users to ask questions based on the extracted information.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","apps"],
  steps: [
    { id: "webpage-qa", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/webpage-qa",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/webpage-qa"
},
};
