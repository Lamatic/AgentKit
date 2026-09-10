export default {
  name: "Flight Comp Copilot",
  description:
    "Turns a written flight-disruption account into a structured EU261/UK261 assessment: extracted flight facts, a deterministic eligibility decision with the exact statutory compensation amount, and a ready-to-send claim or explanation letter.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Vaibhavsahkk", github: "Vaibhavsahkk" },
  tags: ["travel", "consumer-rights", "aviation", "structured-output"],
  steps: [
    {
      id: "flight-comp-assessment",
      type: "mandatory" as const,
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/flight-comp-copilot",
  },
};
