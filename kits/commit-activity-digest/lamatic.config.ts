export default {
  name: "Commit Activity Digest",
  description:
    "Paste raw git log output and get a structured engineering activity digest — what was built, technologies involved, work type breakdown, and key highlights — ready for standups, weekly reports, or stakeholder updates.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Ajay Raghav",
    email: "22BCS16075@cuchd.in",
  },
  tags: ["git", "developer-tools", "productivity", "reporting", "automation"],
  steps: [
    {
      id: "commit-activity-digest",
      type: "mandatory" as const,
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/commit-activity-digest",
    docs: "https://lamatic.ai/docs",
  },
};
