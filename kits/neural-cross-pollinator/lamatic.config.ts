export default {
  name: "Neural Cross-Pollinator",
  description: "Finds structural parallels between two unrelated domains and proposes a critically-evaluated cross-domain innovation.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Manha Kabir" },
  tags: ["reasoning", "cross-domain", "innovation", "agentic"],
  steps: [
    { id: "neural-cross-pollinator", type: "mandatory" as const, envKey: "NEURAL_CROSS_POLLINATOR_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/neural-cross-pollinator",
    docs: "https://lamatic.ai/docs"
  }
};