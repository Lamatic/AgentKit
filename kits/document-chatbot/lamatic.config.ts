export default {
  name: "Document Chatbot",
  description: "This flow integrates a chatbot widget into your local application, enabling users to get answers based on provided documents or media.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","sales"],
  steps: [
    { id: "document-chatbot", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/document-chatbot",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/document-chatbot"
},
};
