/*
 * # Flight Compensation Assessment
 * This flow takes a written description of a flight disruption and returns a structured
 * EU261 / UK261 compensation assessment: the extracted flight facts, a deterministic
 * eligibility decision with the exact statutory amount, and a ready-to-send claim or
 * explanation letter.
 *
 * ## Purpose
 * Air passengers in the EU and UK are entitled to fixed cash compensation — €250/€400/€600
 * under EU Regulation 261/2004, £220/£350/£520 under its UK equivalent — when a flight is
 * delayed 3+ hours, cancelled at short notice, or overbooked. In practice most eligible
 *
 * passengers never claim: the rules depend on route distance, notice period, and cause,
 * and commercial claim agencies charge 25–35% of the payout to work the rules out.
 *
 * This flow closes that gap. It separates the work into two layers: a language model
 * extracts and classifies the messy human input (airline, route, dates, disruption type,
 * cause), and a deterministic rule engine — plain code, not a prompt — applies the
 * regulation's money rules (distance tiers, delay thresholds, notice windows, the 50%
 * long-haul reduction, extraordinary-circumstances exclusions). The letter drafting stage
 * then receives the rule engine's verdict, so no claimable amount or eligibility
 * conclusion is ever invented by the model.
 *
 * The outcome is one API response: extracted facts, the eligibility decision with its
 * legal basis, the compensation amount and currency, a category-specific letter, and a
 * list of any facts the passenger still needs to supply.
 *
 * ## When To Use
 * - Use when a caller needs an on-demand assessment of a past or current flight
 *   disruption under EU261 or UK261 (departures from the EU/UK, or EU/UK-carrier
 *   arrivals into the EU/UK).
 * - Use when the input is a free-text description: notes, an email exchange with the
 *   airline, a boarding-pass photo transcription, or a forwarded itinerary.
 * - Use when the caller wants a ready-to-send claim letter citing the correct
 *   regulation articles, or a grounded explanation of why no compensation is owed.
 *
 * ## When Not To Use
 * - Do not use for disruptions outside EU261/UK261 scope — for example US DOT rules
 *   (which only cover tarmac delays and involuntary denied boarding, with no fixed
 *   delay-compensation tiers) or other jurisdictions. The rule engine intentionally
 *   implements the EU/UK framework only.
 * - Do not use when the disruption type itself is unknown and the caller cannot supply
 *   more detail; the flow returns a `needs-info` verdict in that case rather than
 *   guessing.
 * - Do not use to compute duty-of-care reimbursements (meals, hotels) — the flow flags
 *   those rights in `dutyOfCare` but does not sum receipts.
 * - Do not use for real-time flight status; this is an after-the-fact claim assessment.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `disruptionText` | `string` | Yes | Free-text description of the disruption: airline, flight number, route, dates, what happened, and any correspondence received. |
 * | `additionalContext` | `string` | No | Optional extra facts from the passenger (booking reference, ticket price for downgrade cases, evidence already held). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `eligibility` | `string` | `eligible`, `not-eligible`, or `needs-info` — decided by the rule engine, never the model. |
 * | `compensationAmount` | `number \| null` | Fixed statutory amount, or the computed 30/50/75% downgrade refund; null when not eligible, needs-info, or the downgrade price is missing. |
 * | `currency` | `string \| null` | `EUR` (EU-261) / `GBP` (UK-261) for fixed compensation, or the ticket currency for downgrade refunds; null otherwise. |
 * | `legalBasis` | `string` | The specific regulation article and clause the decision rests on. |
 * | `decisionReason` | `string` | Plain-language explanation of how the rules were applied to these facts. |
 * | `extractedFacts` | `object` | The structured flight facts extracted from the input text. |
 * | `letter` | `string` | The drafted claim, explanation, or information-request letter. |
 * | `missingFacts` | `array` | Facts the passenger still needs to provide (non-empty when `needs-info`). |
 * | `dutyOfCare` | `string \| null` | Duty-of-care guidance from the verdict; null when the route is out of scope or no guidance applies. |
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly by an API request.
 *
 * ### Downstream Flows
 * - None. The assembled assessment is returned directly to the caller.
 *
 * ### External Services
 * - Configured LLM provider via `InstructorLLMNode` and `LLMNode` — extraction uses
 *   schema-validated structured output; the three drafting nodes generate prose from the
 *   rule engine's verdict. Tested with OpenAI `gpt-4o-mini`.
 *
 * ### Environment Variables
 * - LLM provider credentials as required by the model configs (e.g. `OPENAI_API_KEY`).
 * - No other integration keys are needed — the rule engine runs in a code node.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives `disruptionText` and `additionalContext`.
 * 2. `Extract & Classify` (`InstructorLLMNode`) — turns the free text into schema-validated
 *    facts: jurisdiction, airline, route, scheduled departure, disruption type, arrival
 *    delay, cancellation notice, cause, and the great-circle distance tier.
 * 3. `Rule Engine` (`codeNode`) — applies the deterministic EU261/UK261 money rules:
 *    distance-tier amounts, the 3-hour delay threshold, the cancellation notice windows,
 *    the Article 7(2) 50% reduction for re-routed cancellations and denied-boarding
 *    replacements arriving within the tier limit (2/3/4 hours), extraordinary-circumstances exclusions, and downgrade
 *    refund percentages (computed from the extracted ticket price where stated).
 *    Emits `eligible` / `not-eligible` / `needs-info`.
 * 4. `Eligibility Branch` (`conditionNode`) — routes to one of three drafting strategies.
 * 5. `Draft Claim` (`LLMNode`) — cites Article 7 and the computed amount; never invents one.
 * 6. `Draft Rejection Explanation` (`LLMNode`) — explains which exclusion applies and what
 *    rights remain (e.g. duty of care under Article 9).
 * 7. `Draft Info Request` (`LLMNode`) — asks the passenger for the specific missing facts.
 * 8. `Assemble Output` (`codeNode`) — merges facts, assessment, and letter; picks
 *    whichever letter branch produced text and normalizes the missing-facts list.
 * 9. `API Response` (`graphqlResponseNode`) — returns the assembled object under `result`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Extraction node schema validation error | Model returned `null` or omitted a required field | The prompt instructs empty strings over `null`; if it recurs, relax the field in the schema or add it to the prompt's rules |
 * | `eligibility` is always `needs-info` | Input text lacks disruption type or the critical threshold facts | Supply more detail in `disruptionText`; check `missingFacts` in the response for exactly what is needed |
 * | Wrong distance tier (e.g. 400 EUR instead of 600 EUR) | Extraction misjudged the airport-pair distance | Check `distanceKmEstimate` in `extractedFacts`; the tiers are broad (1,500 / 3,500 km) so only borderline pairs are at risk |
 * | Letter cites a different amount than `compensationAmount` | Drafting model ignored the injected assessment | The prompts forbid inventing amounts; re-check that the branch fed the correct node output |
 * | Flow fails at the rule engine | Non-numeric values reached the engine (e.g. delay given as text) | The engine coerces with `Number()` and falls back to `needs-info`; verify extraction schema fields are typed as `number` |
 *
 * ## Notes
 * - `testInput` below is a smoke test for the eligible long-haul delay branch after
 *   deployment.
 * - The rule engine mirrors the pure logic in `scripts/flight-comp-assessment_rule-engine.ts`
 *   (kept in sync manually — the file runs inside Lamatic's codeNode sandbox and cannot
 *   import from outside the kit).
 * - The extraordinary-circumstances test follows CJEU case law (Wallentin-Hermann,
 *   van der Lans): technical faults and crew shortages are airline-controllable; only
 *   external events like weather, ATC strikes, and security risks are extraordinary.
 *   The burden of proving them sits with the airline, so `unknown` causes route to
 *   the claim path, not the rejection path.
 */

