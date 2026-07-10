export default {
  name: "Threat Model Architect",
  description:
    "Conversational security intake agent that turns a plain-English system description into structured architecture context for threat modeling.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Kushagra Tiwari" },
  tags: ["security", "agentic", "threat-modeling", "architecture"],
  steps: [
    { id: "intake", type: "mandatory" as const },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  },
};
