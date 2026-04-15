export default {
  name: "Medical Assistant",
  description: "An AI-powered medical assistant chatbot that provides general medical information, symptom checks, and health guidance through a conversational interface built with Lamatic.ai.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["medical","chatbot","assistant"],
  steps: [
    {
        "id": "medical-assistant-chat",
        "type": "mandatory",
        "envKey": "MEDICAL_ASSISTANT_CHAT"
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/medical-assistant"
},
};
