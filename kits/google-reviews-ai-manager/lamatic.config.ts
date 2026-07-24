export default {
  name: "Google Reviews AI Manager",
  description: "A Next.js app that manages and replies to real Google Reviews using AI and Google My Business API.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "AgentKit Contributor", email: "contributor@example.com" },
  tags: ["agentic", "social", "support"],
  steps: [
    { id: "my-first-flow", type: "mandatory" as const, envKey: "LAMATIC_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/google-reviews-ai-manager",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fgoogle-reviews-ai-manager%2Fapps&env=GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET,LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_API_URL,LAMATIC_FLOW_ID"
  }
};
