export default {
  name: "Hiring Agent",
  description: "This template allows you to analyse an input resume and gives detailed analysis of selection/rejection",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["growth"],
  steps: [
    { id: "hiring-agent", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/hiring-agent",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/hiring-agent"
},
};
