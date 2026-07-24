export default {
  name: "fashion-outfit-analyzer",
  description: "Analyzes fashion outfit images via URL using Gemini vision and returns structured styling feedback including color analysis, what works, improvements, missing accessories and occasion suggestions.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Rutvija Mali",
    email: "rutvijamali@gmail.com"
  },
  tags: ["fashion", "image-analysis", "generative", "styling"],
  steps: [
    {
      id: "fashion-outfit-analyzer",
      type: "mandatory" as const
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/fashion-outfit-analyzer"
  }
};
