// Flow: collect-flow-portfolio-intelligence

// -- Meta --
export const meta = {
  name: "CollectFlow Portfolio Intelligence",
  description:
    "Ranks Accounts Receivable portfolios using AI-generated priority scores, risk classification, and treatment recommendations.",
  tags: [],
  testInput: null,
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/collectflow",
  documentationUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/collectflow",
  deployUrl: "https://collectflow-nine.vercel.app",
  author: {
    name: "Sahil Shitole",
    email: "sahilmshitole1483@gmail.com",
  },
};

// -- Inputs --
export const inputs = {
  InstructorLLMNode_226: [
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
    collect_flow_portfolio_intelligence_instructor_llmnode_226_system_0:
      "@prompts/collect-flow-portfolio-intelligence_instructor-llmnode-226_system_0.md",
    collect_flow_portfolio_intelligence_instructor_llmnode_226_user_1:
      "@prompts/collect-flow-portfolio-intelligence_instructor-llmnode-226_user_1.md",
  },
  modelConfigs: {
    collect_flow_portfolio_intelligence_instructor_llmnode_226_generative_model_name:
      "@model-configs/collect-flow-portfolio-intelligence_instructor-llmnode-226_generative-model-name.ts",
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
        advance_schema: '{\n  "portfolio_data": "string"\n}',
      },
    },
  },
  {
    id: "InstructorLLMNode_226",
    type: "dynamicNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema: {
          type: "object",
          properties: {
            portfolio_summary: {
              type: "object",
              properties: {
                customers_analyzed: {
                  type: "number",
                  required: true,
                },
                total_overdue: {
                  type: "number",
                  required: true,
                },
                critical_customers: {
                  type: "number",
                  required: true,
                },
                approval_required_customers: {
                  type: "number",
                  required: true,
                },
              },
              additionalProperties: true,
            },
            ranked_queue: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rank: {
                    type: "number",
                    required: true,
                  },
                  priority_score: {
                    type: "number",
                    required: true,
                  },
                  customer_id: {
                    type: "string",
                    required: true,
                  },
                  customer_name: {
                    type: "string",
                    required: true,
                  },
                  risk_level: {
                    type: "string",
                    required: true,
                  },
                  treatment_lane: {
                    type: "string",
                    required: true,
                  },
                  approval_required: {
                    type: "boolean",
                    required: true,
                  },
                  priority_explanation: {
                    type: "string",
                    required: true,
                  },
                },
                additionalProperties: true,
              },
            },
          },
        },
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content:
              "@prompts/collect-flow-portfolio-intelligence_instructor-llmnode-226_system_0.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content:
              "@prompts/collect-flow-portfolio-intelligence_instructor-llmnode-226_user_1.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Portfolio Intelligence",
        attachments: "",
        generativeModelName:
          "@model-configs/collect-flow-portfolio-intelligence_instructor-llmnode-226_generative-model-name.ts",
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
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping:
          '{\n  "portfolio_summary": "{{InstructorLLMNode_226.output.portfolio_summary}}",\n  "ranked_queue": "{{InstructorLLMNode_226.output.ranked_queue}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_226",
    source: "triggerNode_1",
    target: "InstructorLLMNode_226",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_226-responseNode_triggerNode_1",
    source: "InstructorLLMNode_226",
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

export default { meta, inputs, references, nodes, edges };
