export default {
  name: "Negotiation Coach",
  description: "AI-powered negotiation strategy generator. Describe your negotiation scenario (salary, vendor contract, freelance rate, rent, or any deal) and receive a complete, structured playbook: framing strategy, opening script, anticipated counter-arguments with responses, BATNA analysis, and traps to avoid.",
  version: '1.0.0',
  type: 'template' as const,
  author: { name: "Anuj Rajput", email: "anujrajput@example.com" },
  tags: ["negotiation", "productivity", "career", "startup"],
  steps: [
    { id: "negotiation-coach", type: 'mandatory' as const }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/negotiation-coach"
  },
};
