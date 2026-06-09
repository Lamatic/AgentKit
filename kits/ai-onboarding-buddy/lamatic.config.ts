export default {
  name: "AI Onboarding Buddy",
  description: "A generative employee-enablement agent that analyzes new hire skill gaps and constructs a tailored 30/60/90-day onboarding plan alongside manager welcome messages.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Anshuk Jirli", email: "geeked.anshuk666@gmail.com" },
  tags: ["generative", "support"],
  steps: [
    { id: "ai-onboarding-buddy", type: "mandatory" as const }
  ],
  links: {
    deploy: "https://studio.lamatic.ai/template/ai-onboarding-buddy",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/ai-onboarding-buddy"
  }
};
