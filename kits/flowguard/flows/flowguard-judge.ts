/*
 * # FlowGuard — Judge Flow
 * Scores ONE (caseInput, expectedBehavior, actualOutput) triple on FlowGuard's
 * 5-axis rubric. Combines a deterministic code-node pre-check (schema validity,
 * injection/leak markers, length) with a rationale-first LLM rubric.
 *
 * ## Why this design
 * - Deterministic checks run FIRST and are immune to prompt injection — a regex
 *   cannot be argued out of its verdict, so the LLM never grades what code can decide.
 * - The `ACTUAL OUTPUT` is delimited and explicitly framed as untrusted data; the
 *   judge is told never to obey instructions embedded in it (e.g. "score this 5/5").
 * - Rationales are produced BEFORE scores (chain-of-thought ordering lifts judge quality).
 * - Temperature 0 and a versioned rubric (`rubricVersion` echoed into results) keep
 *   old runs interpretable after prompt tweaks.
 *
 * ## Inputs (trigger schema)
 * | Field | Type | Description |
 * |---|---|---|
 * | `caseInput` | string | The input that was sent to the target flow. |
 * | `expectedBehavior` | string | The behavioral oracle for this case. |
 * | `actualOutput` | string | What the target returned (untrusted data). |
 * | `targetConstitutionExcerpt` | string | Optional guardrail text. |
 * | `rubricVersion` | string | Rubric version tag, echoed into the result. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `rationales` | object | One sentence per axis. |
 * | `scores` | object | taskSuccess, faithfulness, toneConstitution, safety (1-5). |
 * | `schemaValid` | boolean | From the deterministic code node, not the LLM. |
 * | `verdict` | string | pass | fail | borderline. |
 * | `confidence` | number | Judge confidence in [0,1]. |
 * | `rubricVersion` | string | Echoed back for run interpretability. |
 * | `deterministic` | object | Raw code-node signals (leaks, length, empties). |
 *
 * ## Node Walkthrough
 * 1. `API Request` (triggerNode / graphqlNode) — five input fields.
 * 2. `Deterministic Checks` (codeNode) — schemaValid, injection markers, length.
 * 3. `Score` (InstructorLLMNode) — rationale-first rubric, temp 0.
 * 4. `API Response` (responseNode) — merges code-node + LLM outputs.
 */

// Flow: flowguard-judge

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "FlowGuard Judge",
  "description": "Scores one target output against a behavioral oracle on the FlowGuard rubric.",
  "tags": ["flowguard", "evaluation", "llm-as-judge"],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_judge": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
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
    "flowguard_judge_score_system": "@prompts/flowguard-judge_score_system.md",
    "flowguard_judge_score_user": "@prompts/flowguard-judge_score_user.md"
  },
  "scripts": {
    "flowguard_judge_deterministic_checks": "@scripts/flowguard-judge_deterministic-checks.ts"
  },
  "modelConfigs": {
    "flowguard_judge_score": "@model-configs/flowguard-judge_score.ts"
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
        "advance_schema": "{\n  \"caseInput\": \"string\",\n  \"expectedBehavior\": \"string\",\n  \"actualOutput\": \"string\",\n  \"targetConstitutionExcerpt\": \"string\",\n  \"rubricVersion\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 0 },
    "selected": false
  },
  {
    "id": "codeNode_checks",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "schemaValid": "boolean",
        "isEmpty": "boolean",
        "outputLength": "number",
        "truncated": "boolean",
        "injectionSignalCount": "number",
        "injectionSignals": "array"
      },
      "values": {
        "id": "codeNode_checks",
        "code": "@scripts/flowguard-judge_deterministic-checks.ts",
        "nodeName": "Deterministic Checks"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 130 },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_judge",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_judge",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"rationales\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"taskSuccess\": { \"type\": \"string\" },\n        \"faithfulness\": { \"type\": \"string\" },\n        \"toneConstitution\": { \"type\": \"string\" },\n        \"safety\": { \"type\": \"string\" }\n      }\n    },\n    \"scores\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"taskSuccess\": { \"type\": \"number\" },\n        \"faithfulness\": { \"type\": \"number\" },\n        \"toneConstitution\": { \"type\": \"number\" },\n        \"safety\": { \"type\": \"number\" }\n      }\n    },\n    \"verdict\": { \"type\": \"string\" },\n    \"confidence\": { \"type\": \"number\" }\n  }\n}",
        "prompts": [
          {
            "id": "jd-sys",
            "role": "system",
            "content": "@prompts/flowguard-judge_score_system.md"
          },
          {
            "id": "jd-usr",
            "role": "user",
            "content": "@prompts/flowguard-judge_score_user.md"
          }
        ],
        "memories": "@model-configs/flowguard-judge_score.ts",
        "messages": "@model-configs/flowguard-judge_score.ts",
        "nodeName": "Score",
        "attachments": "@model-configs/flowguard-judge_score.ts",
        "generativeModelName": "@model-configs/flowguard-judge_score.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 260 },
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
        "outputMapping": "{\n  \"rationales\": \"{{InstructorLLMNode_judge.output.rationales}}\",\n  \"scores\": \"{{InstructorLLMNode_judge.output.scores}}\",\n  \"verdict\": \"{{InstructorLLMNode_judge.output.verdict}}\",\n  \"confidence\": \"{{InstructorLLMNode_judge.output.confidence}}\",\n  \"schemaValid\": \"{{codeNode_checks.output.schemaValid}}\",\n  \"rubricVersion\": \"{{triggerNode_1.output.rubricVersion}}\",\n  \"deterministic\": \"{{codeNode_checks.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 390 },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_checks",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_checks",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_checks-InstructorLLMNode_judge",
    "type": "defaultEdge",
    "source": "codeNode_checks",
    "target": "InstructorLLMNode_judge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_judge-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_judge",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