// Flow: flight-comp-assessment

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Flight Compensation Assessment",
  "description": "Turns a written flight-disruption account into a structured EU261/UK261 assessment: extracted flight facts, a deterministic eligibility decision with the exact statutory compensation amount, and a ready-to-send claim or explanation letter.",
  "tags": ["travel", "consumer-rights", "aviation", "structured-output"],
  "testInput": {
    "disruptionText": "I was booked on Air France AF1980, CDG to JFK, scheduled departure 2026-07-14 19:30. We were delayed because of a hydraulic fault and finally departed at 02:10 the next morning, landing at JFK about 4.5 hours late. The airline only offered meal vouchers.",
    "additionalContext": "Booking reference XZ7T2P. I have photos of the departure board showing the delayed time."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_210": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to extract and classify the flight disruption facts.",
      "required": true,
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_540": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the compensation claim letter.",
      "required": true,
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_650": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the no-compensation explanation letter.",
      "required": true,
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_760": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the missing-information request.",
      "required": true,
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories.
// NOTE: the InstructorLLMNode schema stays inline in the flow, per this repo's
// convention — node input/output schemas are not externalized like
// prompts/scripts/model-configs.
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "extract_classify_system": "@prompts/flight-comp-assessment_extract-classify_system.md",
    "extract_classify_user": "@prompts/flight-comp-assessment_extract-classify_user.md",
    "draft_claim_system": "@prompts/flight-comp-assessment_draft-claim_system.md",
    "draft_claim_user": "@prompts/flight-comp-assessment_draft-claim_user.md",
    "draft_rejection_system": "@prompts/flight-comp-assessment_draft-rejection_system.md",
    "draft_rejection_user": "@prompts/flight-comp-assessment_draft-rejection_user.md",
    "draft_info_request_system": "@prompts/flight-comp-assessment_draft-info-request_system.md",
    "draft_info_request_user": "@prompts/flight-comp-assessment_draft-info-request_user.md"
  },
  "modelConfigs": {
    "flight_comp_assessment_llmnode_extract": "@model-configs/flight-comp-assessment_llmnode-extract_generative-model-name.ts",
    "flight_comp_assessment_llmnode_claim": "@model-configs/flight-comp-assessment_llmnode-claim_generative-model-name.ts",
    "flight_comp_assessment_llmnode_rejection": "@model-configs/flight-comp-assessment_llmnode-rejection_generative-model-name.ts",
    "flight_comp_assessment_llmnode_info_request": "@model-configs/flight-comp-assessment_llmnode-info-request_generative-model-name.ts"
  },
  "scripts": {
    "flight_comp_assessment_rule_engine": "@scripts/flight-comp-assessment_rule-engine.ts",
    "flight_comp_assessment_assemble_output": "@scripts/flight-comp-assessment_assemble-output.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"disruptionText\": \"string\",\n  \"additionalContext\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 0 },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_210",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "nodeName": "Extract & Classify",
        "prompts": [
          { "id": "b2c3d4e5-0001-4000-8000-000000000001", "role": "system", "content": "@prompts/flight-comp-assessment_extract-classify_system.md" },
          { "id": "b2c3d4e5-0001-4000-8000-000000000002", "role": "user", "content": "@prompts/flight-comp-assessment_extract-classify_user.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/flight-comp-assessment_llmnode-extract_generative-model-name.ts",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"jurisdiction\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"enum\": [\n        \"EU-261\",\n        \"UK-261\",\n        \"unknown\",\n        \"out-of-scope\"\n      ]\n    },\n    \"airline\": {\n      \"type\": \"string\"\n    },\n    \"flightNumber\": {\n      \"type\": \"string\"\n    },\n    \"originAirport\": {\n      \"type\": \"string\"\n    },\n    \"destinationAirport\": {\n      \"type\": \"string\"\n    },\n    \"scheduledDepartureDate\": {\n      \"type\": \"string\",\n      \"description\": \"YYYY-MM-DD, or empty string if not stated\"\n    },\n    \"disruptionType\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"enum\": [\n        \"delay\",\n        \"cancellation\",\n        \"denied-boarding\",\n        \"downgrade\",\n        \"other\"\n      ]\n    },\n    \"arrivalDelayHours\": {\n      \"type\": \"number\",\n      \"description\": \"Hours of arrival delay at final destination; 0 if none, -1 if unknown\"\n    },\n    \"reroutedArrivalDelayHours\": {\n      \"type\": \"number\",\n      \"description\": \"Cancellations and denied-boarding: hours the re-routing arrived relative to the original scheduled arrival (negative = arrived earlier, positive = arrived later); -999 if times unknown\"\n    },\n    \"reroutedDepartureOffsetHours\": {\n      \"type\": \"number\",\n      \"description\": \"Cancellations: hours the re-routing departed relative to the original scheduled departure (negative = earlier, positive = later, 0 = exactly on schedule); denied-boarding uses -999 unless the offset is stated; -999 if times unknown\"\n    },\n    \"cancellationNoticeDays\": {\n      \"type\": \"number\",\n      \"description\": \"Days between cancellation notice and scheduled departure; -1 if unknown\"\n    },\n    \"cause\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"enum\": [\n        \"airline-controllable\",\n        \"extraordinary\",\n        \"unknown\"\n      ]\n    },\n    \"causeText\": {\n      \"type\": \"string\"\n    },\n    \"distanceKmEstimate\": {\n      \"type\": \"number\",\n      \"description\": \"Great-circle km between origin and final destination\"\n    },\n    \"distanceTier\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"enum\": [\n        \"short\",\n        \"medium\",\n        \"long\",\n        \"unknown\"\n      ]\n    },\n    \"bookingReference\": {\n      \"type\": \"string\"\n    },\n    \"ticketPrice\": {\n      \"type\": \"number\",\n      \"description\": \"Downgrades only: price paid for the downgraded segment; -1 if not stated\"\n    },\n    \"ticketCurrency\": {\n      \"type\": \"string\",\n      \"description\": \"Downgrades only: 3-letter currency code of the price paid (e.g. EUR, GBP, USD); empty string if not stated\"\n    },\n    \"reroutingStatus\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"enum\": [\n        \"offered\",\n        \"not-offered\",\n        \"unknown\"\n      ],\n      \"description\": \"offered = airline arranged any replacement flight; not-offered = account explicitly states no re-routing was offered; unknown = not stated, and always unknown when the disruption is neither a cancellation nor denied-boarding (rerouting is evaluated for those two only; never emit an empty string)\"\n    }\n  }\n}"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 150 },
    "selected": false
  },
  {
    "id": "codeNode_320",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/flight-comp-assessment_rule-engine.ts",
        "nodeName": "Rule Engine"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 300 },
    "selected": false
  },
  {
    "id": "conditionNode_430",
    "data": {
      "label": "Eligibility Branch",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Eligibility Branch",
        "allowMultipleConditionExecution": false,
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_430-LLMNode_540",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_320.output.eligibility}}\",\n      \"operator\": \"==\",\n      \"value\": \"eligible\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_430-LLMNode_650",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_320.output.eligibility}}\",\n      \"operator\": \"==\",\n      \"value\": \"not-eligible\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_430-LLMNode_760",
            "condition": {}
          }
        ]
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 450 },
    "selected": false
  },
  {
    "id": "LLMNode_540",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "b2c3d4e5-0002-4000-8000-000000000001", "role": "system", "content": "@prompts/flight-comp-assessment_draft-claim_system.md" },
          { "id": "b2c3d4e5-0002-4000-8000-000000000002", "role": "user", "content": "@prompts/flight-comp-assessment_draft-claim_user.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Draft Claim",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flight-comp-assessment_llmnode-claim_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 0, "y": 600 },
    "selected": false
  },
  {
    "id": "LLMNode_650",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "b2c3d4e5-0003-4000-8000-000000000001", "role": "system", "content": "@prompts/flight-comp-assessment_draft-rejection_system.md" },
          { "id": "b2c3d4e5-0003-4000-8000-000000000002", "role": "user", "content": "@prompts/flight-comp-assessment_draft-rejection_user.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Draft Rejection Explanation",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flight-comp-assessment_llmnode-rejection_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 450, "y": 600 },
    "selected": false
  },
  {
    "id": "LLMNode_760",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "b2c3d4e5-0004-4000-8000-000000000001", "role": "system", "content": "@prompts/flight-comp-assessment_draft-info-request_system.md" },
          { "id": "b2c3d4e5-0004-4000-8000-000000000002", "role": "user", "content": "@prompts/flight-comp-assessment_draft-info-request_user.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Draft Info Request",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flight-comp-assessment_llmnode-info-request_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 900, "y": 600 },
    "selected": false
  },
  {
    "id": "codeNode_870",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/flight-comp-assessment_assemble-output.ts",
        "nodeName": "Assemble Output"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 750 },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": {\n    \"eligibility\": \"{{codeNode_320.output.eligibility}}\",\n    \"compensationAmount\": \"{{codeNode_320.output.compensationAmount}}\",\n    \"currency\": \"{{codeNode_320.output.currency}}\",\n    \"legalBasis\": \"{{codeNode_320.output.legalBasis}}\",\n    \"decisionReason\": \"{{codeNode_320.output.decisionReason}}\",\n    \"extractedFacts\": \"{{codeNode_870.output.extractedFacts}}\",\n    \"letter\": \"{{codeNode_870.output.letter}}\",\n    \"missingFacts\": \"{{codeNode_870.output.missingFacts}}\",\n    \"dutyOfCare\": \"{{codeNode_320.output.dutyOfCare}}\"\n  }\n}"
      }
    },
    "type": "responseNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 900 },
    "selected": false
  }
];

