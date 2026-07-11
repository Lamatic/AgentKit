export default {
  name: "find-your-hotel",
  description:
    "AI-powered hotel recommendation kit that suggests realistic hotels with confidence labels, estimated prices, and Google Maps links using Lamatic.",
  version: "1.0.0",
  type: "kit",
  author: {
    name: "Rohit",
    email: "nixenboi@gmail.com",
  },
  tags: [
    "travel",
    "hotel",
    "ai",
    "recommendation",
    "lamatic",
    "booking",
    "maps",
  ],
  steps: [
    {
      id: "find-your-hotel",
      type: "mandatory",
    },
  ],
  links: {
    deploy: "https://find-your-hotel.vercel.app",  
    github: "https://github.com/nixen-rohit/AgentKit/tree/main/kits/find-your-hotel",
  },
};
