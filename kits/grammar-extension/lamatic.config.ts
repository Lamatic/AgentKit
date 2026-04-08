export default {
  name: "Grammar Assistant",
  description: "It allows you to select any text on any webpage and get real-time grammar corrections and suggestions through an elegant side panel interface.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["assistant","generative","tools"],
  steps: [
    {
        "id": "assistant-grammer-correction",
        "type": "mandatory",
        "envKey": "ASSISTANT_GRAMMAR_CORRECTION"
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/grammar-extension"
},
};
