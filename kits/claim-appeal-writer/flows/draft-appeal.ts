/*
 * # 3. Claim Appeal Writer - Draft Appeal
 * Retrieves the governing policy clauses and the applicable appeal rules, then drafts a cited appeal letter plus an evidence checklist, deadline, and escalation plan.
 *
 * ## Purpose
 * This is the synthesis flow. It turns confirmed denial facts into a fightable appeal by grounding every argument in (a) excerpts retrieved from the policyholder's own policy index and (b) web-retrieved appeal regulations for the member's state and plan type. A hard no-fabrication rule means that when the policy does not support a rebuttal, the letter instead demands that the insurer identify the provision it relied upon — a legitimate and effective tactic.
 *
 * ## When To Use
 * - After `index-policy` has indexed the policy and `analyze-denial` has produced `denialFacts` (ideally confirmed by the user in the app).
 *
 * ## When Not To Use
 * - Do not call before the policy is indexed; the letter will contain no policy citations.
 * - Do not treat the output as legal advice; it is a draft for human review.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `denialFacts` | `object` | Yes | Output of `analyze-denial` (optionally edited by the user). |
 * | `policyId` | `string` | Yes | The identifier used in `index-policy`. Retrieval is scoped to it. |
 * | `state` | `string` | Yes | US state of the policyholder, e.g. `California`. |
 * | `patientContext` | `string` | No | Free-text notes from the policyholder. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result.letter` | `string` | Markdown appeal letter with inline citations. |
 * | `result.deadline` | `object` | `{ date, source, urgencyNote }` |
 * | `result.checklist` | `array` | Evidence items to attach. |
 * | `result.nextSteps` | `array` | Ordered actions. |
 * | `result.escalation` | `string` | What to do if the internal appeal is denied. |
 * | `result.policyExcerpts` | `array` | The retrieved clauses with labels, for the UI's citation panel. |
 * | `result.webSources` | `array` | Regulatory sources used. |
 * | `result.disclaimer` | `string` | Not-legal-advice notice. |
 *
 * ## Node Walkthrough
 * 1. `API Request` — receives inputs.
 * 2. `Build Queries` (code) — derives one retrieval query (service + reasons + category-specific policy terms) and one web query (state + plan type + appeal rights).
 * 3. `Vector Search` — top-20 semantic search over the policy index.
 * 4. `Web Search` — top-5 serper results for the regulatory query.
 * 5. `Format Context` (code) — scopes results to `policyId`, labels each excerpt `(Policy excerpt n, chunk k)`, formats web sources.
 * 6. `Draft Letter` (Generate Text) — writes the letter under the no-fabrication system prompt.
 * 7. `Build Action Plan` (Generate JSON) — deadline, checklist, next steps, escalation, citations used.
 * 8. `Finalise Output` (code) — merges everything with the disclaimer.
 * 9. `API Response` — returns `result`.
 *
 * ## Dependencies
 * - Upstream: `index-policy` (same `policyId`), `analyze-denial`.
 * - External: embedding model + vector DB (same as index-policy), a chat model, Serper API credential for Web Search (`SERPER_API_KEY` configured in Studio).
 *
 * ## Environment Variables (used by the app)
 * - `CLAIM_APPEAL_DRAFT_APPEAL` — deployed flow ID
 */

