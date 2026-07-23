export default {
  name: "RCAgent",
  description: "Automated Root Cause Analysis (RCA) pipeline for software incidents.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Shuvendu Kumar Mohapatra",
    email: "shuvendu@example.com"
  },
  tags: ["sre", "debugging", "incident-management", "operations"],
  steps: [
    {
      id: "rcagent-planner",
      type: "mandatory" as const,
      envKey: "RC_PLANNER_FLOW_ID"
    },
    {
      id: "rcagent-analyzer",
      type: "mandatory" as const,
      envKey: "RC_ANALYZER_FLOW_ID",
      prerequisiteSteps: ["rcagent-planner"]
    },
    {
      id: "rcagent-synthesizer",
      type: "mandatory" as const,
      envKey: "RC_SYNTHESIZER_FLOW_ID",
      prerequisiteSteps: ["rcagent-analyzer"]
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/rcagent",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Frcagent%2Fapps&env=LAMATIC_API_KEY,LAMATIC_API_URL,LAMATIC_PROJECT_ID,RC_PLANNER_FLOW_ID,RC_ANALYZER_FLOW_ID,RC_SYNTHESIZER_FLOW_ID"
  }
};
