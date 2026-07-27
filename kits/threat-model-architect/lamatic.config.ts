export default {
  name: "Threat Model Architect",
  description:
    "Multi-stage security agent that turns a system description into architecture analysis, STRIDE threats, DREAD-ranked risks, and an actionable remediation roadmap.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Kushagra Tiwari" },
  tags: ["security", "agentic", "threat-modeling", "stride", "dread"],
  steps: [
    { id: "intake", type: "mandatory" as const, envKey: "INTAKE_FLOW_ID" },
    {
      id: "decompose-architecture",
      type: "mandatory" as const,
      envKey: "DECOMPOSE_FLOW_ID",
      prerequisiteSteps: ["intake"],
    },
    {
      id: "stride-analyze",
      type: "mandatory" as const,
      envKey: "STRIDE_FLOW_ID",
      prerequisiteSteps: ["decompose-architecture"],
    },
    {
      id: "threat-research",
      type: "mandatory" as const,
      envKey: "RESEARCH_FLOW_ID",
      prerequisiteSteps: ["stride-analyze"],
    },
    {
      id: "dread-prioritize",
      type: "mandatory" as const,
      envKey: "DREAD_FLOW_ID",
      prerequisiteSteps: ["threat-research"],
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fthreat-model-architect%2Fapps&env=LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,INTAKE_FLOW_ID,DECOMPOSE_FLOW_ID,STRIDE_FLOW_ID,RESEARCH_FLOW_ID,DREAD_FLOW_ID,LAMATIC_TIMEOUT_MS,THREAT_MODEL_ACCESS_TOKEN,THREAT_MODEL_RATE_LIMIT,THREAT_MODEL_RATE_WINDOW_MS",
  },
};
