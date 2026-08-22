export default {
  name: "flowguard",
  description:
    "The reliability layer AgentKit says it has but doesn't ship. FlowGuard generates test suites for any Lamatic flow, runs them, scores outputs with an LLM-as-judge rubric plus deterministic checks, red-teams against prompt injection, and gives a regression verdict (IMPROVED / NO CHANGE / REGRESSED) when you change a prompt or model.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Sarthak Senapati" },
  tags: [
    "evaluation",
    "reliability",
    "regression-testing",
    "llm-as-judge",
    "red-team",
    "agent-testing",
  ],
  steps: [
    {
      id: "flowguard-suite-generator",
      type: "mandatory",
      envKey: "FLOW_ID_SUITE_GENERATOR",
    },
    {
      id: "flowguard-judge",
      type: "mandatory",
      envKey: "FLOW_ID_JUDGE",
    },
    {
      id: "flowguard-report-summarizer",
      type: "mandatory",
      envKey: "FLOW_ID_REPORT_SUMMARIZER",
    },
    {
      id: "flowguard-red-team-generator",
      type: "optional",
      envKey: "FLOW_ID_RED_TEAM_GENERATOR",
    },
  ],
  links: {},
};
