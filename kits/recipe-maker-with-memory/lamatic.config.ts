export default {
  name: "Recipe Maker with Memory",
  description: "This AI-powered recipe generation system retains user preferences, dietary restrictions, and past interactions to generate personalised recipes with customised cooking instructions tailored to individual needs.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative","tools"],
  steps: [
    { id: "recipe-maker-with-memory", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/recipe-maker-with-memory",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/recipe-maker-with-memory"
},
};
