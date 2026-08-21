export default {
  name: "DevDiary",
  description:
    "AI work journal for developers. Every GitHub push is summarized from the actual diffs (not the commit messages) into a clean journal entry, indexed into a vector store, and made queryable through a RAG chat — so 'what did I work on last month?' finally has an answer.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Chirag Baldia", email: "chiragbaldia@gmail.com" },
  tags: ["agentic", "rag", "developer-tools", "github", "productivity"],
  steps: [
    {
      id: "devdiary-log",
      type: "mandatory" as const,
      envKey: "DEVDIARY_LOG_FLOW_ID"
    },
    {
      id: "devdiary-ask",
      type: "mandatory" as const,
      envKey: "DEVDIARY_ASK_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/devdiary",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits/devdiary/apps"
  }
};
