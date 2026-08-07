export default {
  name: "PR Companion",
  description:
    "Turns a git diff or list of changed files + commit messages into a clean PR title, description, reviewer checklist, and changelog entry.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Abhiram Patil",
    email: "abhirampatil2005@gmail.com",
  },
  tags: ["developer-tools", "productivity", "generative"],
  steps: [
    {
      id: "pr-flow",
      type: "mandatory" as const,
      envKey: "FLOW_PR_FLOW",
    },
  ],
  links: {
    demo: "", // fill in after you deploy on Vercel
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/pr-companion",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fpr-companion%2Fapps&env=FLOW_PR_FLOW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
    docs: "",
  },
};
