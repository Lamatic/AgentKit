export default {
  name: "Receipt Split",
  description: "Split a restaurant or store receipt fairly between people from just a photo and plain-English instructions.",
  version: "1.0.0",
  type: "bundle" as const,
  author: { name: "HEMANTH AMARTHI", email: "hemanthkumar.amarthi7@gmail.com" },
  tags: ["generative", "productivity", "finance"],
  steps: [
    { id: "receipt-extract", type: "mandatory" as const },
    { id: "bill-splitter", type: "mandatory" as const, prerequisiteSteps: ["receipt-extract"] }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/receipt-split"
  }
};
