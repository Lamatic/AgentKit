export default {
  name: "System Design Analyzer",
  description: "AI-powered system design analyzer that identifies architectural issues and provides recommendations for scalable, resilient systems.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Lamatic.ai","email":"hello@lamatic.ai"},
  tags: ["agentic reasoning","architecture analysis","design review","real-time feedback"],
  steps: [
    {
        "id": "check-your-saas",
        "type": "mandatory",
        "envKey": "LAMATIC_FLOW_ID"
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/system-design-analyzer"
},
};
