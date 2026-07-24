export default {
  name: "Isolate",
  description:
    "Turn vague GitHub issues into verified reproduction evidence inside disposable sandboxes.",
  version: "0.1.0",
  type: "kit" as const,
  author: {
    name: "Dhruv Sharma",
    email: "dhruv2mars@gmail.com",
  },
  tags: ["github", "bug-reproduction", "developer-tools", "ai-agent", "sandbox"],
  steps: [
    {
      id: "isolate-reproduction",
      type: "mandatory" as const,
      envKey: "ISOLATE_REPRODUCTION_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/isolate",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fisolate%2Fapps&env=ISOLATE_REPRODUCTION_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,ISOLATE_RUNTIME_URL,ISOLATE_RUNTIME_SECRET",
    docs: "https://lamatic.ai/docs/agents/supervisor-agent",
  },
};
