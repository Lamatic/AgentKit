export default {
  name: "changelog-release-notes-agent",
  description: "Fetches merged GitHub pull requests for a repo and drafts customer-facing release notes grouped into Features, Fixes, Breaking Changes, and Other.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "aubaid",
    email: "aubaid.code@gmail.com"
  },
  tags: ["github", "changelog", "productivity"],
  steps: [
    {
      id: "changelog-release-notes-agent",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/changelog-release-notes-agent"
  }
};