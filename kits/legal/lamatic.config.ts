export default {
  name: "Legal Assistant",
  description: "A legal assistant chatbot that summarizes legal context, provides references, and suggests next steps for informational use.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["assistant","legal","compliance"],
  steps: [
    {
        "id": "assistant-legal-advisor",
        "type": "mandatory",
        "envKey": "ASSISTANT_LEGAL_ADVISOR"
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/legal"
},
};
