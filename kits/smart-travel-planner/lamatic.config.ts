export default {
  name: "Smart AI Travel Planner",
  description: "An AI-powered travel planner that generates personalized itineraries with maps, chatbot assistance, and real-time place suggestions.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "sujalchettri01", email: "" },
  tags: ["travel", "itinerary", "maps", "chatbot", "generative"],
  steps: [
    { id: "chatbot-flow", type: "mandatory" as const, envKey: "CHATBOT_FLOW_ID" },
    { id: "travel-flow", type: "mandatory" as const, envKey: "TRAVEL_FLOW_ID" }
  ],
  links: {"https://github.com/sujalchettri01/AI-travel",
    deploy: "https://ai-travel-indol.vercel.app/"
  }
};