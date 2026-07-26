export default {
  name: "PRD Copilot",
  description: "An AI-powered Product Requirement Document (PRD) generator that drafts feature specs, user personas, edge cases, and visual Mermaid.js flowcharts through an interactive refinement loop.",
  version: "1.0.0",
  type: "kit" as const,
  author: { "name": "Agent Sachin" },
  tags: ["agentic", "productivity", "development", "mermaid"],
  steps: [
    {
      "id": "prd-copilot",
      "type": "mandatory",
      "envKey": "PRD_COPILOT_FLOW_ID"
    }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/prd-copilot"
  }
};
