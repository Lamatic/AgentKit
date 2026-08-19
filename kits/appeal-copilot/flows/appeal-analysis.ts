/*
 * # Appeal Analysis
 * A single entry-point flow that turns a pasted insurance claim denial letter into a
 * classified, deadline-aware, evidence-scored appeal package.
 *
 * ## Purpose
 * Most people who receive a health-insurance claim denial never appeal it, not because
 * they are wrong but because the process is confusing: the right argument depends on
 * *why* the claim was denied, deadlines are easy to miss, and nobody tells you what
 * evidence is actually missing before you submit. This flow centralises that judgment
 * into one Lamatic pipeline so the surrounding Next.js app can stay a thin form + results
 * view.
 *
 * ## When To Use
 * - The caller has the text of a denial letter or Explanation of Benefits (EOB) in
 *   `denialText` and wants a classified, structured appeal package back.
 * - The caller wants a first-level appeal letter drafted with a strategy appropriate to
 *   the specific denial reason (medical necessity, administrative/procedural, or coverage),
 *   not a generic template.
 * - The caller wants an appeal-deadline urgency signal and a concrete missing-evidence
 *   checklist alongside the letter, not just prose.
 *
 * ## When Not To Use
 * - Do not use when `denialText` is empty; every downstream node depends on it.
 * - Do not use this as a substitute for legal or medical advice — the output always
 *   carries a not-legal/medical-advice disclaimer applied by the application layer and
 *   reinforced by the constitution.
 * - Do not use for anything beyond first-level appeal drafting; this flow does not track
 *   appeal outcomes or file anything with an insurer.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `denialText` | `string` | Yes | The pasted denial letter or EOB text. |
 * | `additionalContext` | `string` | No | Extra context (e.g. relevant medical history) not present in the denial letter itself. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result.denialCategory` | `string` | One of `medical-necessity`, `administrative`, `coverage`, `other`. |
 * | `result.claimNumber` | `string \| null` | Extracted claim number, if present. |
 * | `result.denialReasonText` | `string` | Plain-language summary of the insurer's stated reason. |
 * | `result.appealDeadline` | `string \| null` | Extracted deadline in `YYYY-MM-DD`, if computable. |
 * | `result.daysRemaining` | `number \| null` | Days until the deadline, if known. |
 * | `result.urgencyLevel` | `string` | One of `critical`, `moderate`, `low`, `expired`, `unknown`. |
 * | `result.appealLetter` | `string` | The drafted first-level appeal letter. |
 * | `result.strengthScore` | `number` | 1-10 estimate of appeal strength. |
 * | `result.missingEvidence` | `string[]` | Concrete evidence items that would strengthen the appeal. |
 * | `result.rationale` | `string` | Plain-language explanation of the strength score. |
 *
 * ## Dependencies
 * ### External Services
 * - Lamatic API runtime — hosts and executes the flow via the API trigger and response
 *   nodes — requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the
 *   calling application context.
 * - Text generation model, used by every `LLMNode` in this flow — configured per-node in
 *   Lamatic Studio via the referenced model configs.
 *
 * ### Environment Variables
 * - `APPEAL_ANALYSIS_FLOW_ID` — deployed flow ID used by the external application to
 *   invoke this flow.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic project credentials.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) — receives `denialText` and `additionalContext`.
 * 2. `Extract & Classify` (`LLMNode`) — reads the denial text and returns structured JSON:
 *    category, claim number, procedures, denial reason, deadline, plan type.
 * 3. `Parse Extraction` (`codeNode`) — parses that JSON so downstream nodes can read fields
 *    directly instead of re-parsing raw model output.
 * 4. `Deadline Urgency` (`codeNode`) — computes days remaining and an urgency level from the
 *    extracted deadline.
 * 5. `Category Branch` (`conditionNode`) — routes to one of four drafting strategies based on
 *    `category`: medical-necessity, administrative, coverage, or a default fallback (`Else`).
 * 6. `Draft *` (`LLMNode`, one of four) — drafts a category-specific first-level appeal letter.
 * 7. `Assess Strength` (`LLMNode`) — reviews the claim facts and drafted letter, and returns a
 *    conservative strength score plus a concrete missing-evidence checklist as JSON.
 * 8. `Assemble Output` (`codeNode`) — merges classification, deadline urgency, the drafted
 *    letter, and the strength assessment into one response object.
 * 9. `API Response` (`responseNode`) — returns the assembled object under `result`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Category always resolves to the default letter | Extraction model did not return one of the four supported category strings | Review `appeal-analysis_extract-classify_system.md` and confirm the model is following the JSON contract |
 * | `strengthScore`/`missingEvidence` missing from response | `Assess Strength` output was not valid JSON | Review `appeal-analysis_assess-strength_system.md`; the model must return JSON only, no markdown fences |
 * | API invocation fails before the flow runs | Lamatic credentials or `APPEAL_ANALYSIS_FLOW_ID` missing in the calling app | Set the four required env vars in `apps/.env.local` |
 *
 * ## Notes
 * - `testInput` below is a smoke test for the medical-necessity branch after deployment.
 * - This flow was hand-authored to match Lamatic Studio's export schema rather than
 *   exported from Studio directly; verify the node graph in Studio's flow editor after
 *   import before relying on it in production. See the kit README for details.
 */

