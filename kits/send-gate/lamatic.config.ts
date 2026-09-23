export default {
  name: "send-gate",
  description:
    "Pre-send gate for agent-written messages. Extracts every figure, date, link and status claim into a fixed Claims JSON, verifies each against a source of truth with an evidence class, calls an LLM judge only when something needs judging, and re-verifies the rewrite before anything reaches a customer.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Aditya Mukhopadhyay",
    email: "adul.m.2003@gmail.com"
  },
  tags: ["guardrail", "fact-check", "hallucination", "customer-messaging", "deterministic", "hinglish"],
  steps: [
    {
      id: "send-gate",
      type: "mandatory" as const,
      envKey: "SEND_GATE_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/send-gate",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/send-gate/apps",
    docs: "https://lamatic.ai/docs"
  }
};
