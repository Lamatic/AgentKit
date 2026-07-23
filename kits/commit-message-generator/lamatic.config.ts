export default {
  name: "Git Commit Message Generator",
  description: "Paste a git diff and instantly get a perfect conventional commit message following the Conventional Commits specification.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Aadithya Ram Durga Moravineni",
    email: "aadithya.moravineni@gmail.com"
  },
  tags: ["git", "developer-tools", "productivity", "code", "automation"],
  steps: [
    {
      id: "commit-message-generator",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/commit-message-generator",
    docs: "https://lamatic.ai/docs"
  }
};
