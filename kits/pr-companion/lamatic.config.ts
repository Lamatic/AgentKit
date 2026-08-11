export default {
  name: "PR Companion",
  description:
    "Paste a git diff and commit messages to generate a polished PR title, description, reviewer checklist, and changelog entry.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Abhiram Patil",
    email: "abhiram.patil@mitwpu.edu.in",
  },
  tags: ["developer-tools", "productivity", "git", "documentation"],
  steps: [
    {
      id: "pr-flow",
      type: "mandatory" as const,
      envKey: "FLOW_PR_FLOW",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/pr-companion",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fpr-companion%2Fapps&env=FLOW_PR_FLOW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
  },
};