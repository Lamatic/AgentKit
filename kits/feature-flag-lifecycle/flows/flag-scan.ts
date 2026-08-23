/*
 * # Feature Flag Scan
 * Scans source code from a repository for all feature flag declarations, evaluations, and configuration references, returning a structured inventory of discovered flags.
 *
 * ## Purpose
 * This flow is responsible for taking a repository URL and its source code content, then identifying every feature flag used across the codebase. Rather than relying on manual audits or scattered grep searches, the flow centralizes flag discovery using an LLM that understands common flag patterns across LaunchDarkly, ConfigCat, Split, Flagsmith, Statsig, Unleash, Growthbook, and custom/environment-variable implementations.
 *
 * Its outcome is a structured JSON inventory of flags, each with its name, type, file location, context snippet, whether it is a declaration or usage, and a description. This inventory is the foundation for the cleanup-planning flow in this bundle.
 *
 * ## When To Use
 * - Use when you want to audit a codebase for feature flag technical debt.
 * - Use when migrating from one flag provider to another and need an inventory first.
 * - Use when onboarding to a new codebase and want to quickly understand toggle patterns.
 * - Use when preparing for a flag cleanup initiative and need to know what exists.
 *
 * ## When Not To Use
 * - Do not use when the code is not available as text (e.g., compiled binaries only).
 * - Do not use when no source code is provided in `codeContent`.
 * - Do not use when you need real-time flag state monitoring rather than static code analysis.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `repoUrl` | `string` | Yes | The GitHub repository URL for context (e.g., https://github.com/owner/repo). |
 * | `codeContent` | `string` | Yes | The source code content to scan for feature flags. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `flags` | `array` | List of discovered flags with name, type, file, context, etc. |
 * | `totalFlags` | `number` | Total count of flags found. |
 * | `repoUrl` | `string` | Echoed repository URL. |
 *
 * ## Dependencies
 * - External Services: Lamatic API runtime for flow execution.
 * - LLM Provider: configured via `@model-configs/flag-scan.ts`.
 *
 * ## Notes
 * - The flow accepts raw code content as input; a companion Next.js app or CI tool can fetch GitHub file contents via the API before invoking this flow.
 * - The LLM is instructed to return strict JSON; a code node validates and normalizes the output.
 */

// Flow: flag-scan

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "Feature Flag Scan",
  description: "Scans source code for all feature flag declarations, evaluations, and configuration references.",
  tags: ["developer-tools", "feature-flags", "code-quality"],
  testInput: {
    repoUrl: "https://github.com/example/my-repo",
    codeContent: "const flagsmith = require('flagsmith');\nif (flagsmith.desiredFeatures.my_new_checkout) {\n  // new checkout flow\n} else {\n  // legacy checkout\n}\n\nconst ldClient = require('launchdarkly-node-server-sdk');\nconst client = ldClient.init(process.env.LD_SDK_KEY);\nif (await client.variation('new-onboarding', user, false)) {\n  showNewOnboarding();\n} else {\n  showOldOnboarding();\n}"
  },
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Meetraj Singh",
    email: "meetrajsingh@example.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_137": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
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
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "flag_scan_system": "@prompts/flag-scan_system.md",
    "flag_scan_user": "@prompts/flag-scan_user.md"
  },
  "modelConfigs": {
    "flag_scan": "@model-configs/flag-scan.ts"
  },
  "scripts": {
    "flag_scan_organize": "@scripts/flag-scan_organize.ts"
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
    },
    "measured": {
      "width": 218,
      "height": 95
    },
    "selected": false
  },
  {
    "id": "LLMNode_137",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Flag Scanner",
        "tools": [],
        "prompts": [
          {
            "id": "a1b2c3d4-0001-4f2a-9b3c-000000000001",
            "role": "system",
            "content": "@prompts/flag-scan_system.md"
          },
          {
            "id": "a1b2c3d4-0002-4f2a-9b3c-000000000002",
            "role": "user",
            "content": "@prompts/flag-scan_user.md"
          }
        ],
        "memories": "@model-configs/flag-scan.ts",
        "messages": "@model-configs/flag-scan.ts",
        "attachments": "@model-configs/flag-scan.ts",
        "credentials": "@model-configs/flag-scan.ts",
        "generativeModelName": "@model-configs/flag-scan.ts"
      }
    },
    "measured": {
      "width": 218,
      "height": 95
    },
    "selected": false
  },
  {
    "id": "codeNode_283",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Organize Output",
        "code": "@scripts/flag-scan_organize.ts"
      }
    },
    "measured": {
      "width": 218,
      "height": 95
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"flags\": \"{{codeNode_283.output.flags}}\",\n  \"totalFlags\": \"{{codeNode_283.output.totalFlags}}\",\n  \"repoUrl\": \"{{triggerNode_1.output.repoUrl}}\"\n}"
      }
    },
    "measured": {
      "width": 218,
      "height": 95
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_137",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_137",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_137-codeNode_283",
    "type": "defaultEdge",
    "source": "LLMNode_137",
    "target": "codeNode_283",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_283-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_283",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
