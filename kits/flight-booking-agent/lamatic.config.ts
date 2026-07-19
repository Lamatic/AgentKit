export default {
  name: "Flight Booking Agent",
  description:
    "AI-powered flight search agent that finds the cheapest flights using natural language. Integrates with Duffel API for real-time pricing and currency conversion.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Nhlalonhle",
    email: "nhlalonkosi@gmail.com",
  },
  tags: ["ai", "flights", "travel", "search", "duffel"],
  steps: [
    {
      id: "flight-search",
      type: "mandatory" as const,
      envKey: "LAMATIC_WORKFLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/flight-booking-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/flight-booking-agent/apps",
    demo: "https://flight-booking-agent-pearl.vercel.app",
  },
};
