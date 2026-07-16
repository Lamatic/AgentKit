export default {
  name: "outreach-personalizer",
  description: "personalized cold outreach email generator using live company signals",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Dhruvil Mistry",
    email: "dhruvilmistry16@gmail.com"
  },
  tags: ["outreach", "sales", "personalization", "email", "cold-outreach"],
  steps: [
    {
      id: "average-teenager",
      type: "mandatory",
      envKey: "FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/outreach-personalizer",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Foutreach-personalizer%2Fapps&env=FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Outreach%20Personalizer%20keys%20are%20required."
  }
};
