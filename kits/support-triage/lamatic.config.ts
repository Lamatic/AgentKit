export default {
  name: "AI Support Triage Engine",
  description: "Automated triage system that categorizes, analyzes sentiment, and drafts responses for customer support tickets.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Yash Singhal","email":"yashjee979@gmail.com","url":"https://github.com/VITianYash42"},
  tags: ["automation","assistant"],
  steps: [
    {
        "id": "your-flow-id",
        "type": "mandatory",
        "envKey": "NEXT_PUBLIC_LAMATIC_FLOW_ID"
    }
],
  links: {
    "demo": "https://agent-kit-git-feat-suppo-3f22fd-yash-singhals-projects-d43367ba.vercel.app/",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/support-triage"
},
};
