export default {
  name: "AI Travel Planner",
  description: "AI-powered travel planning agent that generates personalized day-wise itineraries, hotel recommendations, local food guides, packing lists, and budget breakdowns for any destination worldwide.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Abhishek Jain",
    email: "znabhi02@gmail.com"
  },
  tags: ["travel", "planning", "itinerary", "generative", "chat", "groq"],
  steps: [
    {
      id: "ai-travel-planner-agent",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/ai-travel-planner"
  }
};
