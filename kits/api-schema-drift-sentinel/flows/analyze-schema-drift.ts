export const meta = {
  "name": "Analyze Schema Drift",
  "description": "Analyzes breaking API schema changes and outputs grounded migration impact.",
  "tags": ["drift", "schema", "openapi"]
};

export const inputs = {};
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "system": "@prompts/analyze-schema-drift_llm-node_system.md"
  }
};

export const nodes = [];
export const edges = [];

export default { meta, inputs, references, nodes, edges };
