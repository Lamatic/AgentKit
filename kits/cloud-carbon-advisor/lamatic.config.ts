export default {
  name: "Cloud Carbon Advisor",
  description:
    "Git blame for your cloud carbon. Turns a FOCUS usage export into an auditable CO₂e footprint per service and region, then returns an impact-ranked decarbonization plan — every gram computed by code, the model only choosing which lever to pull.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Tej Gokani", email: "tejmgokani@gmail.com" },
  tags: ["sustainability", "cloud-carbon", "greenops", "finops", "developer-tools"],
  steps: [
    {
      id: "carbon-advisor",
      type: "mandatory" as const,
      envKey: "LAMATIC_CARBON_ADVISOR_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/cloud-carbon-advisor",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fcloud-carbon-advisor%2Fapps&env=LAMATIC_CARBON_ADVISOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20the%20deployed%20flow%20ID.&envLink=https%3A%2F%2Flamatic.ai%2Fdocs",
    docs: "https://lamatic.ai/docs",
  },
};
