// Flow: subsniffer
// Audit a bank statement for recurring subscriptions, flag unused ones,
// estimate savings, and surface cancellation links. Single Lamatic flow:
// API Request -> InstructorLLM (Detect Subscriptions) -> LLM (Write Report)
// -> API Response returning { analysis, report }.

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "SubSniffer — Subscription Audit",
  description:
    "Audit a bank statement for recurring subscriptions, flag unused ones, estimate savings, and surface cancellation links.",
  tags: "finance,subscriptions,savings",
  testInput:
    '{"statement":"NETFLIX $15.49; SPOTIFY $10.99; ADOBE CREATIVE $59.99 (used once 4 months ago); GYMPASS $40 (never used); AMAZON PRIME $14.99; DROPBOX $11.99 (used weekly); NOTION $8 (used daily); ONE-OFF COFFEE $4.50","goals":"cancel anything I have not used in 60 days"}',
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Satyam Singh",
    email: "satyamsingh7734@gmail.com",
  },
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  InstructorLLMNode_954: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      mode: "instructor",
      description: "Select the model to generate text based on the prompt.",
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
  LLMNode_456: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model to generate text based on the prompt.",
      required: true,
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
      isPrivate: true,
    },
  ],
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    subsniffer_detect_subscriptions_system:
      "@prompts/subsniffer_detect-subscriptions_system.md",
    subsniffer_detect_subscriptions_user:
      "@prompts/subsniffer_detect-subscriptions_user.md",
    subsniffer_write_report_system: "@prompts/subsniffer_write-report_system.md",
    subsniffer_write_report_user: "@prompts/subsniffer_write-report_user.md",
  },
  modelConfigs: {
    subsniffer_detect_subscriptions:
      "@model-configs/subsniffer_detect-subscriptions.ts",
    subsniffer_write_report: "@model-configs/subsniffer_write-report.ts",
  },
};

// ── Nodes & Edges ─────────────────────────────────────
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
          '{\n  "statement": "string",\n  "goals": "string"\n}',
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
    selected: true,
  },
  {
    id: "InstructorLLMNode_954",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_954",
        tools: [],
        schema:
          '{\n  "type": "object",\n  "properties": {\n    "summary": {\n      "type": "string"\n    },\n    "subscriptions": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "merchant": {\n            "type": "string"\n          },\n          "amount": {\n            "type": "number"\n          },\n          "cadence": {\n            "type": "string",\n            "description": "e.g. monthly, yearly, weekly"\n          },\n          "category": {\n            "type": "string",\n            "description": "e.g. streaming, fitness, productivity, cloud"\n          },\n          "usage": {\n            "type": "string",\n            "description": "used | rarely | unused"\n          },\n          "reason": {\n            "type": "string",\n            "description": "short reason this verdict was assigned"\n          },\n          "monthly_cost": {\n            "type": "number",\n            "description": "normalized to a monthly figure"\n          },\n          "cancellation_url": {\n            "type": "string",\n            "description": "best-guess cancellation/management URL"\n          }\n        },\n        "required": ["merchant", "amount", "cadence", "category", "usage", "monthly_cost"]\n      }\n    },\n    "totals": {\n      "type": "object",\n      "properties": {\n        "monthly_recurring": {\n          "type": "number"\n        },\n        "annual_recurring": {\n          "type": "number"\n        },\n        "estimated_savings": {\n          "type": "number",\n          "description": "monthly savings if all unused/rarely plans are cancelled"\n        }\n      }\n    },\n    "top_recommendations": {\n      "type": "array",\n      "items": {\n        "type": "string"\n      }\n    },\n    "risk_flags": {\n      "type": "array",\n      "items": {\n        "type": "string"\n      }\n    }\n  },\n  "required": ["summary", "subscriptions", "totals"]\n}',
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/subsniffer_detect-subscriptions_system.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/subsniffer_detect-subscriptions_user.md",
          },
        ],
        memories: "@model-configs/subsniffer_detect-subscriptions.ts",
        messages: "@model-configs/subsniffer_detect-subscriptions.ts",
        nodeName: "Detect Subscriptions",
        attachments: "@model-configs/subsniffer_detect-subscriptions.ts",
        generativeModelName: "@model-configs/subsniffer_detect-subscriptions.ts",
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
    id: "LLMNode_456",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "LLMNode",
      values: {
        id: "LLMNode_456",
        tools: [],
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/subsniffer_write-report_system.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/subsniffer_write-report_user.md",
          },
        ],
        memories: "@model-configs/subsniffer_write-report.ts",
        messages: "@model-configs/subsniffer_write-report.ts",
        nodeName: "Write Report",
        attachments: "@model-configs/subsniffer_write-report.ts",
        credentials: "@model-configs/subsniffer_write-report.ts",
        generativeModelName: "@model-configs/subsniffer_write-report.ts",
      },
    },
    type: "dynamicNode",
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
  {
    id: "responseNode_triggerNode_1",
    data: {
      label: "Response",
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        needs: ["LLMNode_456"],
        outputMapping:
          '{\n  "analysis": "{{InstructorLLMNode_954.output}}",\n  "report": "{{LLMNode_456.output.generatedResponse}}"\n}',
      },
      isResponseNode: true,
    },
    type: "responseNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 390,
    },
    selected: false,
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_954-795",
    type: "defaultEdge",
    source: "triggerNode_1",
    target: "InstructorLLMNode_954",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "InstructorLLMNode_954-LLMNode_456-123",
    type: "defaultEdge",
    source: "InstructorLLMNode_954",
    target: "LLMNode_456",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "LLMNode_456-responseNode_triggerNode_1-550",
    type: "defaultEdge",
    source: "LLMNode_456",
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
