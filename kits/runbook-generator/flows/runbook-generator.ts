/*
 * # Runbook Generator
 * Turns messy operational notes and tribal knowledge into a structured, reusable ops runbook.
 *
 * ## Purpose
 * On-call engineers often inherit half-written Slack threads, verbal recovery steps, and "ask Alice" tribal knowledge.
 * This flow converts that raw text into a runbook with prechecks, ordered steps, validation, rollback, assumptions,
 * and missing-info flags — without drafting a postmortem or inventing unverifiable commands.
 *
 * ## When To Use
 * - Use when you have free-text procedure / recovery notes and need a reusable how-to-operate playbook.
 * - Use when the desired output is structured JSON (title, steps, validation, rollback) for docs or tooling.
 * - Use when you want honest gap detection (`missing_info`) instead of silently inventing steps.
 *
 * ## When Not To Use
 * - Do not use for postmortems, RCA, or blameless incident writeups (use postmortem kits instead).
 * - Do not use as a live executor of shell commands — this flow only authors a document.
 * - Do not use when the input is raw logs alone with no procedural intent (prefer log triage kits).
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `notes` | `string` | Yes | Messy procedure / Slack dump / tribal knowledge. |
 * | `service_name` | `string` | No | Optional service label for the runbook header. |
 * | `environment` | `string` | No | Optional environment (e.g. staging, prod). |
 *
 * ## Outputs
 * Structured runbook JSON: title, purpose, audience, service_name, environment, prechecks, steps[],
 * validation, rollback, assumptions, missing_info, warnings.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives notes + optional context.
 * 2. `Generate JSON` (`InstructorLLMNode`) — schema-constrained runbook extraction.
 * 3. `API Response` (`graphqlResponseNode`) — returns the structured runbook fields.
 */

// Flow: runbook-generator

export const meta = {
  name: "Runbook Generator",
  description:
    "Turns messy operational notes and tribal knowledge into a structured, reusable ops runbook with prechecks, steps, validation, rollback, and missing-info flags.",
  tags: ["ops", "devops", "sre", "runbook"],
  testInput: {
    notes:
      "if redis cache looks poisoned on checkout: check redis-cli ping, then flushdb on the cache shard only (NOT primary), bounce checkout pods, watch error rate on grafana checkout dashboard. if still bad ask platform. don't touch prod db.",
    service_name: "checkout-api",
    environment: "prod",
  },
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/runbook-generator",
  documentationUrl: "https://lamatic.ai/docs",
  deployUrl: "",
  author: {
    name: "Tushar Sohal",
    email: "tshulk2003@gmail.com",
  },
};

export const inputs = {
  triggerNode_1: [
    {
      name: "notes",
      label: "Operational Notes",
      type: "string",
      required: true,
    },
    {
      name: "service_name",
      label: "Service Name",
      type: "string",
      required: false,
    },
    {
      name: "environment",
      label: "Environment",
      type: "string",
      required: false,
    },
  ],
  InstructorLLMNode_410: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      mode: "instructor",
      description: "Select the model to generate structured JSON from the prompt.",
      modelType: "generator/text",
      required: true,
      isPrivate: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "openai",
          credential_name: "",
          params: {},
        },
      ],
      typeOptions: {
        loadOptionsMethod: "listModels",
      },
    },
  ],
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    runbook_generator_generate_json_system:
      "@prompts/runbook-generator_generate-json_system.md",
    runbook_generator_generate_json_user:
      "@prompts/runbook-generator_generate-json_user.md",
  },
  modelConfigs: {
    runbook_generator_generate_json:
      "@model-configs/runbook-generator_generate-json.ts",
  },
};

export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          '{\n  "notes": "string",\n  "service_name": "string",\n  "environment": "string"\n}',
      },
    },
  },
  {
    id: "InstructorLLMNode_410",
    type: "dynamicNode",
    position: { x: 0, y: 130 },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        nodeName: "Generate JSON",
        tools: [],
        schema:
          '{\n  "type": "object",\n  "properties": {\n    "title": { "type": "string" },\n    "purpose": { "type": "string" },\n    "audience": { "type": "string" },\n    "service_name": { "type": ["string", "null"] },\n    "environment": { "type": ["string", "null"] },\n    "prechecks": {\n      "type": "array",\n      "items": { "type": "string" }\n    },\n    "steps": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "order": { "type": "number" },\n          "action": { "type": "string" },\n          "expected_result": { "type": "string" },\n          "commands": {\n            "type": "array",\n            "items": { "type": "string" }\n          },\n          "risk": {\n            "type": "string",\n            "enum": ["low", "medium", "high"]\n          }\n        },\n        "required": ["order", "action", "expected_result", "commands", "risk"],\n        "additionalProperties": false\n      }\n    },\n    "validation": {\n      "type": "array",\n      "items": { "type": "string" }\n    },\n    "rollback": {\n      "type": "array",\n      "items": { "type": "string" }\n    },\n    "assumptions": {\n      "type": "array",\n      "items": { "type": "string" }\n    },\n    "missing_info": {\n      "type": "array",\n      "items": { "type": "string" }\n    },\n    "warnings": {\n      "type": "array",\n      "items": { "type": "string" }\n    }\n  },\n  "required": [\n    "title",\n    "purpose",\n    "audience",\n    "service_name",\n    "environment",\n    "prechecks",\n    "steps",\n    "validation",\n    "rollback",\n    "assumptions",\n    "missing_info",\n    "warnings"\n  ],\n  "additionalProperties": false\n}',
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/runbook-generator_generate-json_system.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/runbook-generator_generate-json_user.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        attachments: "",
        generativeModelName:
          "@model-configs/runbook-generator_generate-json.ts",
      },
    },
  },
  {
    id: "graphqlResponseNode_220",
    type: "dynamicNode",
    position: { x: 0, y: 260 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping:
          '{\n  "title": "{{InstructorLLMNode_410.output.title}}",\n  "purpose": "{{InstructorLLMNode_410.output.purpose}}",\n  "audience": "{{InstructorLLMNode_410.output.audience}}",\n  "service_name": "{{InstructorLLMNode_410.output.service_name}}",\n  "environment": "{{InstructorLLMNode_410.output.environment}}",\n  "prechecks": "{{InstructorLLMNode_410.output.prechecks}}",\n  "steps": "{{InstructorLLMNode_410.output.steps}}",\n  "validation": "{{InstructorLLMNode_410.output.validation}}",\n  "rollback": "{{InstructorLLMNode_410.output.rollback}}",\n  "assumptions": "{{InstructorLLMNode_410.output.assumptions}}",\n  "missing_info": "{{InstructorLLMNode_410.output.missing_info}}",\n  "warnings": "{{InstructorLLMNode_410.output.warnings}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_410",
    source: "triggerNode_1",
    target: "InstructorLLMNode_410",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_410-graphqlResponseNode_220",
    source: "InstructorLLMNode_410",
    target: "graphqlResponseNode_220",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-graphqlResponseNode_220",
    source: "triggerNode_1",
    target: "graphqlResponseNode_220",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
