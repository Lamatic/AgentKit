export default {
  name: "Founder Lens",
  description: "Powerful 7-phase agentic startup research agent. Submit a startup idea and get a brutally honest investor-grade brief built from real web data — market size, competitors, customer complaints, dead startup postmortems, and a contrarian VC take. Then chat with your analysis using RAG-powered persistent memory.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Andrew Dosumu","email":"dev@andrewdosumu.com"},
  tags: ["agentic","research","generative","chat"],
  steps: [
    {
        "id": "founder-lens-analyze",
        "type": "mandatory",
        "envKey": "FOUNDER_LENS_ANALYZE_FLOW_ID"
    },
    {
        "id": "founder-lens-chat",
        "type": "mandatory",
        "envKey": "FOUNDER_LENS_CHAT_FLOW_ID"
    }
],
  links: {
    "demo": "https://founder-lens-agentkit.vercel.app/",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/founder-lens"
},
};
