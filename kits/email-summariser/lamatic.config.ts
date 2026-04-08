export default {
  name: "Email Summariser",
  description: "This N8N workflow builds an AI-powered email summarization tool that automatically processes incoming emails, extracts key insights, and generates concise summaries, enabling users to quickly understand important information.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","startup"],
  steps: [
    { id: "email-summariser", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/email-summariser",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/email-summariser"
},
};
