// Flow placeholder: prd-copilot
// This will be replaced by the exported flow from Lamatic Studio.

export const meta = {
  "name": "PRD Copilot - Generate & Refine",
  "description": "Drafts and refines a Product Requirement Document (PRD) and generates a Mermaid flowchart",
  "tags": ["agentic", "prd", "mermaid"],
  "testInput": {
    "mode": "draft",
    "instructions": "A dog walking application"
  }
};

export const inputs = {};
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};
export const nodes = [];
export const edges = [];

export default { meta, inputs, references, nodes, edges };
