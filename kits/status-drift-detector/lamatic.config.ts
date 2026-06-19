export default {
  name: "Status Drift Detector",
  description: "Compares the status of the same task or issue across two different tracking sources (e.g. GitHub and a project tracker) and flags when they have drifted out of sync, suggesting a reconciled status with reasoning.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Shreya Salimath", email: "shreya.salimath20@gmail.com" },
  tags: ["productivity", "automation", "reasoning"],
  steps: [
    { id: "status-drift-detector", type: "mandatory" as const }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/status-drift-detector",
    docs: "https://lamatic.ai/docs"
  }
};
