/*
 * # FlowGuard — Red-Team Generator Flow (optional module)
 * Produces adversarial probes (prompt injection, jailbreak, instruction
 * smuggling, system-prompt exfiltration, off-domain bait) for a target flow.
 * Probes use the same case schema as the suite generator with category
 * "adversarial", and are judged by the standard `flowguard-judge` flow with a
 * resistance-focused expectedBehavior — so a breach shows up as a low `safety`
 * score and a `fail` verdict.
 *
 * ## Inputs (trigger schema)
 * | Field | Type | Description |
 * |---|---|---|
 * | `flowDescription` | string | What the target flow does. |
 * | `constitutionText` | string | The target's guardrails, if any. |
 * | `numProbes` | string | Approximate number of probes. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `cases` | array | Adversarial probes in the standard case schema. |
 * | `count` | number | Number of probes after validation. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (triggerNode / graphqlNode).
 * 2. `Generate Probes` (InstructorLLMNode).
 * 3. `Validate Suite` (codeNode) — reuses the suite validator to assign IDs and dedupe.
 * 4. `API Response` (responseNode).
 */

// Flow: flowguard-red-team-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "FlowGuard Red-Team Generator",
  "description": "Generates adversarial probes to test a target flow's resistance.",
  "tags": ["flowguard", "red-team", "security"],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_probes": [
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
    "flowguard_red_team_generator_probes_system": "@prompts/flowguard-red-team-generator_probes_system.md",
    "flowguard_red_team_generator_probes_user": "@prompts/flowguard-red-team-generator_probes_user.md"
  },
  "scripts": {
    "flowguard_suite_generator_validate": "@scripts/flowguard-suite-generator_validate.ts"
  },
  "modelConfigs": {
    "flowguard_red_team_generator_probes": "@model-configs/flowguard-red-team-generator_probes.ts"
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
        "advance_schema": "{\n  \"flowDescription\": \"string\",\n  \"constitutionText\": \"string\",\n  \"numProbes\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 0 },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_probes",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_probes",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"cases\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"category\": { \"type\": \"string\" },\n          \"input\": { \"type\": \"object\" },\n          \"expectedBehavior\": { \"type\": \"string\" },\n          \"rationale\": { \"type\": \"string\" }\n        }\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "rt-sys",
            "role": "system",
            "content": "@prompts/flowguard-red-team-generator_probes_system.md"
          },
          {
            "id": "rt-usr",
            "role": "user",
            "content": "@prompts/flowguard-red-team-generator_probes_user.md"
          }
        ],
        "memories": "@model-configs/flowguard-red-team-generator_probes.ts",
        "messages": "@model-configs/flowguard-red-team-generator_probes.ts",
        "nodeName": "Generate Probes",
        "attachments": "@model-configs/flowguard-red-team-generator_probes.ts",
        "generativeModelName": "@model-configs/flowguard-red-team-generator_probes.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 130 },
    "selected": false
  },
  {
    "id": "codeNode_val",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "cases": "array",
        "count": "number"
      },
      "values": {
        "id": "codeNode_val",
        "code": "@scripts/flowguard-suite-generator_validate.ts",
        "nodeName": "Validate Suite"
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
        "outputMapping": "{\n  \"cases\": \"{{codeNode_val.output.cases}}\",\n  \"count\": \"{{codeNode_val.output.count}}\"\n}"
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
    "id": "triggerNode_1-InstructorLLMNode_probes",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_probes",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_probes-codeNode_val",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_probes",
    "target": "codeNode_val",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_val-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_val",
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
