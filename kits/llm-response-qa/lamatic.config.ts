export default {
  name: "LLM-Response-QA",
  description:
    "An AI-powered workflow that evaluates LLM-generated responses for accuracy, completeness, relevance, hallucination risk, and overall quality before presenting them to end users.",
  version: "1.0.0",
  type: "kit",
  author: {
    name: "Ramyatha Balaraju",
    email: "ramyathaaa@gmail.com",
  },
  tags: [
    "ai",
    "llm",
    "qa",
    "evaluation",
    "openrouter",
    "agentkit",
    "generative-ai",
    "quality-assurance"
  ],
  steps: [
    {
      id: "llm-response-qa",
      type: "mandatory",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/llm-response-qa",
    deploy: "",
  },
};
