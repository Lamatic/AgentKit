export default {
  name: "Weekly Routine Coach",
  description:
    "Turns a free-text brain-dump of goals and commitments into a balanced weekly routine on a 30-minute grid. Re-plans when something slips. Bilingual PT-BR / EN.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Igor Michalski", email: "igorroberto2312@gmail.com" },
  tags: ["agentic", "productivity", "personal", "scheduling", "bilingual"],
  steps: [
    { id: "intake", type: "mandatory" as const, envKey: "INTAKE_FLOW_ID" },
    {
      id: "generate-week",
      type: "mandatory" as const,
      envKey: "GENERATE_WEEK_FLOW_ID",
    },
    { id: "replan", type: "mandatory" as const, envKey: "REPLAN_FLOW_ID" },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/weekly-routine-coach",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fweekly-routine-coach%2Fapps&env=INTAKE_FLOW_ID,GENERATE_WEEK_FLOW_ID,REPLAN_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
  },
};
