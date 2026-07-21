export default {
  name: "Commit & PR Generator",
  description: "Turns a raw git diff into a Conventional Commits message and a ready-to-paste pull request description (Summary, Changes, Testing) using a single LLM flow.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Ayaz Saifi",
    email: "ayazzssaifi@gmail.com"
  },
  tags: ["developer-tools", "git", "generative"],
  steps: [
    { id: "commit-pr-generator", type: "mandatory" as const }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/commit-pr-generator"
  }
};
