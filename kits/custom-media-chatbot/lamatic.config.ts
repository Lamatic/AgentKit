export default {
  name: "Custom Media Chatbot",
  description: "This flow builds a custom media-based chatbot that can answer questions based on your media file content in a ready-made chat interface, supporting text, JSON, HTML, and/or PDF files.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","sales"],
  steps: [
    { id: "custom-media-chatbot", type: 'mandatory' as const }
  ],
  links: {
    "deploy": "https://studio.lamatic.ai/template/custom-media-chatbot",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/custom-media-chatbot"
},
};
