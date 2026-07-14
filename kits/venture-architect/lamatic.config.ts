export default {
  name: "VentureArchitect",
  description:
    "AI Venture Architecture Agent that transforms startup ideas into complete venture blueprints including business strategy, technical architecture, product roadmap, market analysis, and investor-ready documentation.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Shakti Sourav Swain",
    email: "Shaktiswain809@gmail.com",
  },
  tags: [
    "ai",
    "agent",
    "startup",
    "entrepreneurship",
    "product",
    "architecture",
    "planning",
    "business",
  ],
  steps: [
    { id: "venture-architect", type: "mandatory" as const },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/venture-architect",
    docs: "https://lamatic.ai/docs/",
  },
};
