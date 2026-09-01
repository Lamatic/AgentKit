export default {
  name: "Runbook Generator",
  description:
    "Turns messy operational notes and tribal knowledge into a structured, reusable ops runbook with prechecks, steps, validation, rollback, and missing-info flags.",
  version: "1.0.0",
  type: "template" as const,
  author: {
    name: "Tushar Sohal",
    email: "tshulk2003@gmail.com",
  },
  tags: ["ops", "devops", "sre", "runbook", "generative"],
  steps: [
    {
      id: "runbook-generator",
      type: "mandatory" as const,
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/runbook-generator",
    docs: "https://lamatic.ai/docs",
  },
};
