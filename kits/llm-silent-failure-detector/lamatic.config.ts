export default {
  name: "LLM Silent Failure Detector",
  description: "Detects silent LLM failures — ungrounded claims and schema violations — across a batch of logs, clustering flagged failures into named failure modes with suggested fixes.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Vaidik Dave",
    email: "davevaidik20@gmail.com"
  },
  tags: ["agentic", "observability", "evaluation"],
  steps: [
    {
      id: "agentkit-challenge",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/llm-silent-failure-detector",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fllm-silent-failure-detector%2Fapps&env=LAMATIC_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20credentials%20are%20required."
  }
};
