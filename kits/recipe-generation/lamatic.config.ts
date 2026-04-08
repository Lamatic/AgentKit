export default {
  name: "Recipe Generation",
  description: "This AI-powered recipe generation system processes user-provided image links, identifies food items, and generates structured output, enabling seamless analysis and recipe ideation from food images.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative"],
  steps: [
    { id: "recipe-generation", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/recipe-generation",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/recipe-generation"
},
};
