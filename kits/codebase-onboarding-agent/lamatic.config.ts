export default {
  name: "Codebase Onboarding Agent",
  description: "Analyze a GitHub repository and generate role-specific onboarding guides for developers.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Himanshu Kaushik", email: "hk9797592893@gmail.com" },
  tags: ["onboarding", "codebase", "github", "documentation", "analysis"],
  steps: [
    {
      id: "repo-analyzer",
      type: "mandatory",
      envKey: "LAMATIC_FLOW_ID"
    }
  ],
  links: {
    demo: "https://agent-kit-delta.vercel.app/",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/codebase-onboarding-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fcodebase-onboarding-agent%2Fapps&env=LAMATIC_PROJECT_API_KEY,LAMATIC_PROJECT_ENDPOINT,LAMATIC_PROJECT_ID,LAMATIC_FLOW_ID&envDescription=Your%20Lamatic%20project%20keys%20are%20required."
  }
};
