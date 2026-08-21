export default {
  name: "Speech Pacing & Rhetorical Evaluator",
  description: "Evaluates a speech draft against a target speaking window, estimates delivery time, identifies pacing and jargon risks, and produces a structured rhetorical evaluation with actionable refinements.",
  version: '1.0.0',
  type: 'template' as const,
  author: { name: "Rahul Rajesh", email: "rahullrajesh@users.noreply.github.com" },
  tags: ["speech", "presentation", "pacing", "rhetoric", "communication"],
  steps: [
    { id: "speech-pacing-evaluator", type: 'mandatory' as const }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/speech-pacing-evaluator"
  },
};
