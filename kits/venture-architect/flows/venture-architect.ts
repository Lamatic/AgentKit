/**
 * NOTE: This flow file was hand-authored to match the shape Lamatic Studio
 * produces on export (meta + inputs + references + nodes + edges), since it
 * wasn't built inside Studio's visual editor. Before opening a PR, import or
 * rebuild this in Studio to confirm the node types, edge wiring, and
 * generativeModelName provider/model string are valid, then re-export to
 * replace this file with Studio's own output.
 */

const flow = {
  meta: {
    id: "venture-architect",
    name: "VentureArchitect",
    description:
      "Transforms startup ideas into complete venture blueprints including business strategy, product architecture, technical planning, financial estimation, and investor documentation.",
  },

  inputs: {
    idea: {
      type: "string",
      required: true,
      description: "The raw startup idea in plain language",
    },
    industry: {
      type: "string",
      required: true,
      description: "Industry / category, e.g. FinTech, HealthTech",
    },
    audience: {
      type: "string",
      required: false,
      description: "Target audience, e.g. first-time renters in the US",
    },
    budget: {
      type: "string",
      required: false,
      description: "Budget available, e.g. $1,000 - $5,000",
    },
    timeline: {
      type: "string",
      required: false,
      description: "Timeline to launch, e.g. 3 Months",
    },
    team_size: {
      type: "string",
      required: false,
      description: "Team size, e.g. Solo Founder",
    },
  },

  nodes: [
    {
      nodeId: "APIRequest",
      type: "apiTrigger",
      values: {},
    },
    {
      nodeId: "ValidateInputs",
      type: "codeNode",
      values: {
        script: "@scripts/venture-architect_ValidateInputs.ts",
        input: "{{APIRequest.body}}",
      },
    },
    {
      nodeId: "BuildPrompt",
      type: "codeNode",
      values: {
        script: "@scripts/venture-architect_BuildPrompt.ts",
        input: "{{ValidateInputs.output}}",
      },
    },
    {
      nodeId: "VentureArchitectLLM",
      type: "llm",
      values: {
        prompts: [
          {
            role: "system",
            content:
              "@prompts/venture-architect_VentureArchitectLLM_system.md",
          },
          {
            role: "user",
            content: "{{BuildPrompt.output}}",
          },
        ],
        generativeModelName:
          "@model-configs/venture-architect_VentureArchitectLLM.ts",
        responseFormat: "json_object",
      },
    },
    {
      nodeId: "JSONParser",
      type: "codeNode",
      values: {
        script: "@scripts/venture-architect_JSONParser.ts",
        input: "{{VentureArchitectLLM.output}}",
      },
    },
    {
      nodeId: "output",
      type: "responseNode",
      values: {
        body: "{{JSONParser.output}}",
      },
    },
  ],

  edges: [
    { source: "APIRequest", target: "ValidateInputs" },
    { source: "ValidateInputs", target: "BuildPrompt" },
    { source: "BuildPrompt", target: "VentureArchitectLLM" },
    { source: "VentureArchitectLLM", target: "JSONParser" },
    { source: "JSONParser", target: "output" },
  ],
};

export default flow;
