export default {
  name: "AccessFix — Accessibility Remediation Copilot",
  description:
    "Turns webpage evidence into prioritized WCAG 2.2 findings, framework-aware fixes, and manual verification plans.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Aman Anurag",
    email: "amananurag.20@gmail.com",
  },
  tags: ["accessibility", "wcag", "developer-tools", "web-quality", "remediation"],
  steps: [
    {
      id: "accessibility-audit",
      type: "mandatory" as const,
      envKey: "ACCESSIBILITY_AUDIT_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/accessibility-remediation-copilot",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Faccessibility-remediation-copilot%2Fapps&env=LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_API_URL,ACCESSIBILITY_AUDIT_FLOW_ID",
    docs: "https://www.w3.org/WAI/standards-guidelines/wcag/",
  },
};
