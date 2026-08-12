export default {
  name: "TraceShift",
  description:
    "Mines successful Lamatic production traces to find repeated execution paths, quantify latency and model cost, and produce evidence-backed optimization proposals for human review.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Bhavya Bafna",
    email: "bhavyabafnaa@users.noreply.github.com",
  },
  tags: ["observability", "optimization", "traces", "developer-tools"],
  steps: [
    {
      id: "trace-shift-advisor",
      type: "mandatory" as const,
      envKey: "TRACESHIFT_ADVISOR_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/traceshift",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/traceshift/apps",
  },
};
