export default {
  name: "Execute Flow",
  description: "This flow introduces the execute flow function, which allows executing another flow and passing required variables.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup"],
  steps: [
    { id: "execute-flow", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/execute-flow",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/execute-flow"
},
};