export const edges = [
  { "id": "triggerNode_1-InstructorLLMNode_210", "type": "defaultEdge", "source": "triggerNode_1", "target": "InstructorLLMNode_210", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "InstructorLLMNode_210-codeNode_320", "type": "defaultEdge", "source": "InstructorLLMNode_210", "target": "codeNode_320", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "codeNode_320-conditionNode_430", "type": "defaultEdge", "source": "codeNode_320", "target": "conditionNode_430", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_430-LLMNode_540", "data": { "condition": "Condition 1", "branchName": "Condition 1" }, "type": "conditionEdge", "source": "conditionNode_430", "target": "LLMNode_540", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_430-LLMNode_650", "data": { "condition": "Condition 2", "branchName": "Condition 2" }, "type": "conditionEdge", "source": "conditionNode_430", "target": "LLMNode_650", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_430-LLMNode_760", "data": { "condition": "Else", "branchName": "Else" }, "type": "conditionEdge", "source": "conditionNode_430", "target": "LLMNode_760", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_540-codeNode_870", "type": "defaultEdge", "source": "LLMNode_540", "target": "codeNode_870", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_650-codeNode_870", "type": "defaultEdge", "source": "LLMNode_650", "target": "codeNode_870", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_760-codeNode_870", "type": "defaultEdge", "source": "LLMNode_760", "target": "codeNode_870", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "codeNode_870-responseNode_triggerNode_1", "type": "defaultEdge", "source": "codeNode_870", "target": "responseNode_triggerNode_1", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "response-responseNode_triggerNode_1", "type": "responseEdge", "source": "triggerNode_1", "target": "responseNode_triggerNode_1", "sourceHandle": "to-response", "targetHandle": "from-trigger" }
];

export default { meta, inputs, references, nodes, edges };
