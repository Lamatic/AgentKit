export default {
  name: "Topic Insights",
  description: "This flow provides a concise topic overview and demonstrates generic text generation capabilities. Users can gain insights on any chosen subject through a succinct 150-character description.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["generative"],
  steps: [
    { id: "topic-insights", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/topic-insights",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/topic-insights"
},
};
