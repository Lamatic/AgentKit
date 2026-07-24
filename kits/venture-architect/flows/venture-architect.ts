/**
 * NOTE: This file mirrors the flow actually built and exported from Lamatic
 * Studio (see flows/venturearchitect/config.json for the authoritative,
 * Studio-generated node graph). It's provided in this shape because the
 * contributing guide's structure expects a flows/<name>.ts file to exist
 * alongside the raw Studio export. The node graph here intentionally
 * matches the real, deployed flow exactly: API Request -> Generate Text
 * (LLM) -> API Response. It does not include any validation/build/parse
 * code-node steps, since none exist in the actual deployed flow.
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
            content:
              "Raw idea: {{APIRequest.output.idea}}\nIndustry: {{APIRequest.output.industry}}\nTarget audience: {{APIRequest.output.audience}}\nBudget available: {{APIRequest.output.budget}}\nTimeline to launch: {{APIRequest.output.timeline}}\nTeam size: {{APIRequest.output.team_size}}\n\nTurn this into a venture blueprint following the JSON shape defined in your instructions.",
          },
        ],
        generativeModelName:
          "@model-configs/venture-architect_VentureArchitectLLM.ts",
        responseFormat: "json_object",
      },
    },
    {
      nodeId: "output",
      type: "responseNode",
      values: {
        body: "{{VentureArchitectLLM.output}}",
      },
    },
  ],

  edges: [
    { source: "APIRequest", target: "VentureArchitectLLM" },
    { source: "VentureArchitectLLM", target: "output" },
  ],
};

export default flow;
