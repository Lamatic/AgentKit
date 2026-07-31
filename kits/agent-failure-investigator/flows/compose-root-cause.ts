/*
 * # Compose Root Cause
 * Takes the deterministic rule engine's findings for a failed agent trace and narrates the Root Cause section as fluent prose, as a strictly optional last-mile step.
 *
 * ## Purpose
 * The Agent Failure Investigator's diagnosis is deliberately deterministic: a rule engine scores evidence and picks a primary failure category before any LLM is involved. This flow is the one place an LLM enters the pipeline, and only to improve readability — it receives the engine's fired rules and evidence as fixed facts and rewrites them as a short prose narrative for an engineering report. It cannot add, remove, or reweigh evidence, and it never selects the failure category itself.
 *
 * The outcome is a single narrated string. If this flow is unavailable or errors, the calling application falls back to the deterministic, template-based narrative silently — the report never depends on this flow succeeding.
 *
 * ## When To Use
 * - Use after the client-side rule engine (`js/engine.js`, `rules/`) has already produced a primary category, confidence, and fired-rules list for a trace.
 * - Use when a human-readable Root Cause paragraph is wanted in place of the deterministic template sentence.
 *
 * ## When Not To Use
 * - Do not use this flow to perform the diagnosis itself — it must only rephrase findings it is given, never invent new ones.
 * - Do not use when no rule fired (`result.primary` is null); there is nothing to narrate.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `primaryCategory` | `string` | Yes | The engine's primary failure category id (e.g. `TOOL_FAILURE`). |
 * | `confidence` | `number` | Yes | Evidence-weighted confidence, 0-95. |
 * | `findings` | `string` | Yes | Newline-joined `[ruleId] (category, +points) title: evidence` lines for every fired rule. |
 * | `userQuestion` | `string` | No | The last user message in the trace, for context. |
 * | `finalResponse` | `string` | No | The trace's final (failed) response content, for context. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `rootCause` | `string` | A 3-4 sentence prose narrative of the root cause, referencing rule ids in brackets. |
 *
 * ## Dependencies
 * ### External Services
 * - Configured LLM provider via `LLMNode` — requires the provider credentials associated with `@model-configs/compose-root-cause_narrate-root-cause.ts`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives the engine's findings as the flow's input payload.
 * 2. `Narrate Root Cause` (`LLMNode`) — rewrites the findings as prose, constrained by `@constitutions/default.md` to never add or reweigh evidence.
 * 3. `API Response` (`graphqlResponseNode`) — returns `rootCause` to the caller.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow errors or times out | Missing/invalid LLM provider credentials, or provider outage | Caller should fall back to the deterministic template narrative; verify credentials for `@model-configs/compose-root-cause_narrate-root-cause.ts`. |
 * | Narrative omits a rule id | `findings` was incomplete when the flow was invoked | Ensure all fired rules from the engine result are joined into `findings` before calling this flow. |
 */

// Flow: compose-root-cause

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Compose Root Cause",
  "description": "Narrates the deterministic rule engine's Root Cause findings for a failed agent trace as fluent prose. Strictly optional: receives fired rules and evidence as fixed facts and cannot add, remove, or reweigh evidence.",
  "tags": [
    "diagnostics",
    "observability"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Youssef",
    "email": "yshsh218@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "compose_root_cause_narrate_root_cause_user": "@prompts/compose-root-cause_narrate-root-cause_user.md",
    "compose_root_cause_narrate_root_cause_system": "@prompts/compose-root-cause_narrate-root-cause_system.md"
  },
  "modelConfigs": {
    "compose_root_cause_narrate_root_cause": "@model-configs/compose-root-cause_narrate-root-cause.ts"
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
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_411",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Narrate Root Cause",
        "tools": [],
        "prompts": [
          {
            "id": "6c2a9b3e-3a3d-4b3a-9a1e-3c3d6a2e9b3e",
            "role": "user",
            "content": "@prompts/compose-root-cause_narrate-root-cause_user.md"
          },
          {
            "id": "9f1d7c5a-2e4b-4a6d-8b3c-7d5a9f1d7c5a",
            "role": "system",
            "content": "@prompts/compose-root-cause_narrate-root-cause_system.md"
          }
        ],
        "memories": "@model-configs/compose-root-cause_narrate-root-cause.ts",
        "messages": "@model-configs/compose-root-cause_narrate-root-cause.ts",
        "generativeModelName": "@model-configs/compose-root-cause_narrate-root-cause.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_711",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"rootCause\": \"{{LLMNode_411.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_411",
    "source": "triggerNode_1",
    "target": "LLMNode_411",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_411-graphqlResponseNode_711",
    "source": "LLMNode_411",
    "target": "graphqlResponseNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_711",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_711",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
