export default {
  name: "Slack Ask Bot",
  description: "Delivers instant answers through Slack using the /Ask command by running a RAG retrieval on vectorized data. Provides quick answers to audiences already using Slack.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","startup","apps"],
  steps: [
    { id: "slack-ask-bot", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/slack-ask-bot",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/slack-ask-bot"
},
};
