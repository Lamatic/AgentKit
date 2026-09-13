export default {
  name: "Change Impact Lens",
  description: "Analyzes a changed file's real dependency graph and traces direct plus indirect impact across the codebase, so you know what to test before it breaks.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Harish Chandar","email":"notharishchandar@gmail.com"},
  tags: ["developer-tools","code-analysis","agentic"],
  steps: [
    {
        "id": "change-impact-lens",
        "type": "mandatory",
        "envKey": "CHANGE_IMPACT_ANALYSIS_FLOW"
    }
],
  links: {
    "demo": "",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/change-impact-lens",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fchange-impact-lens%2Fapps&env=CHANGE_IMPACT_ANALYSIS_FLOW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20keys%20are%20required.",
    "docs": ""
},
};