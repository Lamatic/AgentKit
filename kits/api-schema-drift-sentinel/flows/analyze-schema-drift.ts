// -- Meta --
export const meta = {
  name: "Analyze Schema Drift",
  description:
    "Analyzes breaking API schema changes and outputs grounded migration impact.",
  tags: ["drift", "schema", "openapi"],
  version: "1.0.0",
  type: "template" as const,
};

// -- Inputs --
export const inputs = {
  LLMNode_1: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
    },
  ],
};

// -- References --
export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    analyze_schema_drift_llm_node_system:
      "@prompts/analyze-schema-drift_llm-node_system.md",
  },
  modelConfigs: {
    analyze_schema_drift_llm_node_generative_model_name:
      "@model-configs/analyze-schema-drift_llm-node_generative-model-name.ts",
  },
};

// -- Nodes & Edges --
export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: JSON.stringify({
          apiName: "string",
          oldVersion: "string",
          newVersion: "string",
          breakingChangesCount: "number",
          deploymentRisk: "string",
          schemaFacts: "string",
        }),
      },
    },
  },

  {
    id: "LLMNode_1",
    type: "dynamicNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "LLMNode",
      values: {
        id: "LLMNode_1",
        tools: [],
        schema: JSON.stringify({
          type: "object",
          properties: {
            impactSummary: {
              type: "string",
            },
            affectedClients: {
              type: "array",
              items: {
                type: "string",
              },
            },
            migrationGuidance: {
              type: "array",
              items: {
                type: "string",
              },
            },
            deploymentRecommendation: {
              type: "string",
            },
          },
          required: [
            "impactSummary",
            "affectedClients",
            "migrationGuidance",
            "deploymentRecommendation",
          ],
          additionalProperties: false,
        }),
        prompts: [
          {
            id: "analyze-schema-drift-system",
            role: "system",
            content:
              "@prompts/analyze-schema-drift_llm-node_system.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate JSON",
        attachments: "",
        credentials: "",
        generativeModelName:
          "@model-configs/analyze-schema-drift_llm-node_generative-model-name.ts",
      },
    },
  },

  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: JSON.stringify({
          "content-type": "application/json",
        }),
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: JSON.stringify({
          impactSummary: "{{LLMNode_1.output.impactSummary}}",
          affectedClients: "{{LLMNode_1.output.affectedClients}}",
          migrationGuidance: "{{LLMNode_1.output.migrationGuidance}}",
          deploymentRecommendation:
            "{{LLMNode_1.output.deploymentRecommendation}}",
        }),
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_1",
    source: "triggerNode_1",
    target: "LLMNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_1-responseNode_triggerNode_1",
    source: "LLMNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-trigger_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default {
  meta,
  inputs,
  references,
  nodes,
  edges,
};