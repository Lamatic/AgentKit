export default {
  name: "Document Chatbot (Widget)",
  description: "A conversational AI chat widget that engages users with interactive discussions about content from a connected vector database. Easily deployable to applications and websites, ideal for user documentation, release notes, and more.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","sales"],
  steps: [
    { id: "document-chatbot-widget", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/document-chatbot-widget",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/document-chatbot-widget"
},
};
