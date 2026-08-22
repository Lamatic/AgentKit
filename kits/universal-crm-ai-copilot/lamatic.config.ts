export default {
  name: "Universal Multi-CRM AI Copilot",
  description: "AI-powered CRM lead intelligence engine that normalizes unstructured lead data into Salesforce, SAP C/4HANA, Zoho CRM, and Microsoft Dynamics 365 schemas with AI intent scoring.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Ashutosh Joshi", email: "ashutoshjoshi630@gmail.com" },
  tags: ["crm", "salesforce", "sap", "zoho", "dynamics365", "lead-scoring", "omnichannel"],
  steps: [
    {
      id: "universal-crm-ai-copilot",
      type: "mandatory" as const,
      envKey: "UNIVERSAL_CRM_AI_COPILOT"
    }
  ],
  links: {
    demo: "https://agentkit-universal-crm-copilot.vercel.app/",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/universal-crm-ai-copilot",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Funiversal-crm-ai-copilot%2Fapps&env=UNIVERSAL_CRM_AI_COPILOT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Credentials%20are%20required.",
    docs: "https://lamatic.ai/docs"
  }
};
