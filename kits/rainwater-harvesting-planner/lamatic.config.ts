export default {
  name: "Rainwater Harvesting Planner",
  description:
    "Sizes a rooftop rainwater harvesting system from 5 years of real daily rainfall for any city, then writes a practical tank, recharge, installation, maintenance and cost plan in English or Hindi.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Aryan Sharma", email: "aryansharma732005@gmail.com" },
  tags: ["sustainability", "water", "home", "planning", "india"],
  steps: [
    { id: "rainwater-plan", type: "mandatory" as const, envKey: "RAINWATER_PLAN_FLOW_ID" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/rainwater-harvesting-planner",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Frainwater-harvesting-planner%2Fapps&env=RAINWATER_PLAN_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20project%20credentials%20and%20the%20rainwater-plan%20flow%20ID&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/rainwater-harvesting-planner",
  },
};
