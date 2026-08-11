export default {
  name: "Transit Incident Response",

  description:
    "An AI-powered transit incident management dashboard that generates alternative routes and passenger alerts for bus service disruptions.",

  version: "1.0.0",

  type: "kit" as const,

  author: {
    name: "Devika sajeev",
    email: "devikadiya1010@gmail.com",
  },

  tags: [
    "transit",
    "transportation",
    "incident-management",
    "ai",
    "routing",
  ],

  steps: [
    {
      id: "transit-incident-response",
      type: "mandatory" as const,
      envKey: "TRANSIT_INCIDENT_RESPONSE_FLOW_ID",
    },
  ],

  links: {
    demo: "",
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/transit-incident-manager",
    deploy: "",
  },
};