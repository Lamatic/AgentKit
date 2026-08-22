/*
 * # FlowGuard — Suite Generator Flow
 * A synchronous GraphQL flow that turns a description of an arbitrary target flow
 * (plus its input schema and one sample I/O pair) into a categorized, validated
 * suite of test cases.
 *
 * ## Purpose
 * This is the first stage of the FlowGuard evaluation pipeline. Given only what a
 * target agent is *supposed* to do, it designs test cases across five categories
 * (happy_path, edge_case, ambiguous, out_of_scope, adversarial). Each case carries
 * a natural-language `expectedBehavior` oracle rather than an exact-match string,
 * which is the key design decision that lets one judge generalize across any flow.
 *
 * ## Inputs (trigger schema)
 * | Field | Type | Description |
 * |---|---|---|
 * | `flowDescription` | string | What the target flow is supposed to do. |
 * | `inputSchema` | string | JSON string of the target's input schema. |
 * | `sampleInput` | string | One example input for the target. |
 * | `sampleOutput` | string | The target's output for that example. |
 * | `numCases` | string | Approximate number of cases to generate. |
 * | `categories` | string | Comma/JSON list of categories to cover. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `cases` | array | Validated, de-duplicated, ID-assigned test cases. |
 * | `count` | number | Number of cases after validation. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (triggerNode / graphqlNode) — accepts the six input fields.
 * 2. `Generate Cases` (InstructorLLMNode) — designs raw cases against the rubric
 *    prompt; moderate temperature for diversity.
 * 3. `Validate Suite` (codeNode) — deterministic: assigns stable IDs, drops cases
 *    with no oracle, dedupes near-identical inputs. The LLM never grades what code
 *    can guarantee.
 * 4. `API Response` (responseNode) — returns `cases` + `count` as JSON.
 */

// Flow: flowguard-suite-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "FlowGuard Suite Generator",
  "description": "Generates a categorized, validated test suite for an arbitrary target flow.",
  "tags": ["flowguard", "evaluation", "test-generation"],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_gen": [
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
    "flowguard_suite_generator_generate_cases_system": "@prompts/flowguard-suite-generator_generate-cases_system.md",
    "flowguard_suite_generator_generate_cases_user": "@prompts/flowguard-suite-generator_generate-cases_user.md"
  },
  "scripts": {
    "flowguard_suite_generator_validate": "@scripts/flowguard-suite-generator_validate.ts"
  },
  "modelConfigs": {
    "flowguard_suite_generator_generate_cases": "@model-configs/flowguard-suite-generator_generate-cases.ts"
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
        "advance_schema": "{\n  \"flowDescription\": \"string\",\n  \"inputSchema\": \"string\",\n  \"sampleInput\": \"string\",\n  \"sampleOutput\": \"string\",\n  \"numCases\": \"string\",\n  \"categories\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 0 },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_gen",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_gen",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"cases\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"category\": { \"type\": \"string\" },\n          \"input\": { \"type\": \"object\" },\n          \"expectedBehavior\": { \"type\": \"string\" },\n          \"rationale\": { \"type\": \"string\" }\n        }\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "sg-sys",
            "role": "system",
            "content": "@prompts/flowguard-suite-generator_generate-cases_system.md"
          },
          {
            "id": "sg-usr",
            "role": "user",
            "content": "@prompts/flowguard-suite-generator_generate-cases_user.md"
          }
        ],
        "memories": "@model-configs/flowguard-suite-generator_generate-cases.ts",
        "messages": "@model-configs/flowguard-suite-generator_generate-cases.ts",
        "nodeName": "Generate Cases",
        "attachments": "@model-configs/flowguard-suite-generator_generate-cases.ts",
        "generativeModelName": "@model-configs/flowguard-suite-generator_generate-cases.ts"
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
    "id": "triggerNode_1-InstructorLLMNode_gen",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_gen",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_gen-codeNode_val",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_gen",
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
