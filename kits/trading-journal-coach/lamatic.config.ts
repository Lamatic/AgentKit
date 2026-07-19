export default {
  name: "Trading Journal Coach",
  description:
    "Upload your trade log and get an honest behavioural coaching brief — revenge trading, size creep, holding losers vs cutting winners — computed from your own executed trades. Then chat with your history and get a weekly discipline report on Slack.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Vaibhav Yadav", email: "vaibhavyadav.977@gmail.com" },
  tags: ["agentic", "finance", "coaching", "chat"],
  steps: [
    { id: "analyze-journal", type: "mandatory", envKey: "ANALYZE_JOURNAL_FLOW_ID" },
    { id: "chat-with-journal", type: "mandatory", envKey: "CHAT_WITH_JOURNAL_FLOW_ID" },
    { id: "weekly-discipline-report", type: "mandatory", envKey: "WEEKLY_DISCIPLINE_REPORT_FLOW_ID" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/trading-journal-coach",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Ftrading-journal-coach%2Fapps&env=ANALYZE_JOURNAL_FLOW_ID,CHAT_WITH_JOURNAL_FLOW_ID,WEEKLY_DISCIPLINE_REPORT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
    docs: "https://lamatic.ai/docs",
  },
};
