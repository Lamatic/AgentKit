/*
 * # Bug to Test Case Generator
 * This flow accepts a bug report's title, description, steps to reproduce, and environment, and returns a structured markdown test plan.
 *
 * ## Purpose
 * Automates translating unstructured developer or user bug reports into structured test cases and automated test outlines.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `bugTitle` | `string` | Yes | Bug report title. |
 * | `bugDescription` | `string` | Yes | Description/context of the bug. |
 * | `stepsToReproduce` | `string` | Yes | Step-by-step reproduction steps. |
 * | `environment` | `string` | No | Target environment context. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `testPlan` | `string` | Generated test case document. |
 */

// Flow: bug-to-test-case-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Bug to Test Case Generator",
  "description": "This workflow automatically translates unstructured bug reports or Jira issues into structured test cases, regression steps, and automated test templates.",
  "tags": [
    "✨ Generative",
    "🛠️ Developer Tools"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/bug-to-test-case-generator",
  "author": {
    "name": "Vimal",
    "email": "vimalsahani2005@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  bugTitle: { type: "string", required: true },
  bugDescription: { type: "string", required: true },
  stepsToReproduce: { type: "string", required: true },
  environment: { type: "string", required: false }
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "bug_to_test_case_generator_generate_test_case_user": "@prompts/bug-to-test-case-generator_generate-test-case_user.md",
    "bug_to_test_case_generator_generate_test_case_system": "@prompts/bug-to-test-case-generator_generate-test-case_system.md"
  },
  "modelConfigs": {
    "bug_to_test_case_generator_generate_test_case": "@model-configs/bug-to-test-case-generator_generate-test-case.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"bugTitle\": {\n      \"type\": \"string\"\n    },\n    \"bugDescription\": {\n      \"type\": \"string\"\n    },\n    \"stepsToReproduce\": {\n      \"type\": \"string\"\n    },\n    \"environment\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"bugTitle\",\n    \"bugDescription\",\n    \"stepsToReproduce\"\n  ]\n}"
      }
    }
  },
  {
    "id": "LLMNode_160",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Test Case",
        "tools": [],
        "prompts": [
          {
            "id": "201de7d9-b31f-4065-bbae-3363983ce3bf",
            "role": "user",
            "content": "@prompts/bug-to-test-case-generator_generate-test-case_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/bug-to-test-case-generator_generate-test-case_system.md"
          }
        ],
        "memories": "@model-configs/bug-to-test-case-generator_generate-test-case.ts",
        "messages": "@model-configs/bug-to-test-case-generator_generate-test-case.ts",
        "generativeModelName": "@model-configs/bug-to-test-case-generator_generate-test-case.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_651",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"testPlan\": \"{{LLMNode_160.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_160",
    "source": "triggerNode_1",
    "target": "LLMNode_160",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_160-graphqlResponseNode_651",
    "source": "LLMNode_160",
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
