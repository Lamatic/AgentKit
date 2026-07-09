/*
 * # DockerGuard Audit
 * Accepts the raw text of a Dockerfile or docker-compose file and returns a
 * structured security + best-practice audit as JSON. This is the single flow
 * behind the DockerGuard kit.
 *
 * ## Purpose
 * The flow turns an unstructured container build file into an actionable,
 * machine-readable report. A caller sends the file contents; an LLM node
 * analyses them against a fixed catalog of container-security and
 * best-practice rules (running as root, `latest` base tags, hardcoded
 * secrets, cache-busting layer order, missing multi-stage builds, and so on)
 * and returns a JSON object containing an overall score, a letter grade, a
 * short summary, a sorted list of findings, and the good practices already
 * present.
 *
 * It performs static analysis only — nothing is executed, built, pulled, or
 * fetched. Everything is derived from the text passed in.
 *
 * ## When To Use
 * - A CI step, IDE action, or web UI needs an on-demand audit of a Dockerfile
 *   or docker-compose file.
 * - You want a structured JSON verdict you can render, gate a pipeline on, or
 *   store — not just prose.
 *
 * ## When Not To Use
 * - The input is not a Dockerfile/compose file (the flow reports `unknown`).
 * - You need runtime/image-scanning of a built image (use Trivy/Grype for that);
 *   this flow reviews the build definition, not the resulting layers.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `dockerfile` | `string` | Yes | Raw contents of the Dockerfile or compose file. |
 * | `file_type`  | `string` | No  | Hint: `dockerfile` or `compose`. |
 * | `filename`   | `string` | No  | Original file name, for context only. |
 *
 * The trigger passes these fields straight through to the `Audit Engine` node,
 * which reads `{{triggerNode_1.output.dockerfile}}` and the optional hints.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `report` | `string` | A JSON string (score, grade, summary, findings[], passed_checks[]). |
 *
 * The response maps `report` from `{{LLMNode_1.output.generatedResponse}}`. The
 * calling app is expected to `JSON.parse` it; the prompt constrains the model
 * to emit a single strict JSON object.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — trigger/entrypoint; exposes the request
 *    fields (`dockerfile`, `file_type`, `filename`) to downstream nodes.
 * 2. `Audit Engine` (`LLMNode`) — sends the config to a JSON-capable model with
 *    the system + user prompts referenced from `@prompts/...` and the model
 *    settings from `@model-configs/dockerguard-audit_audit-engine.ts`; emits
 *    `generatedResponse` (the JSON report).
 * 3. `API Response` (`graphqlResponseNode`) — maps `report` to the model output
 *    and returns it to the caller in realtime mode.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | Empty/invalid `report` | Model returned prose or fenced JSON | Lower temperature; keep the strict-JSON instruction in the system prompt. |
 * | Auth error on the LLM node | Missing provider credentials | Configure the model provider in Lamatic for the `Audit Engine` node. |
 * | `input_type: "unknown"` | Input was not a Dockerfile/compose file | Send the raw build file contents. |
 */

// Flow: dockerguard-audit

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "DockerGuard Audit",
  "description":
    "Statically audits a Dockerfile or docker-compose file and returns a structured JSON report: overall score, letter grade, prioritized findings (severity, line, why, fix), and the good practices already present.",
  "tags": ["devops", "security", "generative"],
  "testInput": {
    "dockerfile":
      "FROM node:latest\nADD . /app\nWORKDIR /app\nRUN npm install\nENV API_KEY=sk-live-123456\nCMD npm start",
    "file_type": "dockerfile",
    "filename": "Dockerfile",
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/dockerguard",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Yash Tripathi", "email": "hydra191102@gmail.com" },
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md",
  },
  "prompts": {
    "dockerguard_audit_audit_engine_system":
      "@prompts/dockerguard-audit_audit-engine_system.md",
    "dockerguard_audit_audit_engine_user":
      "@prompts/dockerguard-audit_audit-engine_user.md",
  },
  "modelConfigs": {
    "dockerguard_audit_audit_engine":
      "@model-configs/dockerguard-audit_audit-engine.ts",
  },
};

// ── Nodes & Edges ─────────────────────────────────────
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
        "advance_schema": "",
      },
    },
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Audit Engine",
        "tools": [],
        "prompts": [
          {
            "id": "b6a1a0d2-1f2e-4c33-9c1a-0d7c9b2a5e01",
            "role": "system",
            "content": "@prompts/dockerguard-audit_audit-engine_system.md",
          },
          {
            "id": "c7b2b1e3-2a3f-4d44-8d2b-1e8dac3b6f12",
            "role": "user",
            "content": "@prompts/dockerguard-audit_audit-engine_user.md",
          },
        ],
        "memories": "@model-configs/dockerguard-audit_audit-engine.ts",
        "messages": "@model-configs/dockerguard-audit_audit-engine.ts",
        "generativeModelName": "@model-configs/dockerguard-audit_audit-engine.ts",
      },
    },
  },
  {
    "id": "graphqlResponseNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"report\": \"{{LLMNode_1.output.generatedResponse}}\"\n}",
      },
    },
  },
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "LLMNode_1-graphqlResponseNode_1",
    "source": "LLMNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "response-graphqlResponseNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
