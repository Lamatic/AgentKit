export default {
  name: "Advertisement Poster Generation",
  description: "This intakes an image to provide analysis and advertisement poster as the output using multimodal and image generation models",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative"],
  steps: [
    { id: "advertisement-poster-generation", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/advertisement-poster-generation",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/advertisement-poster-generation"
},
};
