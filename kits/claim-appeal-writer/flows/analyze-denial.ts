/*
 * # 2. Claim Appeal Writer - Analyze Denial
 * Reads the text of an insurance denial letter and extracts the facts an appeal depends on into a strict JSON structure.
 *
 * ## Purpose
 * Denial letters bury the decisive information — the stated reason, any reason codes, the plan type, and the appeal window — in boilerplate. This flow extracts those facts with a schema-constrained LLM call so the app can show them to the policyholder for confirmation and the drafter can argue each reason separately.
 *
 * ## When To Use
 * - Whenever a denial letter (EOB, adverse benefit determination, prior-authorisation denial) has been uploaded.
 *
 * ## When Not To Use
 * - Do not pass the policy document here; use `index-policy`.
 * - Do not rely on `appealDeadlineStated` as a computed date — it is the verbatim window from the letter.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `denialText` | `string` | Yes | Plain text of the denial letter (OCR'd / extracted by the app). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `denialFacts` | `object` | Structured facts: insurer, claim/member numbers, service denied, categorised denial reasons, plan type, stated appeal window, confidence, missingInfo, plain-English summary. |
 *
 * ## Node Walkthrough
 * 1. `API Request` — receives `denialText`.
 * 2. `Extract Denial Facts` (Generate JSON) — schema-constrained extraction using `@prompts/analyze-denial_extract_system.md`. Never invents values; nulls for absent fields; lists what a human must verify in `missingInfo`.
 * 3. `API Response` — returns `denialFacts`.
 *
 * ## Environment Variables (used by the app)
 * - `CLAIM_APPEAL_ANALYZE_DENIAL` — deployed flow ID
 */

// Flow: analyze-denial

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "2. Claim Appeal Writer - Analyze Denial",
  "description": "Extract structured denial facts from a claim denial letter.",
  "tags": [],
  "testInput": {
    "denialText": "NOTICE OF ADVERSE BENEFIT DETERMINATION. Claim #HC-2026-44817. Member ID: 88213-004. Date of this notice: 03/02/2026. Service: MRI lumbar spine without contrast, date of service 02/14/2026. Determination: DENIED. Reason code MN-12: The requested service is not medically necessary based on the clinical information provided. You have 180 days from the date of this notice to request an internal appeal."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_430": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "analyze_denial_extract_system": "@prompts/analyze-denial_extract_system.md",
    "analyze_denial_extract_user": "@prompts/analyze-denial_extract_user.md"
  },
  "modelConfigs": {
    "analyze_denial_extract": "@model-configs/analyze-denial_extract.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "trigger",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "trigger",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\"denialText\": \"string\"}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_430",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_430",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/analyze-denial_extract_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/analyze-denial_extract_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Extract Denial Facts",
        "attachments": "",
        "generativeModelName": "@model-configs/analyze-denial_extract.ts",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"insurer\": {\n      \"type\": \"string\"\n    },\n    \"claimNumber\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"memberOrPolicyNumber\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"dateOfDenial\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"dateOfService\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"serviceDenied\": {\n      \"type\": \"string\"\n    },\n    \"amountInDispute\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"denialReasons\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"code\": {\n            \"type\": [\n              \"string\",\n              \"null\"\n            ]\n          },\n          \"statedReason\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"medical-necessity\",\n              \"prior-authorization\",\n              \"out-of-network\",\n              \"not-covered\",\n              \"experimental-investigational\",\n              \"coding-error\",\n              \"timely-filing\",\n              \"eligibility\",\n              \"other\"\n            ]\n          }\n        },\n        \"required\": [\n          \"statedReason\",\n          \"category\"\n        ]\n      }\n    },\n    \"appealDeadlineStated\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"internalAppealAddress\": {\n      \"type\": [\n        \"string\",\n        \"null\"\n      ]\n    },\n    \"planType\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"employer-erisa\",\n        \"marketplace-aca\",\n        \"medicare\",\n        \"medicaid\",\n        \"individual\",\n        \"unknown\"\n      ]\n    },\n    \"confidence\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"high\",\n        \"medium\",\n        \"low\"\n      ]\n    },\n    \"missingInfo\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"summary\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"insurer\",\n    \"serviceDenied\",\n    \"denialReasons\",\n    \"planType\",\n    \"confidence\",\n    \"missingInfo\",\n    \"summary\"\n  ]\n}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "responseNode",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"denialFacts\": \"{{InstructorLLMNode_430.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 300
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_430",
    "type": "defaultEdge",
    "source": "trigger",
    "target": "InstructorLLMNode_430",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_430-responseNode",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_430",
    "target": "responseNode",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode",
    "type": "responseEdge",
    "source": "trigger",
    "target": "responseNode",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
