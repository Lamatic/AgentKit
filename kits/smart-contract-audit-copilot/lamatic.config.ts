export default {
  name: "Smart Contract Audit Copilot",
  description:
    "A Lamatic-powered Solidity audit assistant that reviews smart contracts for security vulnerabilities, gas optimizations, and best-practice issues.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Tanay Mitra",
    email: "tanaymitra9@gmail.com",
  },
  tags: ["solidity", "security", "audit", "web3", "developer tools"],
  steps: [
    {
      id: "smart-contract-audit",
      type: "mandatory" as const,
      envKey: "SMART_CONTRACT_AUDIT_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/smart-contract-audit-copilot",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/smart-contract-audit-copilot/apps&env=SMART_CONTRACT_AUDIT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20flow%20ID%20and%20API%20credentials%20are%20required%20to%20run%20the%20audit%20copilot.",
    docs: "https://lamatic.ai/docs",
  },
};
