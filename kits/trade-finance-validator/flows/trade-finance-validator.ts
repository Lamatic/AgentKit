/*
 * # Trade Finance Document Validator Flow
 *
 * ## Purpose
 * This flow accepts a trade finance document (trade license, Letter of Credit, or commercial invoice)
 * as text input, extracts structured fields using an LLM, validates them against a compliance
 * rule checklist, and returns a structured validation report with an overall status verdict.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `document_text` | `string` | Yes | The raw text content extracted from the uploaded document |
 * | `file_name` | `string` | No | Original filename, used as a type hint |
 * | `today_date` | `string` | Yes | Today's date in YYYY-MM-DD format, used for expiry validation |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result` | `object` | Full validation report: document_type, extracted_fields, validation_results, confidence_score, summary, overall_status |
 *
 * ## Node Walkthrough
 * 1. `API Request` — receives document_text, file_name, today_date
 * 2. `Extract Fields` (LLM) — parses document and extracts structured fields + confidence score
 * 3. `Validate Rules` (LLM) — runs compliance checklist against extracted fields
 * 4. `Generate Summary` (LLM) — writes a plain-English verdict summary
 * 5. `Finalise Output` (Code) — merges all outputs into one clean JSON response
 * 6. `API Response` — returns the result
 */

// Flow: trade-finance-validator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "Trade Finance Document Validator",
  description: "Extracts and validates trade finance documents (LC, trade license, invoice) against a compliance rule checklist.",
  tags: ["trade-finance", "document-validation", "compliance", "banking"],
  testInput: {
    document_text: "LETTER OF CREDIT\nLC Reference: LC-2026-00123\nIssuing Bank: XYZ International Bank\nApplicant: ABC Trading LLC\nBeneficiary: Global Exports Ltd\nAmount: USD 500,000\nCurrency: USD\nIssue Date: 10 January 2026\nExpiry Date: 10 July 2027\nPayment Terms: At Sight\nSignature: [Signed]",
    file_name: "sample_lc.pdf",
    today_date: "2026-07-13"
  },
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/trade-finance-validator",
  documentationUrl: "",
  deployUrl: ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  LLMNode_extractor: [
    {
      name: "generativeModelName",
      label: "Extraction Model",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model to extract structured fields from the document.",
      required: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {}
        }
      ],
      typeOptions: { loadOptionsMethod: "listModels" },
      isPrivate: true
    }
  ],
  LLMNode_validator: [
    {
      name: "generativeModelName",
      label: "Validation Model",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model to run the compliance validation rules.",
      required: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {}
        }
      ],
      typeOptions: { loadOptionsMethod: "listModels" },
      isPrivate: true
    }
  ],
  LLMNode_reporter: [
    {
      name: "generativeModelName",
      label: "Report Generation Model",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model to generate the human-readable summary.",
      required: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {}
        }
      ],
      typeOptions: { loadOptionsMethod: "listModels" },
      isPrivate: true
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    extractor_system: "@prompts/trade-finance-validator_extractor_system.md",
    extractor_user: "@prompts/trade-finance-validator_extractor_user.md",
    validator_system: "@prompts/trade-finance-validator_validator_system.md",
    validator_user: "@prompts/trade-finance-validator_validator_user.md",
    reporter_system: "@prompts/trade-finance-validator_reporter_system.md",
    reporter_user: "@prompts/trade-finance-validator_reporter_user.md"
  },
  modelConfigs: {
    extractor: "@model-configs/trade-finance-validator_extractor.ts",
    validator: "@model-configs/trade-finance-validator_validator.ts",
    reporter: "@model-configs/trade-finance-validator_reporter.ts"
  },
  scripts: {
    finalise_output: "@scripts/trade-finance-validator_finalise-output.ts"
  }
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
        advance_schema: ""
      },
      trigger: true
    },
    type: "triggerNode",
    measured: { width: 218, height: 95 },
    position: { x: 450, y: 0 },
    selected: false
  },
  {
    id: "LLMNode_extractor",
    data: {
      label: "Extract Fields",
      modes: {},
      nodeId: "LLMNode",
      values: {
        tools: [],
        prompts: [
          {
            id: "ext-sys-001",
            role: "system",
            content: "@prompts/trade-finance-validator_extractor_system.md"
          },
          {
            id: "ext-usr-001",
            role: "user",
            content: "@prompts/trade-finance-validator_extractor_user.md"
          }
        ],
        memories: "@model-configs/trade-finance-validator_extractor.ts",
        messages: "@model-configs/trade-finance-validator_extractor.ts",
        nodeName: "Extract Fields",
        attachments: "@model-configs/trade-finance-validator_extractor.ts",
        credentials: "@model-configs/trade-finance-validator_extractor.ts",
        generativeModelName: "@model-configs/trade-finance-validator_extractor.ts"
      }
    },
    type: "dynamicNode",
    measured: { width: 218, height: 95 },
    position: { x: 450, y: 150 },
    selected: false
  },
  {
    id: "LLMNode_validator",
    data: {
      label: "Validate Rules",
      modes: {},
      nodeId: "LLMNode",
      values: {
        tools: [],
        prompts: [
          {
            id: "val-sys-001",
            role: "system",
            content: "@prompts/trade-finance-validator_validator_system.md"
          },
          {
            id: "val-usr-001",
            role: "user",
            content: "@prompts/trade-finance-validator_validator_user.md"
          }
        ],
        memories: "@model-configs/trade-finance-validator_validator.ts",
        messages: "@model-configs/trade-finance-validator_validator.ts",
        nodeName: "Validate Rules",
        attachments: "@model-configs/trade-finance-validator_validator.ts",
        credentials: "@model-configs/trade-finance-validator_validator.ts",
        generativeModelName: "@model-configs/trade-finance-validator_validator.ts"
      }
    },
    type: "dynamicNode",
    measured: { width: 218, height: 95 },
    position: { x: 450, y: 300 },
    selected: false
  },
  {
    id: "LLMNode_reporter",
    data: {
      label: "Generate Summary",
      modes: {},
      nodeId: "LLMNode",
      values: {
        tools: [],
        prompts: [
          {
            id: "rep-sys-001",
            role: "system",
            content: "@prompts/trade-finance-validator_reporter_system.md"
          },
          {
            id: "rep-usr-001",
            role: "user",
            content: "@prompts/trade-finance-validator_reporter_user.md"
          }
        ],
        memories: "@model-configs/trade-finance-validator_reporter.ts",
        messages: "@model-configs/trade-finance-validator_reporter.ts",
        nodeName: "Generate Summary",
        attachments: "@model-configs/trade-finance-validator_reporter.ts",
        credentials: "@model-configs/trade-finance-validator_reporter.ts",
        generativeModelName: "@model-configs/trade-finance-validator_reporter.ts"
      }
    },
    type: "dynamicNode",
    measured: { width: 218, height: 95 },
    position: { x: 450, y: 450 },
    selected: false
  },
  {
    id: "codeNode_finalise",
    data: {
      label: "Finalise Output",
      modes: {},
      nodeId: "codeNode",
      values: {
        code: "@scripts/trade-finance-validator_finalise-output.ts",
        nodeName: "Finalise Output"
      }
    },
    type: "dynamicNode",
    measured: { width: 218, height: 95 },
    position: { x: 450, y: 600 },
    selected: false
  },
  {
    id: "responseNode_triggerNode_1",
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: "{}",
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: "{\n  \"result\": \"{{codeNode_finalise.output}}\"\n}"
      }
    },
    type: "responseNode",
    measured: { width: 218, height: 95 },
    position: { x: 450, y: 750 },
    selected: false
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_extractor",
    type: "defaultEdge",
    source: "triggerNode_1",
    target: "LLMNode_extractor",
    sourceHandle: "bottom",
    targetHandle: "top"
  },
  {
    id: "LLMNode_extractor-LLMNode_validator",
    type: "defaultEdge",
    source: "LLMNode_extractor",
    target: "LLMNode_validator",
    sourceHandle: "bottom",
    targetHandle: "top"
  },
  {
    id: "LLMNode_validator-LLMNode_reporter",
    type: "defaultEdge",
    source: "LLMNode_validator",
    target: "LLMNode_reporter",
    sourceHandle: "bottom",
    targetHandle: "top"
  },
  {
    id: "LLMNode_reporter-codeNode_finalise",
    type: "defaultEdge",
    source: "LLMNode_reporter",
    target: "codeNode_finalise",
    sourceHandle: "bottom",
    targetHandle: "top"
  },
  {
    id: "codeNode_finalise-responseNode_triggerNode_1",
    type: "defaultEdge",
    source: "codeNode_finalise",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top"
  },
  {
    id: "response-responseNode_triggerNode_1",
    type: "responseEdge",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
