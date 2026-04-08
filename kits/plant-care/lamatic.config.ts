export default {
  name: "Plant Care",
  description: "This AI-powered plant identification system processes user-provided image links, identifies plants, and generates structured output, enabling seamless analysis and data extraction from images.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative"],
  steps: [
    { id: "plant-care", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/plant-care",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/plant-care"
},
};
