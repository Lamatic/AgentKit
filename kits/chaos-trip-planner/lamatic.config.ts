export default {
  name: "chaos-trip-planner",
  description:
    "AI trip planner that builds a day-by-day itinerary using real weather and real nearby places, with an LLM reasoning over both to match your budget and preferences.",
  version: "1.0.0",
  type: "kit",
  author: {
    name: "Khushi Sharma",
    email: "khushisharma.50031@gmail.com",
  },
  tags: ["travel", "trip-planner", "weather", "llm", "structured-json"],
  steps: [
    {
      id: "plan-trip",
      type: "mandatory",
    },
  ],
  links: {
    deploy: "",
    github:
      "https://github.com/khushi05sharma/AgentKit/tree/main/kits/chaos-trip-planner",
  },
};