// Flow: draft-appeal

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3. Claim Appeal Writer - Draft Appeal",
  "description": "Draft a cited insurance appeal letter with evidence checklist and deadline.",
  "tags": [],
  "testInput": {
    "policyId": "demo-policy-001",
    "state": "California",
    "patientContext": "My orthopedist ordered the MRI after 8 weeks of physical therapy did not resolve the pain, and I have numbness in my left leg.",
    "denialFacts": {
      "insurer": "Meridian Health Plan",
      "claimNumber": "HC-2026-44817",
      "memberOrPolicyNumber": "88213-004",
      "dateOfDenial": "03/02/2026",
      "dateOfService": "02/14/2026",
      "serviceDenied": "MRI lumbar spine without contrast",
      "amountInDispute": "",
      "denialReasons": [
        {
          "code": "MN-12",
          "statedReason": "The requested service is not medically necessary based on the clinical information provided.",
          "category": "medical-necessity"
        }
      ],
      "appealDeadlineStated": "180 days from the date of this notice",
      "internalAppealAddress": "",
      "planType": "employer-erisa",
      "confidence": "high",
      "missingInfo": [],
      "summary": "The plan denied an MRI as not medically necessary. There are 180 days to appeal."
    }
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "searchNode_702": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": "policychunks"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "LLMNode_399": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "openai",
          "credential_name": "openai",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "InstructorLLMNode_621": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "openai",
          "credential_name": "openai",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "draft_appeal_letter_system": "@prompts/draft-appeal_letter_system.md",
    "draft_appeal_letter_user": "@prompts/draft-appeal_letter_user.md",
    "draft_appeal_checklist_system": "@prompts/draft-appeal_checklist_system.md",
    "draft_appeal_checklist_user": "@prompts/draft-appeal_checklist_user.md"
  },
  "modelConfigs": {
    "draft_appeal_letter": "@model-configs/draft-appeal_letter.ts",
    "draft_appeal_checklist": "@model-configs/draft-appeal_checklist.ts"
  },
  "scripts": {
    "draft_appeal_build_queries": "@scripts/draft-appeal_build-queries.ts",
    "draft_appeal_build_web_query": "@scripts/draft-appeal_build-web-query.ts",
    "draft_appeal_format_context": "@scripts/draft-appeal_format-context.ts",
    "draft_appeal_finalise_output": "@scripts/draft-appeal_finalise-output.ts"
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
        "advance_schema": "{\n  \"denialFacts\": {\n    \"insurer\": \"string\",\n    \"claimNumber\": \"string\",\n    \"memberOrPolicyNumber\": \"string\",\n    \"dateOfDenial\": \"string\",\n    \"dateOfService\": \"string\",\n    \"serviceDenied\": \"string\",\n    \"amountInDispute\": \"string\",\n    \"denialReasons\": [\n      {\n        \"code\": \"string\",\n        \"statedReason\": \"string\",\n        \"category\": \"string\"\n      }\n    ],\n    \"appealDeadlineStated\": \"string\",\n    \"internalAppealAddress\": \"string\",\n    \"planType\": \"string\",\n    \"confidence\": \"string\",\n    \"missingInfo\": [\n      \"string\"\n    ],\n    \"summary\": \"string\"\n  },\n  \"policyId\": \"string\",\n  \"state\": \"string\",\n  \"patientContext\": \"string\"\n}"
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
    "id": "codeNode_599",
    "data": {
      "label": "Build Queries",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_599",
        "nodeName": "Build Queries",
        "code": "@scripts/draft-appeal_build-queries.ts"
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
    "id": "codeNode_759",
    "data": {
      "label": "Build Web Query",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_759",
        "nodeName": "Build Web Query",
        "code": "@scripts/draft-appeal_build-web-query.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "searchNode_702",
    "data": {
      "label": "Vector Search",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_702",
        "nodeName": "Vector Search",
        "limit": 20,
        "filters": "",
        "certainty": "0.5",
        "searchQuery": "{{codeNode_599.output}}",
        "vectorDB": "policychunks",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "webSearchNode_285",
    "data": {
      "label": "Web Search",
      "modes": {},
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_285",
        "nodeName": "Web Search",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{codeNode_759.output}}",
        "country": "us",
        "results": "5",
        "language": "en",
        "location": "",
        "dateRange": "",
        "credentials": "Serper"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_732",
    "data": {
      "label": "Format Context",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_732",
        "nodeName": "Format Context",
        "code": "@scripts/draft-appeal_format-context.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "LLMNode_399",
    "data": {
      "label": "Generate Text",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_399",
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "a1",
            "role": "system",
            "content": "@prompts/draft-appeal_letter_system.md"
          },
          {
            "id": "a2",
            "role": "user",
            "content": "@prompts/draft-appeal_letter_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/draft-appeal_letter.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_621",
    "data": {
      "label": "Generate JSON",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_621",
        "nodeName": "Generate JSON",
        "tools": [],
        "schema": "{\n  \"deadline\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"date\": {\n        \"type\": \"string\"\n      },\n      \"source\": {\n        \"type\": \"string\"\n      },\n      \"urgencyNote\": {\n        \"type\": \"string\"\n      }\n    },\n    \"additionalProperties\": true\n  },\n  \"checklist\": {\n    \"type\": \"array\",\n    \"items\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"item\": {\n          \"type\": \"string\"\n        },\n        \"why\": {\n          \"type\": \"string\"\n        },\n        \"required\": {\n          \"type\": \"boolean\"\n        }\n      },\n      \"additionalProperties\": true\n    }\n  },\n  \"nextSteps\": {\n    \"type\": \"array\",\n    \"items\": {\n      \"type\": \"string\"\n    }\n  },\n  \"escalation\": {\n    \"type\": \"string\"\n  },\n  \"citationsUsed\": {\n    \"type\": \"array\",\n    \"items\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "b1",
            "role": "system",
            "content": "@prompts/draft-appeal_checklist_system.md"
          },
          {
            "id": "b2",
            "role": "user",
            "content": "@prompts/draft-appeal_checklist_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/draft-appeal_checklist.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "codeNode_325",
    "data": {
      "label": "Finalise Output",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_325",
        "nodeName": "Finalise Output",
        "code": "@scripts/draft-appeal_finalise-output.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 400,
      "y": 1200
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{codeNode_325.output}}\"\n}"
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
      "y": 1350
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_599",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_599",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_599-codeNode_759",
    "type": "defaultEdge",
    "source": "codeNode_599",
    "target": "codeNode_759",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_759-searchNode_702",
    "type": "defaultEdge",
    "source": "codeNode_759",
    "target": "searchNode_702",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_702-webSearchNode_285",
    "type": "defaultEdge",
    "source": "searchNode_702",
    "target": "webSearchNode_285",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "webSearchNode_285-codeNode_732",
    "type": "defaultEdge",
    "source": "webSearchNode_285",
    "target": "codeNode_732",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_732-LLMNode_399",
    "type": "defaultEdge",
    "source": "codeNode_732",
    "target": "LLMNode_399",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_399-InstructorLLMNode_621",
    "type": "defaultEdge",
    "source": "LLMNode_399",
    "target": "InstructorLLMNode_621",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_621-codeNode_325",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_621",
    "target": "codeNode_325",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_325-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_325",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
