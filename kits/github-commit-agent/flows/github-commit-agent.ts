/*
 * # GitHub Commit Agent
 * Fetches commits between two git refs from a public GitHub repository and produces
 * a structured, human-readable summary grouped into features, bug fixes, breaking
 * changes, and maintenance — suitable for release notes, sprint updates, incident
 * diffs, and team communications.
 *
 * ## Purpose
 * Every software team ships code constantly, but writing meaningful release notes,
 * sprint summaries, or incident diffs is tedious, skipped, or done poorly.
 * This flow eliminates that friction. Given a GitHub repo and two refs (tags, branch
 * names, or commit SHAs), it hits the GitHub Commits API, collects all commit messages
 * in that range, sends them to an LLM for classification and summarisation, and returns
 * a clean markdown document ready to paste into a CHANGELOG, Slack message, or incident
 * report.
 *
 * ## When To Use
 * - Use when you need release notes for a new version (e.g. v1.2.0 → v1.3.0).
 * - Use when a manager asks "what shipped this sprint?" and nobody wrote it down.
 * - Use to understand what changed in an unfamiliar codebase between two points in time.
 * - Use before/after a production incident to audit exactly what was deployed.
 * - Use when generating non-technical release communications for product or stakeholder teams.
 *
 * ## When Not To Use
 * - Do not use for private repositories unless a valid GITHUB_TOKEN with repo access is configured.
 * - Do not use when the two refs are identical or when there are no commits between them.
 * - Do not use as a substitute for actual code review — this summarises commit messages, not diffs.
 *
 * ## Inputs
 * | Field      | Type   | Required | Description |
 * |------------|--------|----------|-------------|
 * | `message`  | string | Yes      | Natural language prompt, e.g. "What changed in Lamatic/AgentKit since v1.0.0?" |
 *
 * ## Outputs
 * | Field     | Type   | Description |
 * |-----------|--------|-------------|
 * | `summary` | string | Structured markdown summary grouped by: ✨ Features, 🐛 Bug Fixes, 💥 Breaking Changes, 🔧 Maintenance |
 * | `compared`| string | The resolved refs range compared |
 *
 * ## Dependencies
 * - GitHub REST API (public repos — no token required; private repos need GITHUB_TOKEN)
 * - LLM provider configured in model-configs (e.g. OpenAI, Anthropic, Groq)
 */

// Flow: github-commit-agent

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "GitHub Commit Agent",
  description: "Fetches commits between two git refs from a public GitHub repo and generates a structured, human-readable summary grouped by type: features, fixes, breaking changes, and maintenance.",
  tags: ["✨ Generative", "🛠️ DevTools", "🤖 Automation"],
  testInput: {
    message: "What changed in Lamatic/AgentKit since v1.0.0?"
  },
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/github-commit-agent",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Kritiman Talukdar",
    email: "kritiman_ug_24@ee.nits.ac.in"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    github_commit_agent_parse_intent_system: "@prompts/github-commit-agent_parse-intent_system.md",
    github_commit_agent_parse_intent_user:   "@prompts/github-commit-agent_parse-intent_user.md",
    github_commit_agent_llm_node_system:     "@prompts/github-commit-agent_llm-node_system.md",
    github_commit_agent_llm_node_user:       "@prompts/github-commit-agent_llm-node_user.md"
  },
  scripts: {
    github_commit_agent_code_node: "@scripts/github-commit-agent_code-node.ts"
  },
  modelConfigs: {
    github_commit_agent_parse_intent: "@model-configs/github-commit-agent_parse-intent.ts",
    github_commit_agent_llm_node:     "@model-configs/github-commit-agent_llm-node.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  // ── Node 1: Trigger ───────────────────────────────
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
        advance_schema: `{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Natural language request, e.g. 'What changed in Lamatic/AgentKit since v1.0.0?' or 'Show me the last two releases of vercel/next.js'"
    }
  },
  "required": ["message"]
}`
      }
    }
  },

  // ── Node 2: Parse Intent (LLM) ────────────────────
  {
    id: "LLMNode_parse_50",
    type: "dynamicNode",
    position: { x: 0, y: 200 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Parse Intent",
        tools: [],
        prompts: [
          {
            id: "parse-system-1",
            role: "system",
            content: "@prompts/github-commit-agent_parse-intent_system.md"
          },
          {
            id: "parse-user-1",
            role: "user",
            content: "@prompts/github-commit-agent_parse-intent_user.md"
          }
        ],
        messages: "@model-configs/github-commit-agent_parse-intent.ts",
        generativeModelName: "@model-configs/github-commit-agent_parse-intent.ts"
      }
    }
  },

  // ── Node 3: Fetch Commits (Code) ──────────────────
  {
    id: "codeNode_100",
    type: "dynamicNode",
    position: { x: 0, y: 400 },
    data: {
      nodeId: "codeNode",
      values: {
        nodeName: "Fetch Commits from GitHub",
        code: "@scripts/github-commit-agent_code-node.ts",
        inputs: {
          parsedIntent: "{{LLMNode_parse_50.output.generatedResponse}}"
        }
      }
    }
  },

  // ── Node 4: Summarise (LLM) ───────────────────────
  {
    id: "LLMNode_200",
    type: "dynamicNode",
    position: { x: 0, y: 600 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Classify & Summarise Commits",
        tools: [],
        prompts: [
          {
            id: "prompt-system-1",
            role: "system",
            content: "@prompts/github-commit-agent_llm-node_system.md"
          },
          {
            id: "prompt-user-1",
            role: "user",
            content: "@prompts/github-commit-agent_llm-node_user.md"
          }
        ],
        messages: "@model-configs/github-commit-agent_llm-node.ts",
        generativeModelName: "@model-configs/github-commit-agent_llm-node.ts"
      }
    }
  },

  // ── Node 5: Response ──────────────────────────────
  {
    id: "graphqlResponseNode_300",
    type: "dynamicNode",
    position: { x: 0, y: 800 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping: `{
  "summary":  "{{LLMNode_200.output.generatedResponse}}",
  "compared": "{{codeNode_100.output.resolvedBase}}...{{codeNode_100.output.resolvedHead}}"
}`
      }
    }
  }
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_parse_50",
    source: "triggerNode_1",
    target: "LLMNode_parse_50",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_parse_50-codeNode_100",
    source: "LLMNode_parse_50",
    target: "codeNode_100",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "codeNode_100-LLMNode_200",
    source: "codeNode_100",
    target: "LLMNode_200",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "LLMNode_200-graphqlResponseNode_300",
    source: "LLMNode_200",
    target: "graphqlResponseNode_300",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge"
  },
  {
    id: "response-graphqlResponseNode_300",
    source: "triggerNode_1",
    target: "graphqlResponseNode_300",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
