export default {
  name: "Agent Failure Investigator",
  description: "A forensic diagnostic tool for AI agents. Upload a failed agent trace from LangGraph, OpenAI Agents SDK, CrewAI, AutoGen, Lamatic, or the native format, and get a structured failure report with clickable evidence, a failure-propagation graph, a reconstructed timeline, and a remediation playbook. Diagnosis is a deterministic rule engine; an optional flow narrates the findings as fluent prose.",
  version: '1.0.0',
  type: 'template' as const,
  author: { name: "Youssef", email: "yshsh218@gmail.com" },
  tags: ["diagnostics", "observability", "agentic", "developer-tools"],
  steps: [
    { id: "compose-root-cause", type: 'mandatory' as const }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-failure-investigator"
  },
};
