export default {
  name: "Prompt Attack Detection Agent",
  description:
    "Analyzes user prompts to detect prompt injection, jailbreak attempts, system prompt extraction, role override, and other malicious prompt attacks.",
  version: "1.0.0",
  type: "kit",
  author: {
    name: "Ujjwal Sharma",
    email: "sharmaujjwal5705@gmail.com",
  },
  tags: [
    "security",
    "llm",
    "prompt-injection",
    "jailbreak",
    "guardrails",
    "ai",
  ],
  steps: [
    {
      id: "prompt-attack-detection-agent",
      type: "mandatory",
      envKey: "LAMATIC_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Ujjwal5705/AgentKit/tree/main/kits/prompt-attack-detection-agent",
    deploy: "",
  },
};