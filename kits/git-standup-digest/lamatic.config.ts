export default {
  name: "Git Standup Digest",
  description: "Fetches GitHub repository activity (commits, merged PRs, open issues) over a configurable time window and synthesizes it into a human-readable daily standup digest — replacing manual log scanning with an AI-written morning briefing.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Sai Ashok Karadi", email: "saiashok103@gmail.com" },
  tags: ["developer-tools", "github", "productivity", "summarization", "automation"],
  steps: [
    {
      id: "git-standup-digest",
      type: "mandatory" as const,
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/git-standup-digest",
    docs: "https://lamatic.ai/docs",
  },
};
