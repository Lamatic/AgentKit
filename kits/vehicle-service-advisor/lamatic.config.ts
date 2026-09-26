export default {
  name: "Vehicle Service Advisor",
  description:
    "Turns vehicle symptoms, warning lights, mileage, and service history into a safety-first triage report and mechanic-ready service brief.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Sai Varun",
    email: "saivarun1410@gmail.com",
    url: "https://github.com/saivarun1410",
  },
  tags: ["automotive", "maintenance", "triage", "safety", "agentic"],
  steps: [
    {
      id: "vehicle-service-advisor",
      type: "mandatory" as const,
      envKey: "VEHICLE_SERVICE_ADVISOR_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/vehicle-service-advisor",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fvehicle-service-advisor%2Fapps&env=VEHICLE_SERVICE_ADVISOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20deployed%20flow%20ID%20are%20required.",
  },
};
