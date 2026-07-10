// Flow: intake

export const meta = {
  name: "intake",
  description:
    "Conversational security intake flow that extracts the user's system architecture, components, tech stack, and missing threat-modeling context.",
  tags: ["security", "agentic", "threat-modeling", "architecture"],
  testInput:
    '{"message":"We are building a B2B SaaS: Next.js frontend, Node API, Postgres, Stripe, Clerk, files on S3.","today":"2026-07-10","session_state":"{}"}',
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Kushagra Tiwari",
  },
};

export const inputs = {
  InstructorLLMNode_414: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      mode: "instructor",
      description: "Select the model to generate structured JSON from the prompt.",
      modelType: "generator/text",
      required: true,
      isPrivate: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {},
        },
      ],
      typeOptions: {
        loadOptionsMethod: "listModels",
      },
    },
  ],
};

export const references = {
  prompts: {
    system: "@prompts/intake_system.md",
    user: "@prompts/intake_user.md",
  },
  constitutions: {
    default: "@constitutions/default.md",
  },
};

const outputSchema = {
  type: "object",
  properties: {
    language: { type: "string" },
    assistant_message: { type: "string" },
    is_complete: { type: "boolean" },
    session_state: {
      type: "object",
      properties: {
        system_name: { type: "string" },
        purpose: { type: "string" },
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              type: { type: "string" },
              description: { type: "string" },
              technologies: { type: "array", items: { type: "string" } },
            },
            additionalProperties: true,
          },
        },
        data_assets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              sensitivity: { type: "string" },
              description: { type: "string" },
            },
            additionalProperties: true,
          },
        },
        trust_boundaries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              from_component_id: { type: "string" },
              to_component_id: { type: "string" },
              data_flows: { type: "array", items: { type: "string" } },
              protocol: { type: "string" },
            },
            additionalProperties: true,
          },
        },
        user_roles: { type: "array", items: { type: "string" } },
        compliance_notes: { type: "array", items: { type: "string" } },
        tech_stack: { type: "array", items: { type: "string" } },
      },
      additionalProperties: true,
    },
    missing_info: { type: "array", items: { type: "string" } },
  },
};

export const nodes = [
  {
    id: "triggerNode_1",
    data: {
      modes: {},
      nodeId: "graphqlNode",
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          '{\n  "message": "string",\n  "today": "string",\n  "session_state": "string"\n}',
      },
      trigger: true,
    },
    type: "triggerNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 0,
    },
    selected: false,
  },
  {
    id: "InstructorLLMNode_414",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_414",
        tools: [],
        schema: JSON.stringify(outputSchema, null, 2),
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/intake_system.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/intake_user.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate JSON",
        attachments: "",
        generativeModelName: "",
      },
    },
    type: "dynamicNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 130,
    },
    selected: false,
  },
  {
    id: "responseNode_triggerNode_1",
    data: {
      label: "Response",
      nodeId: "graphqlResponseNode",
      values: {
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping:
          '{\n  "language": "${{InstructorLLMNode_414.output.language}}",\n  "assistant_message": "${{InstructorLLMNode_414.output.assistant_message}}",\n  "is_complete": "${{InstructorLLMNode_414.output.is_complete}}",\n  "session_state": "${{InstructorLLMNode_414.output.session_state}}",\n  "missing_info": "${{InstructorLLMNode_414.output.missing_info}}"\n}',
      },
      disabled: false,
      isResponseNode: true,
    },
    type: "responseNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 260,
    },
    selected: false,
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_414",
    type: "defaultEdge",
    source: "triggerNode_1",
    target: "InstructorLLMNode_414",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "InstructorLLMNode_414-responseNode_triggerNode_1",
    type: "defaultEdge",
    source: "InstructorLLMNode_414",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "response-trigger_triggerNode_1",
    type: "responseEdge",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    selected: false,
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
  },
];

export default { meta, inputs, references, nodes, edges };
