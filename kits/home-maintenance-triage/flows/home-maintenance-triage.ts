/*
 * # Home Maintenance Triage
 * A single-flow API-invoked home-problem triage pipeline that turns a user-provided photo and issue description into a structured severity assessment and safe next steps.
 *
 * ## Purpose
 * This flow takes an image of a home issue (water stain, crack, exposed wiring, mold, etc.) plus a short text description, and returns a structured JSON assessment: category, severity, urgency, whether a licensed professional is required, and safe immediate next steps. It intentionally defaults to caution — it never downplays a hazard to seem more helpful, and it never gives confident DIY instructions for anything electrical, gas, or structural.
 *
 * ## When To Use
 * - Use when a caller has a photo + description of a home issue and needs a structured triage response.
 * - Use when a UI or automation needs a single API-call flow returning a normalized severity/urgency payload.
 * - Use when no prior Lamatic flow has already triaged the same issue.
 *
 * ## When Not To Use
 * - Do not use as a substitute for a licensed inspector, electrician, or plumber — it is informational only.
 * - Do not use when no image is available; the flow is designed around image + text input together.
 * - Do not use for medical or personal-injury emergencies.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `imageUrl` | `string` | No | A user-provided URL pointing to a photo of the home issue. |
 * | `issueDescription` | `string` | Yes | A short text description of the problem, e.g. "ceiling stain, getting bigger over a week". |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | Strict JSON string: { category, severity, urgency, professionalNeeded, professionalType, safeNextSteps[], doNotDo[], reasoning, disclaimer } |
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives `imageUrl` and `issueDescription` from the caller.
 * 2. `Generate Text` (`LLMNode`) — vision-capable model — analyzes the image + description using the system prompt and returns strict JSON.
 * 3. `API Response` (`graphqlResponseNode`) returns the generated JSON string under the `output` field.
 *
 * ## Notes
 * Replace the model in `@model-configs/home-maintenance-triage_generate-text.ts` with a vision-capable model
 * when configuring this flow in Lamatic Studio (e.g. a GPT-4o/Claude/Gemini vision model) — the LLM node
 * must be able to accept the image input, not just text.
 */

// Flow: home-maintenance-triage

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Home Maintenance Triage",
  "description": "Analyzes a photo and description of a home problem and generates a structured severity assessment with safe next steps.",
  "tags": [
    "generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/home-maintenance-triage",
  "author": {
    "name": "Mohd Ali Faridi",
    "email": "faridiali20029@gmail.com"
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
    "home_maintenance_triage_generate_text_system": "@prompts/home-maintenance-triage_generate-text_system.md"
  },
  "modelConfigs": {
    "home_maintenance_triage_generate_text": "@model-configs/home-maintenance-triage_generate-text.ts"
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
    "id": "LLMNode_501",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "a1b2c3d4-0001-0001-0001-a1b2c3d40001",
            "role": "system",
            "content": "@prompts/home-maintenance-triage_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/home-maintenance-triage_generate-text.ts",
        "messages": "@model-configs/home-maintenance-triage_generate-text.ts",
        "generativeModelName": "@model-configs/home-maintenance-triage_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_701",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_501.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_501",
    "source": "triggerNode_1",
    "target": "LLMNode_501",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_501-graphqlResponseNode_701",
    "source": "LLMNode_501",
    "target": "graphqlResponseNode_701",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_701",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_701",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
