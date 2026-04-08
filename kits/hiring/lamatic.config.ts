export default {
  name: "Hiring Automation",
  description: "It uses intelligent workflows to analyze resumes, match candidates to job requirements, and provide detailed hiring recommendations through a modern Next.js interface.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["automation","apps","startup"],
  steps: [
    {
        "id": "automation-hiring",
        "type": "mandatory",
        "envKey": "AUTOMATION_HIRING"
    }
],
  links: {
    "demo": "https://agent-kit-hiring.vercel.app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/hiring",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fhiring%2Fapps&env=AUTOMATION_HIRING,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Config%20Hiring%20key%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/automation/agent-kit-hiring",
    "docs": "https://lamatic.ai/templates/agentkits/automation/agent-kit-hiring"
},
};
