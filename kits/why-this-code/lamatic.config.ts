export default {
  name: "Why This Code",
  description: "Explains the structural intent, origin history, PR/issue discussions, and cross-file usages of functions or classes from a single GitHub permalink.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Shubham Thakur", email: "reach.shubhamthakur@gmail.com" },
  tags: ["developer-tools", "codebase-onboarding", "git-analysis", "code-explanation", "github"],
  steps: [
    { id: "why-this-code", type: "mandatory" as const, envKey: "WHY_THIS_CODE" }
  ],
  links: {
    demo: "https://why-this-code.vercel.app",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/why-this-code",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/why-this-code/apps",
    docs: ""
  }
};
