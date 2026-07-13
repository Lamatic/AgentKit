export default {
  name: "trustguard-ai",
  description: "A multi-stage AI investigation pipeline that analyzes emails, SMS, URLs, and documents to detect fraud, phishing, and scams using Lamatic AI flows.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Tuhin Sarkar",
    email: "tuhinsarkar581@gmail.com"
  },
  tags: ["security", "investigation", "fraud-detection", "trust", "ai"],
  steps: [
    {
      id: "trustguard-ai",
      type: "mandatory",
      envKey: "TRUSTGUARD_FLOW_ID"
    }
  ],
  links: {
    deploy: "",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/trustguard-ai"
  }
};