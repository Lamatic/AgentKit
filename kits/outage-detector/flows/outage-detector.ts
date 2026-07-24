/*
 * # Outage Detector
 * Correlates a new support ticket against ticket history to catch a shared
 * outage before it looks like a pattern to a human — verifying genuine
 * root-cause correlation rather than surface wording similarity.
 *
 * ## Purpose
 * This flow retrieves semantically similar historical tickets for an
 * incoming ticket, then runs a verification step that decides whether any
 * of those candidates share a genuine root cause with the new ticket — not
 * merely similar wording. Only genuinely correlated tickets clear the
 * confidence threshold and get flagged, at which point a second agent
 * drafts a grounded internal note and customer message.
 *
 * ## When To Use
 * - Use when a caller has a new support ticket (subject + body + account
 *   metadata) and wants to know whether it's part of an existing, shared
 *   technical issue already reflected in ticket history.
 * - Use when you want a verification step between "these tickets look
 *   similar" and "these tickets are the same outage" — e.g. to avoid
 *   false-positive alerts from tickets that share vocabulary but not root
 *   cause (a customer's own expired credential vs. a real platform outage).
 *
 * ## When Not To Use
 * - Do not use for the very first ticket in a new deployment before the
 *   vector store has any history to compare against — Vector Search will
 *   return no useful candidates.
 * - Do not use as a substitute for actually resolving the underlying issue
 *   — this flow identifies and drafts, it does not remediate.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `ticket_id` | `string` | Yes | Unique identifier for the incoming ticket. |
 * | `account_id` | `string` | Yes | Identifier for the reporting account. |
 * | `account_name` | `string` | Yes | Display name for the reporting account. |
 * | `account_tier` | `string` | Yes | Account tier (e.g. enterprise, growth, starter). |
 * | `created_at` | `string` | Yes | ISO 8601 timestamp the ticket was created. |
 * | `subject` | `string` | Yes | Ticket subject line. |
 * | `body` | `string` | Yes | Ticket body text. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `status` | `string` | The condition branch result: `"Condition 1"` (flagged) or `"Else"` (normal). |
 * | `confidence` | `number` | The correlation agent's confidence (0-1) that matched_ticket_ids are genuine. |
 * | `matched_ticket_ids` | `string[]` | Ticket IDs genuinely correlated with the new ticket. Empty on no match. |
 * | `suspected_component` | `string` | The technical component believed responsible. |
 * | `reasoning` | `string` | The correlation agent's explanation for its verdict. |
 * | `internal_note` | `string` | Drafted note for support agents. Empty on the "Else" branch. |
 * | `customer_message` | `string` | Drafted customer-facing message. Empty on the "Else" branch. |
 *
 * ## Dependencies
 * ### External Services
 * - Vector store (`support-tickets`) — holds ticket history for retrieval and is written to on every submission
 * - Embedding model — used by both Vector Search and Vectorize (developed against Cohere `embed-english-v3.0`)
 * - LLM credential — used by both JSON Agent nodes (developed against a Groq-hosted model, e.g. Llama 3.3 70B)
 *
 * ### Environment Variables
 * - `OUTAGE_DETECTOR` — deployed flow ID used by the calling application
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic API credentials for the calling application
 *
 * ## Node Walkthrough
 * 1. `API Trigger` (`triggerNode_1`) — receives the new ticket payload.
 * 2. `Vector Search` (`searchNode_739`) — retrieves up to 8 candidate tickets with certainty >= 0.7.
 * 3. `Vectorize` (`vectorizeNode_148`) — embeds the new ticket's subject + body.
 * 4. `VectorDB` (`vectorNode_896`) — indexes the new ticket into the vector store, keyed by `ticket_id`, overwriting on duplicate.
 * 5. `Correlation Verification Agent` (`InstructorLLMNode_311`) — a JSON Agent that verifies genuine root-cause correlation between the new ticket and every retrieved candidate.
 * 6. `Condition` (`conditionNode_526`) — routes on `confidence >= 0.75`.
 *    - `"Condition 1"` branch → `Drafting Agent`.
 *    - `"Else"` branch → `addNode_601` (passthrough — internal_note/customer_message stay empty).
 * 7. `Drafting Agent` (`InstructorLLMNode_837`) — a JSON Agent that drafts `internal_note` and `customer_message`, grounded in the correlation agent's own findings.
 * 8. `API Response` (`responseNode_triggerNode_1`) — maps the final structured output.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | `matched_ticket_ids` contains fabricated IDs (e.g. "ticket-123") | The correlation agent's user prompt isn't actually bound to real trigger/search output | Verify the `{{ }}` chips in `InstructorLLMNode_311`'s user prompt resolve to real data, not the Studio placeholder text |
 * | A ticket that should match doesn't appear in `matched_ticket_ids` even though Vector Search returned it as a candidate | The correlation agent stopped at the single closest match instead of evaluating every candidate | Confirm the system prompt's "evaluate every candidate independently" instruction is present |
 * | `internal_note`/`customer_message` are blank on the flagged branch | The drafting agent's user prompt isn't bound to the correlation agent's output fields | Verify `InstructorLLMNode_837`'s user prompt chips resolve to `InstructorLLMNode_311.output.*` |
 * | Everything returns `"Else"` with confidence 0 | The vector store is empty or the new ticket has genuinely no history to correlate against | Seed the vector store with prior tickets before testing correlation |
 *
 * ## Notes
 * - There are two independent thresholds in this flow: Vector Search's own
 *   `certainty >= 0.7` (which tickets are even considered candidates), and
 *   the Condition node's `confidence >= 0.75` (whether a verified match gets
 *   flagged). These are easy to conflate but serve different purposes.
 * - `internal_note` and `customer_message` are legitimately empty strings
 *   on the "Else" branch — that's expected behavior, not a bug.
 */

