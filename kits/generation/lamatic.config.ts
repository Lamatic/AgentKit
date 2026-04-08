export default {
  name: "Generative AI",
  description: "Generate text, JSON, or images intelligently based on the given context.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["agentic","generative"],
  steps: [
    {
        "id": "agentic-generate-content",
        "type": "mandatory",
        "envKey": "AGENTIC_GENERATE_CONTENT"
    }
],
  links: {
    "demo": "https://agent-kit-generation.vercel.app/",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/generation",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fgeneration%2Fapps&env=AGENTIC_GENERATE_CONTENT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Generation%20keys%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/agentic/agent-kit-generation",
    "docs": "https://lamatic.ai/templates/agentkits/agentic/agent-kit-generation"
},
};
