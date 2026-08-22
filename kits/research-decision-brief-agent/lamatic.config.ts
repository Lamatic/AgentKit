export default {
  name: "Research Decision Brief Agent",
  description:
    "Converts research-paper evidence into actionable decision briefs with options, tradeoffs, risks, and confidence.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Umar",
    email: "umar.workit@gmail.com"
  },
  tags: ["research", "decision", "analysis", "productivity"],
  steps: [{ id: "research-decision-brief-agent", type: "mandatory" as const }],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/research-decision-brief-agent"
  }
};
