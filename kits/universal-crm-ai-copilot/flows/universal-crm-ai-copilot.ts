/*
 * Universal Multi-CRM AI Copilot Flow Definition
 */

export const meta = {
  name: "Universal Multi-CRM AI Copilot Flow",
  description: "Normalizes raw text into Salesforce, SAP, Zoho, and MS Dynamics 365 payloads with AI Intent Scoring.",
  tags: ["crm", "salesforce", "sap", "zoho", "dynamics365"],
  testInput: {
    leadText: "Ashutosh Joshi, Head of AI Engineering at Swades / Enterprise AI. Email: ashutosh@example.com. Looking to purchase 500 licenses for multi-CRM automation ($50k-$100k budget) in the next 30 days."
  }
};

export const inputs = {
  LLMNode_1: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      required: true,
      defaultValue: [
        {
          configName: "gpt-4o",
          type: "generator/text",
          provider_name: "openai",
          credential_name: "openai-default",
          params: {}
        }
      ],
      isPrivate: true
    }
  ]
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    system: "@prompts/crm-system.md",
    user: "@prompts/crm-user.md"
  },
  modelConfigs: {
    crm_llm: "@model-configs/crm-llm.ts"
  },
  scripts: {
    finalise_crm_output: "@scripts/finalise-crm-output.ts"
  }
};

export const nodes = [
  {
    id: "triggerNode_1",
    data: {
      nodeId: "graphqlNode",
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime"
      },
      trigger: true
    },
    type: "triggerNode",
    position: { x: 400, y: 0 }
  },
  {
    id: "LLMNode_1",
    data: {
      nodeId: "LLMNode",
      values: {
        prompts: [
          { role: "system", content: "@prompts/crm-system.md" },
          { role: "user", content: "@prompts/crm-user.md" }
        ],
        generativeModelName: "@model-configs/crm-llm.ts",
        nodeName: "AI Schema & Intent Engine"
      }
    },
    type: "dynamicNode",
    position: { x: 400, y: 150 }
  },
  {
    id: "codeNode_1",
    data: {
      nodeId: "codeNode",
      values: {
        code: "@scripts/finalise-crm-output.ts",
        nodeName: "Finalize CRM Payloads"
      }
    },
    type: "dynamicNode",
    position: { x: 400, y: 300 }
  },
  {
    id: "responseNode_1",
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_1",
        nodeName: "API Response",
        outputMapping: "{\n  \"answer\": \"{{codeNode_1.output}}\"\n}"
      }
    },
    type: "responseNode",
    position: { x: 400, y: 450 }
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_1",
    type: "defaultEdge",
    source: "triggerNode_1",
    target: "LLMNode_1"
  },
  {
    id: "LLMNode_1-codeNode_1",
    type: "defaultEdge",
    source: "LLMNode_1",
    target: "codeNode_1"
  },
  {
    id: "codeNode_1-responseNode_1",
    type: "defaultEdge",
    source: "codeNode_1",
    target: "responseNode_1"
  }
];

export default { meta, inputs, references, nodes, edges };
