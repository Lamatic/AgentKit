export default {
  name: "Enterprise Vendor Due Diligence",
  description:
    "Evidence-backed vendor due diligence for procurement: research company, security, and commercial risk, validate claims, and return Approve / Approve with conditions / Pause / Reject with an executive assessment.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Sreeram A M",
    email: "sreeram132003@gmail.com",
  },
  tags: [
    "procurement",
    "vendor-risk",
    "security",
    "compliance",
    "enterprise",
    "agentic",
  ],
  steps: [
    {
      id: "enterprise-vendor-due-diligence",
      type: "mandatory" as const,
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/enterprise-vendor-due-diligence",
  },
};
