/*
 * # Route / Report
 * Stage 3 of the Self-Verifying Document Extractor. Deterministic routing — no
 * LLM. It receives the fully-processed, evidence-checked verdicts (the app runs
 * the exact-substring evidence gate first) and sorts them into three buckets:
 *
 *   evidence_validated   -> Verified          (asserted, with exact evidence)
 *   absent value (null)  -> Not found         (extractor found nothing)
 *   everything else      -> Needs your review (found, but not proven)
 *
 * This is where the agent's personality shows — the "flag it, don't guess"
 * behaviour is made visible, and because the routing is code rather than a
 * model it is not itself subject to model whim. Emits a human-readable markdown
 * report plus the structured buckets for downstream use.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `verifications` | `array`/`string` | Yes | Processed, evidence-checked verdicts from the app (each carries `evidence_validated`). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `verified` | `array` | Fields confirmed against the source (JSON-stringified by the code node for mapping, returned as an array). |
 * | `needs_review` | `array` | Fields found but not proven — ambiguous, unsupported, or low-confidence (JSON-stringified, returned as an array). |
 * | `not_found` | `array` | Fields the extractor did not find at all (null value) (JSON-stringified, returned as an array). |
 * | `report` | `string` | Human-readable markdown summary of all three buckets. |
 * | `summary` | `object` | Counts: total / verified_count / needs_review_count / not_found_count. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (graphqlNode) — trigger; supplies `verifications`.
 * 2. `Route & Report` (codeNode) — sorts verdicts and builds the markdown report.
 * 3. `API Response` (graphqlResponseNode) — returns all five fields.
 */

// Flow: report

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Report",
  "description":
    "Stage 3 — deterministically routes evidence-validated fields into Verified, absent fields into Not found, and everything unproven into Needs your review, plus a human-readable report.",
  "tags": ["routing", "reporting", "documents"],
  "testInput": {
    "verifications":
      "[{\"field\":\"total_amount\",\"value\":\"$1,240.00\",\"verdict\":\"supported\",\"confidence\":0.98,\"source_quote\":\"Total Due: $1,240.00\",\"reason\":\"\",\"evidence_validated\":true},{\"field\":\"due_date\",\"value\":\"03/15/2026\",\"verdict\":\"ambiguous\",\"confidence\":0.1,\"source_quote\":\"\",\"reason\":\"Deterministic check: 03/15 does not appear in the document.\",\"evidence_validated\":false},{\"field\":\"vendor_or_sender\",\"value\":null,\"verdict\":\"unsupported\",\"confidence\":0,\"source_quote\":\"\",\"reason\":\"No value was extracted.\",\"evidence_validated\":false}]",
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Krishhiv Mehra", "email": "krishhiv@gmail.com" },
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md",
  },
  "scripts": {
    "report_route": "@scripts/report_route.ts",
  },
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"verifications\": \"string\"\n}",
      },
    },
  },
  {
    "id": "codeNode_20",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Route & Report",
        "code": "@scripts/report_route.ts",
      },
    },
  },
  {
    "id": "graphqlResponseNode_30",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping":
          "{\n  \"verified\": \"{{codeNode_20.output.verified}}\",\n  \"needs_review\": \"{{codeNode_20.output.needs_review}}\",\n  \"not_found\": \"{{codeNode_20.output.not_found}}\",\n  \"report\": \"{{codeNode_20.output.report}}\",\n  \"summary\": \"{{codeNode_20.output.summary}}\"\n}",
      },
    },
  },
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_20",
    "source": "triggerNode_1",
    "target": "codeNode_20",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "codeNode_20-graphqlResponseNode_30",
    "source": "codeNode_20",
    "target": "graphqlResponseNode_30",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "response-graphqlResponseNode_30",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_30",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
