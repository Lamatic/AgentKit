export default {
  name: "bugpilot-debugger",
  description:
    "AI-powered debugging assistant that analyzes code errors, provides root cause analysis, and offers step-by-step fixes for developers.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Aman Kumar",
    email: "amankrit61@gmail.com",
  },
  tags: [
    "debugging",
    "code-analysis",
    "error-resolution",
    "developer-tools",
    "ai-assistant",
  ],
  steps: [
    {
      id: "bugpilot-debugger",
      type: "mandatory" as const,
      envKey: "BUGPILOT_DEBUGGER_FLOW_ID",
    },
  ],
  links: {
    demo: "https://agent-kit-ashy.vercel.app/",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/bugpilot-ai",
    deploy: "https://agent-kit-ashy.vercel.app/",
    docs: "https://lamatic.ai/docs/workflows",
  },
};
