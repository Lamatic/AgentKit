export default {
  name: "AccessLens - Permission Drift Auditor",
  description:
    "Audits authorization drift by comparing intended access policies against current permissions and identifying evidence-based differences.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Sagnik Sengupta",
    email: "sagniksenguptaa@gmail.com"
  },
  tags: [
    "security",
    "access-control",
    "permission-drift",
    "iam",
    "rbac",
    "audit"
  ],
  steps: [
    {
      id: "accesslens-permission-drift-auditor",
      type: "mandatory" as const
    }
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/accesslens-permission-drift-auditor"
  }
};