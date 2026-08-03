/*
 * # Subscription Audit
 * This flow accepts raw bank statement or transaction export text and returns a structured list of likely recurring subscriptions, each with a plain-language "keep or cancel" verdict.
 *
 * ## Purpose
 * People routinely lose track of recurring charges buried in months of transaction history — a forgotten trial, a gym membership they stopped using, a duplicate streaming service. This flow solves that by taking pasted statement/export text and asking an LLM to identify which line items look recurring, then giving a short, human-readable recommendation for each one (keep, cancel, or review).
 *
 * The flow is intentionally conservative: it is instructed to only flag a charge as recurring when there is real evidence (a repeated merchant name across entries, or explicit subscription-style keywords), rather than guessing from a single line.
 *
 * Within the broader agent context, this is a single-shot entry-point flow. It receives the statement text, runs one structured-extraction step, and returns the result directly — there is no separate retrieval, indexing, or multi-turn conversation involved.
 *
 * ## When To Use
 * - Use when a caller has raw bank statement or transaction export text (pasted, exported, or copied) and wants recurring charges surfaced automatically.
 * - Use when the desired output is a structured list (merchant, amount, frequency, verdict, reason) rather than free-form prose.
 * - Use when a UI needs a synchronous request/response cycle — paste text in, get a JSON array back.
 *
 * ## When Not To Use
 * - Do not use when the input is a PDF, image, or scanned document — the flow expects plain text, not a file to parse.
 * - Do not use when the caller needs real bank account integration (Plaid, Open Banking, etc.) — this flow only works on text the caller already has.
 * - Do not use for definitive financial advice — the verdicts are heuristic suggestions from an LLM, not authoritative recommendations.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `statement_text` | `string` | Yes | Raw bank statement or transaction export text, supplied to the `API Request` trigger and passed into the `Generate JSON` node's prompt. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `subscriptions` | `array` | List of detected recurring charges. Each item has `merchant`, `amount`, `frequency`, `verdict`, and `reason` string fields. |
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly by an API request.
 *
 * ### Downstream Flows
 * - None defined in this kit. The flow returns its result directly to the caller for display in the Next.js app.
 *
 * ### External Services
 * - Configured LLM provider (Gemini) via `InstructorLLMNode` — used to extract structured subscription data from the statement text, per `@model-configs/subscription-audit_generate-json.ts`.
 *
 * ### Environment Variables
 * - LLM provider credentials as required by `@model-configs/subscription-audit_generate-json.ts`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`)
 *    - Flow trigger and public entrypoint. Exposes `statement_text` from the incoming API payload.
 *
 * 2. `Generate JSON` (`InstructorLLMNode`)
 *    - Sends the statement text to the configured LLM with a system prompt (conservative extraction rules) and a user prompt (the extraction task + injected transcript).
 *    - Prompts are referenced from `@prompts/subscription-audit_generate-json_system.md` and `@prompts/subscription-audit_generate-json_user.md`.
 *    - Model behavior is controlled by `@model-configs/subscription-audit_generate-json.ts`.
 *    - Enforces a JSON schema requiring an array of `{ merchant, amount, frequency, verdict, reason }` objects.
 *
 * 3. `API Response` (`graphqlResponseNode`)
 *    - Maps the `subscriptions` field directly from `{{InstructorLLMNode_798.output.subscriptions}}` and returns it to the caller in realtime mode.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before extraction starts | Missing or empty `statement_text` in the trigger payload | Ensure the API request includes non-empty statement text. |
 * | `subscriptions` array is empty | Input text contains no repeated merchants or subscription keywords | Provide statement text spanning multiple billing periods so recurrence is detectable. |
 * | LLM node fails to run | Missing or invalid Gemini credentials | Verify the credential referenced in `@model-configs/subscription-audit_generate-json.ts` is active. |
 * | Verdicts seem arbitrary or inconsistent | Model non-determinism on ambiguous input | Provide clearer, more complete statement text; consider re-running. |
 *
 * ## Notes
 * - The response mode is realtime (synchronous request/response), matching the Next.js app's expected usage pattern.
 * - No PII redaction, currency normalization, or multi-currency handling is performed — amounts are returned as written in the source text.
 */

// Flow: subscription-audit

// ── Meta ────────────────────────────────────────
export const meta = {
  "name": "Subscription Audit",
  "description": "Paste bank statement or transaction export text and get back a structured list of likely recurring subscriptions, each with a plain-language keep-or-cancel verdict.",
  "tags": [
    "finance",
    "personal productivity"
  ],
  "testInput": {
    "statement_text": "NETFLIX.COM  $15.99  Jul 3\nSPOTIFY USA  $10.99  Jul 5\nGYM MEMBERSHIP MONTHLY  $39.99  Jul 1\nADOBE CREATIVE CLOUD  $54.99  Jul 2"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Pradhumay Gaur",
    "email": ""
  }
};

// ── Inputs ────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "subscription_audit_generate_json_system": "@prompts/subscription-audit_generate-json_system.md",
    "subscription_audit_generate_json_user": "@prompts/subscription-audit_generate-json_user.md"
  },
  "modelConfigs": {
    "subscription_audit_generate_json": "@model-configs/subscription-audit_generate-json.ts"
  }
};

// ── Nodes & Edges ────────────────────────────────────────
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
        "advance_schema": "{\n  \"statement_text\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_798",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Generate JSON",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"subscriptions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"merchant\": { \"type\": \"string\" },\n          \"amount\": { \"type\": \"string\" },\n          \"frequency\": { \"type\": \"string\" },\n          \"verdict\": { \"type\": \"string\" },\n          \"reason\": { \"type\": \"string\" }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/subscription-audit_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/subscription-audit_generate-json_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/subscription-audit_generate-json.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_651",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"subscriptions\": \"{{InstructorLLMNode_798.output.subscriptions}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_798",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_798",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_798-graphqlResponseNode_651",
    "source": "InstructorLLMNode_798",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_651",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_651",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
