export default {
  name: "Agent Bazaar",
  description: "A two-sided agent economy kit with escrow, QA judgment, settlement, and reputation tracking.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Aalok Singh", email: "aaloksingh.work@gmail.com" },
  tags: ["marketplace", "escrow", "settlement", "reputation", "multi-agent"],
  steps: [
    {
      id: "post-bounty",
      type: "mandatory" as const,
      envKey: "FLOW_POST_BOUNTY"
    },
    {
      id: "generate-bid",
      type: "mandatory" as const,
      envKey: "FLOW_GENERATE_BID"
    },
    {
      id: "execute-task",
      type: "mandatory" as const,
      envKey: "FLOW_EXECUTE_TASK"
    },
    {
      id: "qa-judge",
      type: "mandatory" as const,
      envKey: "FLOW_QA_JUDGE"
    },
    {
      id: "update-reputation",
      type: "mandatory" as const,
      envKey: "FLOW_UPDATE_REPUTATION"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-bazaar",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/aalok101singh/AgentKit&root-directory=kits%2Fagent-bazaar%2Fapps&env=SUPABASE_URL,SUPABASE_ANON_KEY,LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_API_URL&envDescription=Agent%20Bazaar%20requires%20Supabase%20and%20Lamatic%20credentials.&envLink=https://lamatic.ai"
  }
};
