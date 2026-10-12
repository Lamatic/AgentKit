export default {
  name: "API Schema Drift Sentinel",
  description: "Detects breaking schema drift across OpenAPI specs, classifies impact severity, and generates grounded client migration guidance.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Mohamad Shafeez", email: "shafeezchappi18@gmail.com" },
  tags: ["devops", "api", "openapi", "schema-drift", "automation"],
  steps: [
    { id: "analyze-schema-drift", type: "mandatory" as const, envKey: "LAMATIC_DRIFT_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/api-schema-drift-sentinel",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/api-schema-drift-sentinel/apps"
  }
};