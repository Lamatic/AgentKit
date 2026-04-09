export default {
  name: "Hiring Copilot Agent",
  description: "AI-powered recruiter assistant that screens candidates, analyzes resumes, and suggests hiring decisions reducing manual efforts.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Anurag Bhoite"},
  tags: ["agentic","hiring","resume ai"],
  steps: [
    {
        "id": "first-flow",
        "type": "mandatory",
        "envKey": "AGENTIC_FIRST_FLOW"
    }
],
  links: {
    "demo": "https://hiring-copilot-agent.vercel.app"
},
};
