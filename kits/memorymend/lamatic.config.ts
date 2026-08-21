export default {
  name: "MemoryMend",
  description: "Evidence-backed memory integrity and repair planning for long-lived AI agents. Detect contradictions, stale and duplicate memories, provenance risks, and instruction-like memory poisoning before proposing controlled repairs.",
  version: "0.1.0",
  type: "kit" as const,
  author: {
    name: "Darshan Gowda C",
    email: "darshangowdac2005@gmail.com"
  },
  tags: ["agentic", "memory", "security", "provenance", "reliability"],
  steps: [
    {
      id: "memorymend",
      type: "mandatory",
      envKey: "MEMORYMEND_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Darshangowdac2005/AgentKit/tree/feat/memorymend-agent-memory-integrity/kits/memorymend"
  }
};
