// Flow: supply-chain-email-draft

export const meta = {
  name: "Supply Chain Email Draft",
  description: "Drafts a professional supplier inquiry email for high-risk supply chain nodes.",
  tags: ["supply-chain", "email", "risk"],
  testInput: {
    supplier_name: "Apex Electronics",
    location: "Shenzhen, China",
    risk_score: 78,
    risk_factors: "Labor protests reported near industrial zone, typhoon warning issued for Guangdong province",
    components_supplied: "Microcontrollers (STM32 series)"
  },
  githubUrl: "",
  documentationUrl: "",
  deployUrl: ""
};

export const inputs = {
  "LLMNode_draft": [
    {
      mode: "chat",
      name: "generativeModelName",
      type: "model",
      label: "Generative Model Name",
      required: true,
      isPrivate: true,
      modelType: "generator/text",
      description: "Select the model to draft the supplier email.",
      typeOptions: { loadOptionsMethod: "listModels" },
      defaultValue: ""
    }
  ]
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    email_system: "@prompts/email-system.md",
    supply_chain_email_draft_draft_user: "@prompts/supply-chain-email-draft_draft_user.md"
  },
  modelConfigs: {
    supply_chain_email_draft_draft: "@model-configs/supply-chain-email-draft_draft.ts"
  }
};

export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 400, y: 0 },
    data: {
      nodeId: "graphqlNode",
      modes: {},
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: ""
      }
    }
  },
  {
    id: "LLMNode_draft",
    type: "dynamicNode",
    position: { x: 400, y: 150 },
    data: {
      nodeId: "LLMNode",
      modes: {},
      values: {
        nodeName: "Draft Email",
        tools: [],
        prompts: [
          { id: "p1", role: "system", content: "@prompts/email-system.md" },
          { id: "p2", role: "user", content: "@prompts/supply-chain-email-draft_draft_user.md" }
        ],
        memories: "@model-configs/supply-chain-email-draft_draft.ts",
        messages: "@model-configs/supply-chain-email-draft_draft.ts",
        attachments: "@model-configs/supply-chain-email-draft_draft.ts"
      }
    }
  },
  {
    id: "responseNode_triggerNode_1",
    type: "dynamicNode",
    position: { x: 400, y: 300 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping: "{\n  \"email_subject\": \"{{LLMNode_draft.output.email_subject}}\",\n  \"email_body\": \"{{LLMNode_draft.output.email_body}}\",\n  \"urgency_level\": \"{{LLMNode_draft.output.urgency_level}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_draft",
    source: "triggerNode_1",
    target: "LLMNode_draft",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_draft-responseNode_triggerNode_1",
    source: "LLMNode_draft",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "response-responseNode_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
