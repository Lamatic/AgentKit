export default {
  name: "Indie Founder Radar",
  description: "AI agent that validates startup ideas by searching the web for real user pain points, competitor weaknesses, and market gaps — then delivers a BUILD or SKIP verdict.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Ragotma", email: "ragotmaragavendar@gmail.com" },
  tags: ["research", "startup", "validation", "web-search", "market-analysis"],
  steps: [
    { id: "indie-founder-radar", type: "mandatory" as const, envKey: "INDIE_FOUNDER_RADAR_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/indie-founder-radar",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/indie-founder-radar/apps&env=INDIE_FOUNDER_RADAR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20credentials%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/indie-founder-radar%23readme"
  }
};