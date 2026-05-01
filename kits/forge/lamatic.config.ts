export default {
  name: "Forge",
  description: "AI-powered contract and invoice generator for cross-border freelancers. Enter project details, get AI-suggested pricing, select a governing law, and walk away with a professional contract and matching invoice — ready to sign and export as PDFs.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {
    name: "Andrew Dosumu",
    email: "dev@andrewdosumu.com"
  },
  tags: ["agentic", "documents", "freelance", "generative", "legal"],
  steps: [
    {
      "id": "forge-pricing",
      "type": "mandatory",
      "envKey": "NEXT_PUBLIC_FLOW_PRICING"
    },
    {
      "id": "forge-tradeoff",
      "type": "mandatory",
      "envKey": "NEXT_PUBLIC_FLOW_TRADEOFF"
    },
    {
      "id": "forge-contract",
      "type": "mandatory",
      "envKey": "NEXT_PUBLIC_FLOW_CONTRACT"
    },
    {
      "id": "forge-invoice",
      "type": "mandatory",
      "envKey": "NEXT_PUBLIC_FLOW_INVOICE"
    }
  ],
  links: {
    "demo": "",
    "github": "https://github.com/cyber-turtle/AgentKit/tree/main/kits/forge",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/cyber-turtle/AgentKit&root-directory=kits/forge/apps"
  },
};
