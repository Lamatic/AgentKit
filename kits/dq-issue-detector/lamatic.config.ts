export default {
  name: "Data Quality Issue Detector",
  type: "kit",
  author: "Donal Siby",
  description: "Detects missing values, duplicates, outliers, invalid entries, and category inconsistencies in tabular datasets.",
  tags: ["data-quality", "analytics", "csv", "excel", "llm", "agent"],
  links: {
    github: "https://github.com/<your-username>/AgentKit/tree/main/kits/dq-issue-detector",
    deploy: "https://vercel.com/new?root-directory=kits/dq-issue-detector/apps"
  },
  steps: [
    {
      id: "data-quality-agent",
      title: "Data Quality Detector",
      type: "flow",
      envKey: "FLOW_ID"
    }
  ]
}