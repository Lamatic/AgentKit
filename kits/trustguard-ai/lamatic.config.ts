export default {
  name: "trustguard-ai",
  description: "",
  version: "1.0.0",
  type: "kit",
  author: {
    "name": "Tuhin Sarkar",
    "email": "tuhinsarkar581@gmail.com"
  },
  tags: ["security", "investigation", "fraud-detection", "trust", "ai"],
  steps: [
    {
      "id": "trustguard-ai",
      "type": "mandatory",
      "envKey": "TRUSTGUARD_FLOW_ID"
    }
  ],
  links: {
    "deploy": "",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/trustguard-ai"
  }
};