// Flow: outage-detector

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "Outage Detector",
  description: "Correlates a new support ticket against ticket history to catch a shared outage before it looks like a pattern to a human.",
  tags: ["support", "ticket-triage", "vector-search", "rag", "outage-detection", "correlation"],
  testInput: {
    ticket_id: "T-1013",
    account_id: "A-299",
    account_name: "Thornbury Health",
    account_tier: "enterprise",
    created_at: "2026-07-06T15:00:00Z",
    subject: "Integration down since this afternoon, TLS mismatch",
    body: "Our nightly ETL job (runs mid-afternoon for us due to timezone) failed with a TLS handshake mismatch against your SFTP endpoint. No changes on our side in weeks."
  },
  githubUrl: "",
  documentationUrl: "",
  deployUrl: ""
};

// ── Inputs ────────────────────────────────────────────
// Private, per-installer fields — same shape as Studio's own inputs.json export.
export const inputs = {
  searchNode_739: [
    {
      name: "vectorDB",
      label: "Vector DB",
      type: "select",
      isDB: true,
      required: true,
      isPrivate: true,
      defaultValue: ""
    },
    {
      name: "embeddingModelName",
      label: "Embedding Model Name",
      type: "model",
      mode: "embedding",
      modelType: "embedder/text",
      required: true,
      isPrivate: true,
      defaultValue: "",
      typeOptions: { loadOptionsMethod: "listModels" }
    }
  ],
  vectorizeNode_148: [
    {
      name: "embeddingModelName",
      label: "Embedding Model Name",
      type: "model",
      mode: "embedding",
      description: "Select the model to convert the texts into vector representations.",
      modelType: "embedder/text",
      required: true,
      isPrivate: true,
      defaultValue: "",
      typeOptions: { loadOptionsMethod: "listModels" }
    }
  ],
  vectorNode_896: [
    {
      name: "vectorDB",
      label: "Vector DB",
      type: "select",
      isDB: true,
      required: true,
      isPrivate: true,
      defaultValue: "",
      description: "Select the vector database where the action will be performed."
    }
  ],
  InstructorLLMNode_311: [
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
        { configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }
      ],
      typeOptions: { loadOptionsMethod: "listModels" }
    }
  ],
  InstructorLLMNode_837: [
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
        { configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }
      ],
      typeOptions: { loadOptionsMethod: "listModels" }
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    outage_detector_InstructorLLMNode_311_system: "@prompts/outage-detector_InstructorLLMNode_311_system.md",
    outage_detector_InstructorLLMNode_311_user: "@prompts/outage-detector_InstructorLLMNode_311_user.md",
    outage_detector_InstructorLLMNode_837_system: "@prompts/outage-detector_InstructorLLMNode_837_system.md",
    outage_detector_InstructorLLMNode_837_user: "@prompts/outage-detector_InstructorLLMNode_837_user.md"
  },
  modelConfigs: {
    outage_detector_InstructorLLMNode_311: "@model-configs/outage-detector_InstructorLLMNode_311.ts",
    outage_detector_InstructorLLMNode_837: "@model-configs/outage-detector_InstructorLLMNode_837.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
// Mirrors the real Lamatic Studio export (17/07/2026) — prompts and
// generativeModelName replaced with @references; schema kept inline.
export const nodes = [
  {
    id: "triggerNode_1",
    data: {
      modes: {},
      nodeId: "graphqlNode",
      values: {
        id: "triggerNode_1",
        nodeName: "API Trigger",
        responeType: "realtime",
        advance_schema: "{\n  \"ticket_id\": \"string\",\n  \"account_id\": \"string\",\n  \"account_name\": \"string\",\n  \"created_at\": \"string\",\n  \"subject\": \"string\",\n  \"body\": \"string\",\n  \"account_tier\": \"string\"\n}"
      },
      trigger: true
    },
    type: "triggerNode",
    measured: { width: 250, height: 93 },
    position: { x: 225, y: 0 },
    selected: false
  },
  {
    id: "searchNode_739",
    data: {
      label: "dynamicNode node",
      logic: [],
      modes: {},
      nodeId: "searchNode",
      values: {
        id: "searchNode_739",
        limit: 8,
        filters: "[]",
        nodeName: "Vector Search",
        vectorDB: "",
        certainty: "0.7",
        searchQuery: "{{triggerNode_1.output.subject}} {{triggerNode_1.output.body}}",
        embeddingModelName: ""
      }
    },
    type: "dynamicNode",
    measured: { width: 250, height: 93 },
    position: { x: 225, y: 130 },
    selected: false
  },
  {
    id: "vectorizeNode_148",
    data: {
      label: "dynamicNode node",
      logic: [],
      modes: {},
      nodeId: "vectorizeNode",
      values: {
        id: "vectorizeNode_148",
        nodeName: "Vectorize",
        inputText: "[\"{{triggerNode_1.output.subject}}{{triggerNode_1.output.body}}\"]",
        embeddingModelName: ""
      }
    },
    type: "dynamicNode",
    measured: { width: 250, height: 93 },
    position: { x: 225, y: 260 },
    selected: false
  },
  {
    id: "vectorNode_896",
    data: {
      label: "dynamicNode node",
      logic: [],
      modes: {},
      nodeId: "vectorNode",
      values: {
        id: "vectorNode_896",
        limit: "3",
        action: "index",
        filters: "",
        nodeName: "VectorDB",
        vectorDB: "",
        primaryKeys: ["ticket_id"],
        vectorsField: "{{vectorizeNode_148.output.vectors}}",
        metadataField: "[{{triggerNode_1.output}}]",
        duplicateOperation: "overwrite"
      }
    },
    type: "dynamicNode",
    measured: { width: 250, height: 93 },
    position: { x: 225, y: 390 },
    selected: false
  },
  {
    id: "InstructorLLMNode_311",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"same_root_cause\": {\n      \"type\": \"boolean\"\n    },\n    \"confidence\": {\n      \"type\": \"number\",\n      \"description\": \"0-1\"\n    },\n    \"matched_ticket_ids\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      },\n      \"description\": \"subset of candidate matches that genuinely match\"\n    },\n    \"suspected_component\": {\n      \"type\": \"string\"\n    },\n    \"reasoning\": {\n      \"type\": \"string\",\n      \"description\": \"one or two sentences providing reasing and clarification\"\n    }\n  }\n}",
        prompts: [
          { id: "187c2f4b-c23d-4545-abef-73dc897d6b7b", role: "system", content: "@prompts/outage-detector_InstructorLLMNode_311_system.md" },
          { id: "187c2f4b-c23d-4545-abef-73dc897d6b7d", role: "user", content: "@prompts/outage-detector_InstructorLLMNode_311_user.md" }
        ],
        memories: "[]",
        messages: "@model-configs/outage-detector_InstructorLLMNode_311.ts",
        nodeName: "LLM",
        attachments: "@model-configs/outage-detector_InstructorLLMNode_311.ts",
        generativeModelName: "@model-configs/outage-detector_InstructorLLMNode_311.ts"
      }
    },
    type: "dynamicNode",
    measured: { width: 250, height: 93 },
    position: { x: 225, y: 520 },
    selected: false
  },
  {
    id: "conditionNode_526",
    data: {
      label: "Condition",
      modes: [],
      nodeId: "conditionNode",
      values: {
        id: "conditionNode_526",
        nodeName: "Condition",
        conditions: [
          {
            label: "Condition 1",
            value: "conditionNode_526-addNode_838",
            condition: "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{InstructorLLMNode_311.output.confidence}}\",\n      \"operator\": \">=\",\n      \"value\": \"0.75\"\n    }\n  ]\n}"
          },
          {
            label: "Else",
            value: "conditionNode_526-addNode_601",
            condition: {}
          }
        ],
        allowMultipleConditionExecution: true
      }
    },
    type: "conditionNode",
    measured: { width: 250, height: 93 },
    position: { x: 225, y: 650 },
    selected: false
  },
  {
    id: "addNode_601",
    data: { label: "addNode node", modes: {}, nodeId: "addNode", values: {} },
    type: "addNode",
    measured: { width: 250, height: 100 },
    position: { x: 0, y: 780 },
    selected: false
  },
  {
    id: "InstructorLLMNode_837",
    data: {
      label: "New",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"internal_note\": {\n      \"type\": \"string\",\n      \"description\": \"Impacted accounts, suspected component, and recommended next step for support agents\"\n    },\n    \"customer_message\": {\n      \"type\": \"string\",\n      \"description\": \"Short, specific customer-facing message acknowledging the issue without internal jargon\"\n    }\n  }\n}",
        prompts: [
          { id: "187c2f4b-c23d-4545-abef-73dc897d6b7b", role: "system", content: "@prompts/outage-detector_InstructorLLMNode_837_system.md" },
          { id: "187c2f4b-c23d-4545-abef-73dc897d6b7d", role: "user", content: "@prompts/outage-detector_InstructorLLMNode_837_user.md" }
        ],
        memories: "[]",
        messages: "@model-configs/outage-detector_InstructorLLMNode_837.ts",
        nodeName: "Output LLM",
        attachments: "@model-configs/outage-detector_InstructorLLMNode_837.ts",
        generativeModelName: "@model-configs/outage-detector_InstructorLLMNode_837.ts"
      }
    },
    type: "dynamicNode",
    measured: { width: 250, height: 93 },
    position: { x: 450, y: 780 },
    selected: true
  },
  {
    id: "responseNode_triggerNode_1",
    data: {
      label: "Response",
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: "{\"content-type\":\"application/json\"}",
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: "{\n  \"status\": \"{{conditionNode_526.output.condition}}\",\n  \"confidence\": \"{{InstructorLLMNode_311.output.confidence}}\",\n  \"matched_ticket_ids\": \"{{InstructorLLMNode_311.output.matched_ticket_ids}}\",\n  \"suspected_component\": \"{{InstructorLLMNode_311.output.suspected_component}}\",\n  \"reasoning\": \"{{InstructorLLMNode_311.output.reasoning}}\",\n  \"internal_note\": \"{{InstructorLLMNode_837.output.internal_note}}\",\n  \"customer_message\": \"{{InstructorLLMNode_837.output.customer_message}}\"\n}"
      },
      isResponseNode: true
    },
    type: "responseNode",
    measured: { width: 250, height: 89 },
    position: { x: 225, y: 910 },
    selected: false
  }
];

