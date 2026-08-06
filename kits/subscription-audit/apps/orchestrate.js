export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  },
  flows: {
    "subscription-audit": {
      name: "Subscription Audit",
      workflowId: process.env.SUBSCRIPTION_AUDIT
    }
  }
};
