/**
 * Configuration metadata for the DebugPilot AI kit.
 */
export default {
  name: "DebugPilot AI",
  description: "AI-powered debugging workflow for root cause analysis.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Yash Ramnani",
    email: "yashyr190@gmail.com"
  },
  tags: ["debugging", "ai", "developer-tools"],
  steps: [
    {
      id: "debugpilot-flow",
      type: "mandatory" as const,
      envKey: "DEBUGPILOT_FLOW_ID"
    }
  ],
  links: {
    demo: "https://debugpilot-ai.vercel.app",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/debugpilot-ai"
  }
};