/*
 * # Error Log Summariser
 * This flow accepts a raw error log or stack trace and returns a structured, plain-English triage summary: what failed, the likely root cause, the failing component, suggested fixes, and a confidence level.
 *
 * ## Purpose
 * The flow turns noisy crash output into an actionable triage note. It solves the problem of a developer or on-call engineer staring at a wall of stack frames and not knowing where to start. It receives the log text (and optional context), sends it to an LLM with a reliability-engineer system prompt, and returns a compact markdown report.
 *
 * The output is a single markdown string returned through the flow's API response. It is meant to be shown in a UI, pasted into an incident channel, or fed into another automation for routing.
 *
 * This is a standalone entry-point flow: no upstream retrieval, no downstream chaining. Input goes straight to synthesis.
 *
 * ## When To Use
 * - Use when you have a stack trace, exception dump, or crash log and want a fast root-cause hypothesis.
 * - Use when the input is raw text pasted by a caller, not a URL or file.
 * - Use for synchronous "log in, triage out" API calls from a backend, CLI, or chat surface.
 *
 * ## When Not To Use
 * - Do not use for multi-log correlation across services in one request unless you extend it for batching.
 * - Do not use when you need guaranteed structured JSON with strict schema enforcement; output is markdown prose.
 * - Do not use as a substitute for real observability — it reasons over the text it is given, nothing more.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `log` | `string` | Yes | Raw error log or stack trace to analyse. |
 * | `context` | `string` | No | Optional caller context (language, framework, what they were doing). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `summary` | `string` | Markdown triage report: Summary, Likely Root Cause, Failing Component, Suggested Fix, Confidence. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — trigger; exposes `log` and `context` to downstream nodes.
 * 2. `Generate Text` (`LLMNode`) — sends the log to the configured model with the triage system/user prompts; emits `generatedResponse`.
 * 3. `API Response` (`graphqlResponseNode`) — maps `summary` from the LLM output and returns it.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before LLM runs | Missing `log` in payload | Send a non-empty `log` string. |
 * | Empty or low-quality summary | Log truncated, no signal, or heavily minified | Provide fuller log and set `context`. |
 * | LLM node fails | Missing model provider credentials or invalid model config | Verify credentials for `@model-configs/error-log-summariser_generate-text.ts`. |
 *
 * ## Notes
 * - Response mode is realtime (synchronous request-response).
 * - Prompts and model choice are externalised; behaviour is tuned there, not in node logic.
 */

// Flow: error-log-summariser

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Error Log Summariser",
  "description": "Turns a raw error log or stack trace into a plain-English root-cause hypothesis, the likely failing component, and concrete next fix steps.",
  "tags": [
    "✨ Generative",
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Manas Mahato",
    "email": "manasmahato.2004@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "error_log_summariser_generate_text_user": "@prompts/error-log-summariser_generate-text_user.md",
    "error_log_summariser_generate_text_system": "@prompts/error-log-summariser_generate-text_system.md"
  },
  "modelConfigs": {
    "error_log_summariser_generate_text": "@model-configs/error-log-summariser_generate-text.ts"
  }
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
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_160",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "b1f0a2c4-1d3e-4a5b-9c8d-0e1f2a3b4c5d",
            "role": "user",
            "content": "@prompts/error-log-summariser_generate-text_user.md"
          },
          {
            "id": "c2e1b3d5-2e4f-4b6c-8d9e-1f2a3b4c5d6e",
            "role": "system",
            "content": "@prompts/error-log-summariser_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/error-log-summariser_generate-text.ts",
        "messages": "@model-configs/error-log-summariser_generate-text.ts",
        "generativeModelName": "@model-configs/error-log-summariser_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_651",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"summary\": \"{{LLMNode_160.output.generatedResponse}}\"\n}"
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
