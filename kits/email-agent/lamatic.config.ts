export default {
  name: "Email Agent",
  description: "An AI-powered email assistant that verifies inbound emails (for intent, urgency, authenticity) and drafts context-aware professional replies.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Krishna Khurana", email: "krishna@lamatic.ai" },
  tags: ["email", "verification", "reply", "support"],
  steps: [
    {
      id: "email-verifier",
      type: "mandatory" as const,
      envKey: "EMAIL_VERIFIER_FLOW_ID",
    },
    {
      id: "email-replier",
      type: "mandatory" as const,
      envKey: "EMAIL_REPLIER_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/email-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Femail-agent%2Fapps&env=EMAIL_VERIFIER_FLOW_ID,EMAIL_REPLIER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Email%20Agent%20keys%20are%20required.&envLink=https://lamatic.ai/docs",
  },
};
