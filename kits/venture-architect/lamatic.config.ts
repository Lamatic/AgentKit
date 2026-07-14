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
    // NOTE: per the contributing guide, `deploy` is documented as a
    // kit-only field (it's meant to carry a Vercel "deploy this app" link
    // for contributions that ship an apps/ Next.js project). This
    // contribution is a `template` (flow-only, no app), so this key may
    // not be validated/used by the registry. Left here as requested —
    // remove it, or convert `type` to "kit" and add a real apps/ project,
    // if you want a functioning deploy button.
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit/tree/main/kits/venture-architect",
    docs: "https://lamatic.ai/docs/",
  },
};