// Flow: appeal-analysis

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Appeal Analysis",
  "description": "Classifies a health-insurance denial, drafts a category-specific first-level appeal letter, and scores its strength with a missing-evidence checklist.",
  "tags": ["healthcare", "insurance", "appeals"],
  "testInput": {
    "denialText": "Claim #A88213: Denied. Reason: The requested inpatient rehabilitation stay was determined not medically necessary based on plan clinical guidelines. You may appeal this decision in writing within 180 days of the date of this notice.",
    "additionalContext": "Patient's physician recommended inpatient rehab following hip replacement surgery due to mobility limitations and fall risk at home."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_210": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to extract and classify the denial.",
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
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_251": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the medical-necessity appeal.",
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
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_252": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the administrative appeal.",
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
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_253": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the coverage appeal.",
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
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_254": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to draft the default/fallback appeal.",
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
      "typeOptions": { "loadOptionsMethod": "listModels" },
      "isPrivate": true
    }
  ],
  "LLMNode_260": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model used to assess appeal strength.",
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
      "typeOptions": { "loadOptionsMethod": "listModels" },
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
    "extract_classify_system": "@prompts/appeal-analysis_extract-classify_system.md",
    "extract_classify_user": "@prompts/appeal-analysis_extract-classify_user.md",
    "draft_medical_necessity_system": "@prompts/appeal-analysis_draft-medical-necessity_system.md",
    "draft_medical_necessity_user": "@prompts/appeal-analysis_draft-medical-necessity_user.md",
    "draft_administrative_system": "@prompts/appeal-analysis_draft-administrative_system.md",
    "draft_administrative_user": "@prompts/appeal-analysis_draft-administrative_user.md",
    "draft_coverage_system": "@prompts/appeal-analysis_draft-coverage_system.md",
    "draft_coverage_user": "@prompts/appeal-analysis_draft-coverage_user.md",
    "draft_default_system": "@prompts/appeal-analysis_draft-default_system.md",
    "draft_default_user": "@prompts/appeal-analysis_draft-default_user.md",
    "assess_strength_system": "@prompts/appeal-analysis_assess-strength_system.md",
    "assess_strength_user": "@prompts/appeal-analysis_assess-strength_user.md"
  },
  "modelConfigs": {
    "appeal_analysis_llmnode_extract": "@model-configs/appeal-analysis_llmnode-extract_generative-model-name.ts",
    "appeal_analysis_llmnode_medical_necessity": "@model-configs/appeal-analysis_llmnode-medical-necessity_generative-model-name.ts",
    "appeal_analysis_llmnode_administrative": "@model-configs/appeal-analysis_llmnode-administrative_generative-model-name.ts",
    "appeal_analysis_llmnode_coverage": "@model-configs/appeal-analysis_llmnode-coverage_generative-model-name.ts",
    "appeal_analysis_llmnode_default": "@model-configs/appeal-analysis_llmnode-default_generative-model-name.ts",
    "appeal_analysis_llmnode_assess": "@model-configs/appeal-analysis_llmnode-assess_generative-model-name.ts"
  },
  "scripts": {
    "appeal_analysis_parse_extraction": "@scripts/appeal-analysis_parse-extraction.ts",
    "appeal_analysis_deadline_urgency": "@scripts/appeal-analysis_deadline-urgency.ts",
    "appeal_analysis_assemble_output": "@scripts/appeal-analysis_assemble-output.ts"
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
        "advance_schema": "{\n  \"denialText\": \"string\",\n  \"additionalContext\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 0 },
    "selected": false
  },
  {
    "id": "LLMNode_210",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "a1b2c3d4-0001-4000-8000-000000000001", "role": "system", "content": "@prompts/appeal-analysis_extract-classify_system.md" },
          { "id": "a1b2c3d4-0001-4000-8000-000000000002", "role": "user", "content": "@prompts/appeal-analysis_extract-classify_user.md" }
        ],
        "memories": "@model-configs/appeal-analysis_llmnode-extract_generative-model-name.ts",
        "messages": "@model-configs/appeal-analysis_llmnode-extract_generative-model-name.ts",
        "nodeName": "Extract & Classify",
        "attachments": "@model-configs/appeal-analysis_llmnode-extract_generative-model-name.ts",
        "credentials": "@model-configs/appeal-analysis_llmnode-extract_generative-model-name.ts",
        "generativeModelName": "@model-configs/appeal-analysis_llmnode-extract_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 150 },
    "selected": false
  },
  {
    "id": "codeNode_215",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/appeal-analysis_parse-extraction.ts",
        "nodeName": "Parse Extraction"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 300 },
    "selected": false
  },
  {
    "id": "codeNode_230",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/appeal-analysis_deadline-urgency.ts",
        "nodeName": "Deadline Urgency"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 450 },
    "selected": false
  },
  {
    "id": "conditionNode_240",
    "data": {
      "label": "Category Branch",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Category Branch",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_240-LLMNode_251",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_215.output.category}}\",\n      \"operator\": \"==\",\n      \"value\": \"medical-necessity\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_240-LLMNode_252",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_215.output.category}}\",\n      \"operator\": \"==\",\n      \"value\": \"administrative\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 3",
            "value": "conditionNode_240-LLMNode_253",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_215.output.category}}\",\n      \"operator\": \"==\",\n      \"value\": \"coverage\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_240-LLMNode_254",
            "condition": {}
          }
        ]
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 600 },
    "selected": false
  },
  {
    "id": "LLMNode_251",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "a1b2c3d4-0002-4000-8000-000000000001", "role": "system", "content": "@prompts/appeal-analysis_draft-medical-necessity_system.md" },
          { "id": "a1b2c3d4-0002-4000-8000-000000000002", "role": "user", "content": "@prompts/appeal-analysis_draft-medical-necessity_user.md" }
        ],
        "memories": "@model-configs/appeal-analysis_llmnode-medical-necessity_generative-model-name.ts",
        "messages": "@model-configs/appeal-analysis_llmnode-medical-necessity_generative-model-name.ts",
        "nodeName": "Draft Medical-Necessity Appeal",
        "attachments": "@model-configs/appeal-analysis_llmnode-medical-necessity_generative-model-name.ts",
        "credentials": "@model-configs/appeal-analysis_llmnode-medical-necessity_generative-model-name.ts",
        "generativeModelName": "@model-configs/appeal-analysis_llmnode-medical-necessity_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 0, "y": 750 },
    "selected": false
  },
  {
    "id": "LLMNode_252",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "a1b2c3d4-0003-4000-8000-000000000001", "role": "system", "content": "@prompts/appeal-analysis_draft-administrative_system.md" },
          { "id": "a1b2c3d4-0003-4000-8000-000000000002", "role": "user", "content": "@prompts/appeal-analysis_draft-administrative_user.md" }
        ],
        "memories": "@model-configs/appeal-analysis_llmnode-administrative_generative-model-name.ts",
        "messages": "@model-configs/appeal-analysis_llmnode-administrative_generative-model-name.ts",
        "nodeName": "Draft Administrative Appeal",
        "attachments": "@model-configs/appeal-analysis_llmnode-administrative_generative-model-name.ts",
        "credentials": "@model-configs/appeal-analysis_llmnode-administrative_generative-model-name.ts",
        "generativeModelName": "@model-configs/appeal-analysis_llmnode-administrative_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 450, "y": 750 },
    "selected": false
  },
  {
    "id": "LLMNode_253",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "a1b2c3d4-0004-4000-8000-000000000001", "role": "system", "content": "@prompts/appeal-analysis_draft-coverage_system.md" },
          { "id": "a1b2c3d4-0004-4000-8000-000000000002", "role": "user", "content": "@prompts/appeal-analysis_draft-coverage_user.md" }
        ],
        "memories": "@model-configs/appeal-analysis_llmnode-coverage_generative-model-name.ts",
        "messages": "@model-configs/appeal-analysis_llmnode-coverage_generative-model-name.ts",
        "nodeName": "Draft Coverage Appeal",
        "attachments": "@model-configs/appeal-analysis_llmnode-coverage_generative-model-name.ts",
        "credentials": "@model-configs/appeal-analysis_llmnode-coverage_generative-model-name.ts",
        "generativeModelName": "@model-configs/appeal-analysis_llmnode-coverage_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 900, "y": 750 },
    "selected": false
  },
  {
    "id": "LLMNode_254",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "a1b2c3d4-0005-4000-8000-000000000001", "role": "system", "content": "@prompts/appeal-analysis_draft-default_system.md" },
          { "id": "a1b2c3d4-0005-4000-8000-000000000002", "role": "user", "content": "@prompts/appeal-analysis_draft-default_user.md" }
        ],
        "memories": "@model-configs/appeal-analysis_llmnode-default_generative-model-name.ts",
        "messages": "@model-configs/appeal-analysis_llmnode-default_generative-model-name.ts",
        "nodeName": "Draft Default Appeal",
        "attachments": "@model-configs/appeal-analysis_llmnode-default_generative-model-name.ts",
        "credentials": "@model-configs/appeal-analysis_llmnode-default_generative-model-name.ts",
        "generativeModelName": "@model-configs/appeal-analysis_llmnode-default_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 1350, "y": 750 },
    "selected": false
  },
  {
    "id": "LLMNode_260",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          { "id": "a1b2c3d4-0006-4000-8000-000000000001", "role": "system", "content": "@prompts/appeal-analysis_assess-strength_system.md" },
          { "id": "a1b2c3d4-0006-4000-8000-000000000002", "role": "user", "content": "@prompts/appeal-analysis_assess-strength_user.md" }
        ],
        "memories": "@model-configs/appeal-analysis_llmnode-assess_generative-model-name.ts",
        "messages": "@model-configs/appeal-analysis_llmnode-assess_generative-model-name.ts",
        "nodeName": "Assess Strength",
        "attachments": "@model-configs/appeal-analysis_llmnode-assess_generative-model-name.ts",
        "credentials": "@model-configs/appeal-analysis_llmnode-assess_generative-model-name.ts",
        "generativeModelName": "@model-configs/appeal-analysis_llmnode-assess_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 900 },
    "selected": false
  },
  {
    "id": "codeNode_270",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/appeal-analysis_assemble-output.ts",
        "nodeName": "Assemble Output"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 1050 },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"result\": \"{{codeNode_270.output}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 675, "y": 1200 },
    "selected": false
  }
];

