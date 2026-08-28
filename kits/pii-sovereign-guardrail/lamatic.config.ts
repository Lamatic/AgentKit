export default {
    name: "PII Sovereign Guardrail",
    description:
        "Enterprise middleware that masks PII before it reaches the target LLM you're protecting against, and rehydrates it in the response.",
    version: "1.0.0",
    type: "kit" as const,
    author: {
        name: "Keerthana Sasidaran",
        email: "keerthana08sasidaran@gmail.com"
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
    // defined in flows/pii-sovereign-guardrail.ts — lamatic.config.ts only tracks steps.
    steps: [
        {
            id: "pii-sovereign-guardrail",
            type: "mandatory" as const,
            envKey: "PII_GUARDRAIL_FLOW_ID"
        }
    ],
    links: {
        demo: "https://github.com/Lamatic/AgentKit/tree/main/kits/pii-sovereign-guardrail#demo",
        github:
            "https://github.com/Lamatic/AgentKit/tree/main/kits/pii-sovereign-guardrail",
        deploy:
            "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/pii-sovereign-guardrail/apps",
        docs: "https://lamatic.ai/docs"
    }
};