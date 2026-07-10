/*
 * # Release Notes Generator
 * This flow accepts a raw list of merged pull request titles and/or commit messages and returns
 * polished, categorized Markdown release notes as the single entry point for the Release Notes
 * Generator kit.
 *
 * ## Purpose
 * This flow is responsible for the core sub-task of turning unstructured version-control history
 * into a human-readable changelog. It solves the everyday engineering chore of hand-writing
 * release notes from a pile of commit messages. It receives a `changes` blob (one PR/commit per
 * line) plus optional `version` and `date` values, and hands them to a language model that groups,
 * rewrites, and summarizes them.
 *
 * The outcome is a single Markdown string returned through the flow's API response under the
 * `releaseNotes` field. That output is the end product the kit delivers: a ready-to-publish
 * changelog that can be rendered in the bundled Next.js UI, pasted into a GitHub release, or
 * stored for later use.
 *
 * Within the broader kit, this is a standalone entry-point flow. There is no upstream retrieval or
 * planning flow; the flow performs synthesis directly through the LLM node and returns the result.
 *
 * ## When To Use
 * - Use when a caller has a list of merged PR titles and/or commit messages for one release and
 *   wants a formatted changelog.
 * - Use when a backend service, UI action, or automation needs a synchronous `changes` to
 *   `releaseNotes` transformation.
 * - Use when grouping (Features / Fixes / Breaking / Chore) and reader-friendly rewriting should be
 *   handled by the model rather than by hand.
 *
 * ## When Not To Use
 * - Do not use when the input is not a list of changes (for example, raw source code or a design
 *   document).
 * - Do not use when you need the notes to include changes that are not present in the supplied
 *   input; this flow never fabricates entries.
 * - Do not use when LLM provider credentials configured on the model node are unavailable.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `changes` | `string` | Yes | Merged PR titles and/or commit messages, one per line. |
 * | `version` | `string` | No | Version label for the release heading (e.g. `v1.2.0`). |
 * | `date` | `string` | No | Release date for the release heading (e.g. `2026-07-10`). |
 *
 * The `Generate Notes` node reads `{{triggerNode_1.output.changes}}`, `{{triggerNode_1.output.version}}`,
 * and `{{triggerNode_1.output.date}}`, so `changes` is the effective required field.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `releaseNotes` | `string` | Categorized Markdown release notes generated from the input. |
 *
 * The API response is an object with a single field, `releaseNotes`, mapped from
 * `{{LLMNode_200.output.generatedResponse}}`.
 *
 * ## Dependencies
 * ### External Services
 * - Configured LLM provider via `LLMNode` — generates the release notes from the referenced prompts
 *   and model configuration — requires the provider credentials associated with
 *   `@model-configs/release-notes-generator_generate-notes.ts`.
 *
 * ### Environment Variables
 * - `RELEASE_NOTES_GENERATOR` — deployed flow ID used by the bundled app to invoke this flow.
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — used by the caller to reach the
 *   Lamatic API runtime.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) — runtime entry point; exposes `changes`, `version`, and `date`.
 * 2. `Generate Notes` (`LLMNode`) — calls the configured text model with the referenced system and
 *    user prompts to produce the Markdown changelog.
 * 3. `API Response` (`graphqlResponseNode`) — maps `releaseNotes` to the LLM output.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Response says no changes detected | `changes` was empty or unintelligible | Provide at least one PR title or commit message per line |
 * | Notes miss expected entries | Related commits were collapsed or input was truncated | Provide clearer, de-duplicated input; re-run |
 * | Invocation fails before the flow runs | Lamatic credentials/flow ID missing in the caller | Set `RELEASE_NOTES_GENERATOR`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
 */

// Flow: release-notes-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Release Notes Generator",
  "description":
    "Transforms a raw list of merged pull request titles and commit messages into categorized, human-readable Markdown release notes.",
  "tags": ["developer-tools", "changelog", "generative"],
  "testInput": {
    "version": "v1.2.0",
    "date": "2026-07-10",
    "changes":
      "Add dark mode toggle to settings page (#412)\nfix: crash when uploading empty CSV (#419)\nBREAKING: rename `apiKey` config option to `token`\nbump next from 15.1 to 16.0\nwip refactor auth middleware\nAdd retry with backoff to webhook delivery (#421)",
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Mohd Talib Akhtar",
    "email": "mohd.talib@growthengineering.co.uk"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "release_notes_generator_generate_notes_system": "@prompts/release-notes-generator_generate-notes_system.md",
    "release_notes_generator_generate_notes_user": "@prompts/release-notes-generator_generate-notes_user.md"
  },
  "modelConfigs": {
    "release_notes_generator_generate_notes": "@model-configs/release-notes-generator_generate-notes.ts"
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
    "id": "LLMNode_200",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Notes",
        "tools": [],
        "prompts": [
          {
            "id": "9c1e6f2a-1b7d-4a2e-9c3f-1a2b3c4d5e6f",
            "role": "system",
            "content": "@prompts/release-notes-generator_generate-notes_system.md"
          },
          {
            "id": "7b2d5e1c-3f4a-4b6d-8e9f-0a1b2c3d4e5f",
            "role": "user",
            "content": "@prompts/release-notes-generator_generate-notes_user.md"
          }
        ],
        "memories": "@model-configs/release-notes-generator_generate-notes.ts",
        "messages": "@model-configs/release-notes-generator_generate-notes.ts",
        "generativeModelName": "@model-configs/release-notes-generator_generate-notes.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_300",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"releaseNotes\": \"{{LLMNode_200.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_200",
    "source": "triggerNode_1",
    "target": "LLMNode_200",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_200-graphqlResponseNode_300",
    "source": "LLMNode_200",
    "target": "graphqlResponseNode_300",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_300",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_300",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
