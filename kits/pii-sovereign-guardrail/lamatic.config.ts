export default {
  name: "PII Sovereign Guardrail",
  description:
    "Enterprise middleware that masks PII before it reaches an external LLM vendor and rehydrates it in the response, so raw personal data never leaves your infrastructure.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Keerthana Sasidaran",
    email: "your-email@example.com" // TODO: replace before opening the PR
  },
  tags: [
    "security",
    "compliance",
    "pii",
    "data-sovereignty",
    "middleware",
    "enterprise"
  ],
  // Note: `outputs` (secureResponse, tokensRedacted, maskedPromptSent) are
  // defined in flows/pii-guardrail.ts — lamatic.config.ts only tracks steps.
  steps: [
    {
      id: "pii-guardrail",
      type: "mandatory" as const,
      envKey: "PII_GUARDRAIL_FLOW_ID"
    }
  ],
  links: {
    demo: "", // TODO: fill in after Vercel deploy
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/pii-sovereign-guardrail",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/pii-sovereign-guardrail/apps",
    docs: "https://lamatic.ai/docs"
  }
};
