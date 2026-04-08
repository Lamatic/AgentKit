export default {
  name: "Get Started",
  description: "This flow introduces Lamatic AI and demonstrates how to fetch output from an LLM node. It provides a basic example of integrating an LLM into an automation workflow.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup"],
  steps: [
    { id: "get-started", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/get-started",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/get-started"
},
};
