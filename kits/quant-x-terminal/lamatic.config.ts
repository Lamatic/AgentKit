export default {
  name: "Quant-X Terminal",
  description: "AI-Driven Options Strategy Environment & Virtual Paper Trading Simulator.",
  version: "3.0.0",
  type: "kit" as const,
  author: { name: "Gowthaam", email: "gowthaamlog006@gmail.com" },
  tags: ["options", "trading", "sandbox", "finance"],
  steps: [
    {
      id: "options-analysis",
      name: "Options Strategy Generator",
      flow: "./flows/options-analysis.ts"
    }
  ],
  links: {
    demo: "https://quant-x-terminal.vercel.app/",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/quant-x-terminal",
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fquant-x-terminal%2Fapps&env=REACT_APP_LAMATIC_PROJECT_ID%2CREACT_APP_LAMATIC_FLOW_ID%2CREACT_APP_LAMATIC_API_URL"
  }
};