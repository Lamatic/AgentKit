export default {
  name: "Embedded Sheets",
  description: "It uses intelligent workflows to analyze resumes, match candidates to job requirements, and provide detailed hiring recommendations through a modern Next.js interface.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["embedded","startup"],
  steps: [
    {
        "id": "embedded-sheets",
        "type": "mandatory",
        "envKey": "EMBEDDED_SHEETS"
    }
],
  links: {
    "demo": "https://agent-kit-sheets.vercel.app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/embed-sheets",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fembed-sheets%2Fapps&env=EMBEDDED_SHEETS,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Sheets%20keys%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/embed/agent-kit-embed-sheets",
    "docs": "https://lamatic.ai/templates/agentkits/embed/sheets"
},
};
