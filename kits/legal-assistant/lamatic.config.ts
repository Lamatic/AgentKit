export default {
  name: "Legal Assistant",
  description: "Ask legal research questions against your Lamatic-connected legal corpus and get an informational answer with citations, next steps, and a standing disclaimer.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"jasperan","email":"ignacio.m.martinez@oracle.com"},
  tags: ["assistant","legal","rag"],
  steps: [
    {
        "id": "legal-rag-chatbot",
        "type": "mandatory",
        "envKey": "ASSISTANT_LEGAL_CHATBOT"
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/legal-assistant",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/assistant/legal-assistant&env=ASSISTANT_LEGAL_CHATBOT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY"
},
};