export const edges = [
  { id: "triggerNode_1-searchNode_739", type: "defaultEdge", source: "triggerNode_1", target: "searchNode_739", sourceHandle: "bottom", targetHandle: "top" },
  { id: "searchNode_739-vectorizeNode_148", type: "defaultEdge", source: "searchNode_739", target: "vectorizeNode_148", sourceHandle: "bottom", targetHandle: "top" },
  { id: "vectorizeNode_148-vectorNode_896-894", type: "defaultEdge", source: "vectorizeNode_148", target: "vectorNode_896", sourceHandle: "bottom", targetHandle: "top" },
  { id: "vectorNode_896-InstructorLLMNode_311", type: "defaultEdge", source: "vectorNode_896", target: "InstructorLLMNode_311", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_311-conditionNode_526", type: "defaultEdge", source: "InstructorLLMNode_311", target: "conditionNode_526", sourceHandle: "bottom", targetHandle: "top" },
  { id: "conditionNode_526-addNode_601", data: { condition: "Else", branchName: "Else" }, type: "conditionEdge", source: "conditionNode_526", target: "addNode_601", sourceHandle: "bottom", targetHandle: "top" },
  { id: "addNode_601-responseNode_triggerNode_1", type: "defaultEdge", source: "addNode_601", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "xy-edge__addNode_601bottom-responseNode_triggerNode_1from-trigger", data: { condition: false }, type: "defaultEdge", source: "addNode_601", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "conditionNode_526-InstructorLLMNode_837-699", data: { condition: "Condition 1", branchName: "Condition 1" }, type: "conditionEdge", source: "conditionNode_526", target: "InstructorLLMNode_837", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_837-responseNode_triggerNode_1-732", type: "defaultEdge", source: "InstructorLLMNode_837", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", sourceHandle: "to-response", targetHandle: "from-trigger" }
];

export default { meta, inputs, references, nodes, edges };

// Additive export for Studio's Phase 2 runtime validator, which appears to
// look for the node graph under a `config_json` key (matching Studio's
// internal storage schema) rather than the top-level `nodes`/`edges`
// exports documented in CONTRIBUTING.md. Kept alongside the existing
// exports rather than replacing them, since other tooling may rely on the
// documented top-level shape.
export const config_json = { nodes, edges };
