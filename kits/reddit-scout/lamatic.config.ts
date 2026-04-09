export default {
  name: "Reddit Scout",
  description: "Search Reddit for real product reviews and opinions. Get structured summaries of what real users are saying about any product or topic.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Reddit Scout","email":""},
  tags: ["agentic","research"],
  steps: [
    {
        "id": "reddit-scout",
        "type": "mandatory",
        "envKey": "REDDIT_SCOUT_FLOW_ID"
    }
],
  links: {
    "demo": "https://reddit-scout-tawny.vercel.app/",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/reddit-scout",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/reddit-scout&env=REDDIT_SCOUT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Reddit%20Scout%20keys%20are%20required.",
    "docs": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/reddit-scout"
},
};