export const edges = [
  { "id": "triggerNode_1-LLMNode_210", "type": "defaultEdge", "source": "triggerNode_1", "target": "LLMNode_210", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_210-codeNode_215", "type": "defaultEdge", "source": "LLMNode_210", "target": "codeNode_215", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "codeNode_215-codeNode_230", "type": "defaultEdge", "source": "codeNode_215", "target": "codeNode_230", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "codeNode_230-conditionNode_240", "type": "defaultEdge", "source": "codeNode_230", "target": "conditionNode_240", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_240-LLMNode_251", "data": { "condition": "Condition 1", "branchName": "Condition 1" }, "type": "conditionEdge", "source": "conditionNode_240", "target": "LLMNode_251", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_240-LLMNode_252", "data": { "condition": "Condition 2", "branchName": "Condition 2" }, "type": "conditionEdge", "source": "conditionNode_240", "target": "LLMNode_252", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_240-LLMNode_253", "data": { "condition": "Condition 3", "branchName": "Condition 3" }, "type": "conditionEdge", "source": "conditionNode_240", "target": "LLMNode_253", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "conditionNode_240-LLMNode_254", "data": { "condition": "Else", "branchName": "Else" }, "type": "conditionEdge", "source": "conditionNode_240", "target": "LLMNode_254", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_251-LLMNode_260", "type": "defaultEdge", "source": "LLMNode_251", "target": "LLMNode_260", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_252-LLMNode_260", "type": "defaultEdge", "source": "LLMNode_252", "target": "LLMNode_260", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_253-LLMNode_260", "type": "defaultEdge", "source": "LLMNode_253", "target": "LLMNode_260", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_254-LLMNode_260", "type": "defaultEdge", "source": "LLMNode_254", "target": "LLMNode_260", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "LLMNode_260-codeNode_270", "type": "defaultEdge", "source": "LLMNode_260", "target": "codeNode_270", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "codeNode_270-responseNode_triggerNode_1", "type": "defaultEdge", "source": "codeNode_270", "target": "responseNode_triggerNode_1", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "response-responseNode_triggerNode_1", "type": "responseEdge", "source": "triggerNode_1", "target": "responseNode_triggerNode_1", "sourceHandle": "to-response", "targetHandle": "from-trigger" }
];

export default { meta, inputs, references, nodes, edges };
