export default {
  name: "Context-Aware Blocker",
  description: "A production-grade AI content blocker for productivity. Features a Next.js backend for secure Lamatic API communication and a Chrome Extension frontend for real-time contextual blocking.",
  version: '1.0.0',
  type: 'kit' as const,
  author: { name: "Abdul Maajith", email: "maajith9127@gmail.com" },
  tags: ["agentic", "productivity", "content-blocking", "chrome-extension", "nextjs"],
  steps: [
    {
      id: "content-classification",
      type: "mandatory" as const,
      envKey: "CONTENT_CLASSIFICATION_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/context-aware-blocker",
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit%2Ftree%2Fmain%2Fkits%2Fcontext-aware-blocker%2Fapps&env=LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_API_URL,CONTENT_CLASSIFICATION_FLOW_ID&root-directory=kits/context-aware-blocker/apps"
  },
};
