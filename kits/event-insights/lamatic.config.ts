export default {
  name: "Event Insights",
  description: "This AI-powered event data processing system collects event data, passes it to a text generation node, and enables users to ask questions to receive AI-generated insights, enabling efficient event analysis and real-time information retrieval.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["growth","startup"],
  steps: [
    { id: "event-insights", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/event-insights",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/event-insights"
},
};
