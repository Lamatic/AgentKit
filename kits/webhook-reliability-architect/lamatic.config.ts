export default {
  name: "Webhook Reliability Architect",
  description:
    "Designs an evidence-based idempotency contract, retry policy, dead-letter workflow, observability plan, and failure-injection test matrix for webhook systems.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Amar Kumar",
    email: "amarkumar05092003@gmail.com",
  },
  tags: [
    "developer-tools",
    "webhooks",
    "reliability",
    "idempotency",
    "distributed-systems",
  ],
  steps: [
    {
      id: "webhook-reliability-architect",
      type: "mandatory" as const,
      envKey: "WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/webhook-reliability-architect",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fwebhook-reliability-architect%2Fapps&env=WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=The%20deployed%20Lamatic%20flow%20ID%20and%20project%20credentials%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
