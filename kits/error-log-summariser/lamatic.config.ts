export default {
  name: "Error Log Summariser",
  description:
    "Turns raw error logs and stack traces into privacy-safe support handoffs with redactions, impact summaries, affected components, escalation questions, and next actions.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Manas Mahato", email: "manasmahato.2004@gmail.com" },
  tags: ["observability", "support", "security", "developer-tools"],
  steps: [
    { id: "error-log-summariser", type: "mandatory" as const },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/error-log-summariser",
  },
};
