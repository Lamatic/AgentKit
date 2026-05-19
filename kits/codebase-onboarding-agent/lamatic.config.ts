export default {
  name: "Codebase Onboarding Agent",
  description: "AI-powered codebase onboarding for new developers. Analyzes a repository and generates tailored onboarding documentation based on the developer's role.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Himanshu Kaushik",
    email: "hk9797592893@gmail.com"
  },
  tags: ["codebase", "onboarding", "github", "agent", "documentation"],
  steps: [
    {
      id: "repo-analyzer",
      type: "mandatory",
      envKey: "LAMATIC_FLOW_ID"
    }
  ],
  links: {
    demo: "https://agent-kit-delta.vercel.app/",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/HIMANSHU6001/AgentKit&root-directory=kits/codebase-onboarding-agent/apps&env=LAMATIC_PROJECT_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_FLOW_ID,LAMATIC_PROJECT_ENDPOINT&envDescription=Your%20Lamatic%20Codebase%20Onboarding%20Agent%20keys%20are%20required.",
    github: "https://github.com/HIMANSHU6001/AgentKit/tree/main/kits/codebase-onboarding-agent"
  }
};
