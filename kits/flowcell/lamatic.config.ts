export default {
  name: "Flowcell",
  description:
    "Drop-in TypeScript client that adds retry, circuit breaking, model fallback, and a runaway-call guard around any Lamatic flow call — without touching the flow graph.",
  version: "1.0.0",
  type: "bundle" as const,
  author: { name: "Krish Anand", email: "Krishanand974@gmail.com" },
  tags: ["reliability", "resilience", "cost"],
  steps: [
    { id: "demo-primary", type: "mandatory" as const },
    { id: "demo-fallback", type: "mandatory" as const },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/flowcell",
  },
};
