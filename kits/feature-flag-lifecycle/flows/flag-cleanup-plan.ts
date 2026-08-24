/*
 * # Feature Flag Cleanup Planner
 * Takes a flag inventory from the scan flow and generates a prioritized cleanup plan with risk assessment and deprecation timelines.
 *
 * ## Purpose
 * This flow is responsible for evaluating the lifecycle status of every feature flag discovered by the flag-scan flow, and producing a prioritized cleanup plan. Rather than leaving stale flags to accumulate as technical debt, the flow categorizes each flag by removal risk, estimates the effort to remove it, recommends specific deprecation actions, and assigns a timeline — all delivered as structured JSON that an engineer can act on directly.
 *
 * Its outcome is a cleanup plan that engineering teams can execute to systematically retire feature flags, reducing codebase complexity and maintenance burden.
 *
 * ## When To Use
 * - Use after running the flag-scan flow to get a flag inventory.
 * - Use when planning a quarterly tech-debt sprint focused on flag cleanup.
 * - Use when migrating flag providers and need to know which flags to remove first.
 * - Use when auditing for release hygiene and need deprecation recommendations.
 *
 * ## When Not To Use
 * - Do not use before running flag-scan to obtain a flag inventory.
 * - Do not use when you need real-time flag state monitoring rather than cleanup planning.
 * - Do not use when the goal is to add new flags rather than retire existing ones.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `repoUrl` | `string` | No | The repository URL for context. |
 * | `flags` | `array` | Yes | The flag inventory from flag-scan (array of flag objects). |
 * | `flagStatusMapping` | `object` | No | Optional mapping of flag names to statuses (active, always-on, experiment-completed, archived). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `cleanupPlan` | `array` | Prioritized list of cleanup items with risk, effort, timeline, and actions. |
 * | `summary` | `object` | Aggregate metrics (total flags, removable, active, estimated savings). |
 * | `repoUrl` | `string` | Echoed repository URL. |
 *
 * ## Dependencies
 * - Upstream: flag-scan flow (provides `flags` inventory)
 * - External Services: Lamatic API runtime for flow execution.
 * - LLM Provider: configured via `@model-configs/flag-cleanup-plan.ts`.
 *
 * ## Notes
 * - The `flagStatusMapping` input allows override of inferred statuses. Without it, the LLM infers status from usage patterns.
 * - Only flags that are candidates for cleanup (not actively toggled) appear in the cleanup plan.
 */

// Flow: flag-cleanup-plan

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "Feature Flag Cleanup Planner",
  description: "Evaluates discovered feature flags and generates a prioritized cleanup plan with risk assessment and deprecation timelines.",
  tags: ["developer-tools", "feature-flags", "technical-debt", "code-quality"],
  testInput: {
    repoUrl: "https://github.com/example/my-repo",
    flags: [
      {
        flagName: "new-onboarding",
        type: "launchdarkly",
        file: "src/App.js",
        lineNumber: 42,
        context: "if (await client.variation('new-onboarding', user, false))",
        isDeclaration: false,
        description: "Controls whether new onboarding flow is shown"
      },
      {
        flagName: "legacy-checkout",
        type: "launchdarkly",
        file: "src/Checkout.js",
        lineNumber: 18,
        context: "if (await client.variation('legacy-checkout', user, true))",
        isDeclaration: false,
        description: "Uses legacy checkout flow"
      }
    ],
    flagStatusMapping: {
      "new-onboarding": "always-on",
      "legacy-checkout": "experiment-completed"
    }
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
  "LLMNode_215": [
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
    "flag_cleanup_plan_system": "@prompts/flag-cleanup-plan_system.md",
    "flag_cleanup_plan_user": "@prompts/flag-cleanup-plan_user.md"
  },
  "modelConfigs": {
    "flag_cleanup_plan": "@model-configs/flag-cleanup-plan.ts"
  },
  "scripts": {
    "flag_cleanup_plan_organize": "@scripts/flag-cleanup-plan_organize.ts"
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
    "id": "LLMNode_215",
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
        "nodeName": "Cleanup Planner",
        "tools": [],
        "prompts": [
          {
            "id": "b2c3d4e5-0001-4f2a-9b3c-000000000003",
            "role": "system",
            "content": "@prompts/flag-cleanup-plan_system.md"
          },
          {
            "id": "b2c3d4e5-0002-4f2a-9b3c-000000000004",
            "role": "user",
            "content": "@prompts/flag-cleanup-plan_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": "@model-configs/flag-cleanup-plan.ts"
      }
    },
    "measured": {
      "width": 218,
      "height": 95
    },
    "selected": false
  },
  {
    "id": "codeNode_391",
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
        "nodeName": "Organize Plan",
        "code": "@scripts/flag-cleanup-plan_organize.ts"
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
        "outputMapping": "{\n  \"cleanupPlan\": \"{{codeNode_391.output.cleanupPlan}}\",\n  \"summary\": \"{{codeNode_391.output.summary}}\",\n  \"error\": \"{{codeNode_391.output.error}}\",\n  \"repoUrl\": \"{{triggerNode_1.output.repoUrl}}\"\n}"
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
    "id": "triggerNode_1-LLMNode_215",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_215",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_215-codeNode_391",
    "type": "defaultEdge",
    "source": "LLMNode_215",
    "target": "codeNode_391",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_391-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_391",
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
