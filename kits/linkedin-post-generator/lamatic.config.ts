export default {
  name: "Linkedin Post Generator",
  description: "This flow builds an AI-powered LinkedIn post automation system. It fetches newsletter emails via API, extracts key content, and generates engaging LinkedIn posts.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["growth","generative"],
  steps: [
    { id: "linkedin-post-generator", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/linkedin-post-generator",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/linkedin-post-generator"
},
};
