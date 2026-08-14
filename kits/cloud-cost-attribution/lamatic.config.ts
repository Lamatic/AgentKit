export default {
  name: "Cloud Cost Attribution",
  description:
    "Git blame for your cloud bill. attributes spend anomalies in a FOCUS billing export to the specific deploy, config, or infra change that caused them, and returns a costed remediation plan.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["finops", "cloud-cost", "attribution", "observability", "developer-tools"],
  steps: [
    {
      id: "cost-attribution",
      type: "mandatory" as const,
      envKey: "LAMATIC_COST_ATTRIBUTION_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/cloud-cost-attribution",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fcloud-cost-attribution%2Fapps&env=LAMATIC_COST_ATTRIBUTION_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20the%20deployed%20flow%20ID.&envLink=https%3A%2F%2Flamatic.ai%2Fdocs",
    docs: "https://lamatic.ai/docs",
  },
};
