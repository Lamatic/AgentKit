/*
 * # Git Standup Digest
 * A single-flow, API-invoked digest generator that fetches GitHub repository activity
 * (commits, merged PRs, open issues) and synthesizes it into a human-readable daily
 * standup briefing using an LLM.
 *
 * ## Purpose
 * This flow is responsible for one focused task: turning raw GitHub repository activity
 * into a concise, scannable standup digest. It is designed for developer teams and
 * solo engineers who want an AI-written morning briefing that replaces manual log
 * scanning across GitHub tabs.
 *
 * The flow fetches three data streams in sequence — commits, merged pull requests, and
 * open issues — then formats them into a clean activity block and passes it to an LLM
 * for synthesis. The outcome is a structured digest with three sections: what shipped,
 * what is in progress, and what is blocked or needs attention.
 *
 * Within the broader agent pipeline, this flow sits as a self-contained digest
 * primitive. It does not depend on a knowledge base, RAG index, or persistent memory.
 * It is invoked on demand or on a schedule and returns its output synchronously.
 * The digest can be piped downstream to a Slack webhook, a dashboard, an email
 * notification node, or any HTTP consumer.
 *
 * ## When To Use
 * - Use when you need a daily AI-written standup for a GitHub repository.
 * - Use when a developer team wants an async digest replacing the manual "what happened
 *   last night" routine.
 * - Use when scheduled as a cron job to post a morning digest to Slack or email.
 * - Use when a solo developer wants a self-generated "what did I ship yesterday" report.
 * - Use when you need a composable digest primitive to embed inside a larger DevOps
 *   notification or CI/CD pipeline.
 * - Use when the caller can supply a valid GitHub PAT with `repo` scope.
 *
 * ## When Not To Use
 * - Do not use when no `repo` or `github_token` is available in the request payload.
 * - Do not use when the required GitHub PAT does not have `repo` scope; the API calls
 *   will fail with 401.
 * - Do not use for private repositories where the token owner lacks read access.
 * - Do not use when the task is PR code review, issue triage, or commit classification
 *   rather than a digest summary — route to specialized flows instead.
 * - Do not use when real-time streaming output is required; this flow returns a single
 *   synchronous response after all three API calls complete.
 * - Do not use when GitHub API rate limits have been exhausted for the given token.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `repo` | `string` | Yes | Full repository identifier in `owner/repo` format (e.g. `vercel/next.js`). Used in all GitHub API endpoint paths. |
 * | `github_token` | `string` | Yes | GitHub Personal Access Token with `repo` scope. Sent as a Bearer token in the Authorization header of every GitHub API call. |
 * | `since` | `string` | No | ISO-8601 datetime string marking the start of the activity window (e.g. `2026-07-11T00:00:00Z`). Defaults to 24 hours before invocation if omitted. |
 *
 * The trigger expects a JSON payload. `repo` must be a valid GitHub repository slug.
 * `github_token` is treated as a credential and must never appear in the digest output.
 * `since` controls the activity window for commits; PRs and issues are fetched by
 * recency sort rather than a hard date filter and are trimmed by the format node.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `digest` | `string` | Full AI-written standup digest in Markdown, covering shipped items, recent commits, in-progress PRs, and open issues. |
 * | `highlights` | `string` | One-line summary of key wins: merged PR count and commit count for the period. |
 * | `blockers` | `string` | One-line summary of open or stale PRs and critical open issues. |
 *
 * The API response is a JSON object with three top-level string fields. `digest` is
 * the primary output and is Markdown-formatted for direct posting to Slack, email, or
 * a dashboard. `highlights` and `blockers` are extracted from the digest for callers
 * that need a one-liner rather than the full report.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow. It is invoked directly by an API
 *   caller and does not require another Lamatic flow to run first.
 *
 * ### Downstream Flows
 * - None defined in this kit. The response can be piped to any external consumer:
 *   Slack webhook, email node, dashboard, or further automation.
 *
 * ### External Services
 * - **GitHub REST API** — three endpoints are called:
 *   - `GET /repos/{owner}/{repo}/commits?since={since}&per_page=30`
 *   - `GET /repos/{owner}/{repo}/pulls?state=closed&sort=updated&direction=desc&per_page=20`
 *   - `GET /repos/{owner}/{repo}/issues?state=open&sort=updated&direction=desc&per_page=20`
 *   All calls use the `github_token` from the request payload as a Bearer token.
 * - **LLM provider** — powers `LLMNode_generate_standup` for digest synthesis.
 *   Requires a configured model in Lamatic Studio; any provider (OpenAI, Anthropic,
 *   Google, etc.) works.
 *
 * ### Environment Variables
 * - `LAMATIC_API_KEY` — authenticates the Lamatic Studio API. Managed by the platform.
 * - No additional env vars required. The GitHub token is passed per-request in the
 *   payload to allow per-caller scoping and avoid storing secrets at the project level.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode_trigger`) receives the inbound payload with `repo`,
 *    `github_token`, and optional `since`. This is the external invocation point.
 *
 * 2. `Compute Since` (`codeNode_compute_since`) checks if `since` is provided; if not,
 *    computes a default of 24 hours ago in ISO-8601 format. Emits `sinceTimestamp` and
 *    splits `repo` into `owner` and `repoName` for use in API paths.
 *
 * 3. `Fetch Commits` (`apiNode_commits`) calls the GitHub commits endpoint with the
 *    `since` filter and returns up to 30 commits. Emits raw commit objects.
 *
 * 4. `Fetch Merged PRs` (`apiNode_merged_prs`) calls the GitHub pulls endpoint with
 *    `state=closed` sorted by most recently updated. Emits up to 20 PR objects.
 *
 * 5. `Fetch Open Issues` (`apiNode_open_issues`) calls the GitHub issues endpoint with
 *    `state=open` sorted by most recently updated. Emits up to 20 issue objects.
 *    Note: GitHub's issues API returns both issues and PRs; the format node filters
 *    out PR-shaped items (those with a `pull_request` key) to keep true issues only.
 *
 * 6. `Format Activity` (`codeNode_format`) collects outputs from all three API nodes,
 *    extracts relevant fields (commit SHA + message, PR number + title + merged_at,
 *    issue number + title + created_at), computes age in days for staleness detection,
 *    and concatenates everything into a structured plain-text block that the LLM can
 *    reason about directly. Also emits `highlights` and `blockers` summary strings.
 *
 * 7. `Generate Standup` (`LLMNode_generate_standup`) receives the formatted activity
 *    block and runs the system prompt from
 *    `@prompts/git-standup-digest_generate-standup_system.md`. Produces the final
 *    Markdown digest.
 *
 * 8. `API Response` (`graphqlResponseNode_response`) returns the digest, highlights,
 *    and blockers to the caller as the flow's response payload.
 */

export const meta = {
  id: "git-standup-digest",
  name: "Git Standup Digest",
  description:
    "Fetches GitHub repository activity and synthesizes it into a human-readable daily standup digest.",
  version: "1.0.0",
};

export const inputs = {};

export const references = {
  prompts: {
    generateStandupSystem:
      "@prompts/git-standup-digest_generate-standup_system.md",
  },
  modelConfigs: {
    generateStandup:
      "@model-configs/git-standup-digest_generate-standup.ts",
  },
  constitutions: {
    default: "@constitutions/default.md",
  },
};

export const nodes = [
  // ─── 1. Trigger ──────────────────────────────────────────────────────────────
  {
    id: "graphqlNode_trigger",
    type: "graphqlNode",
    label: "API Request",
    data: {
      inputs: [
        { id: "repo", type: "string", required: true },
        { id: "github_token", type: "string", required: true },
        { id: "since", type: "string", required: false },
      ],
    },
  },

  // ─── 2. Compute Since ────────────────────────────────────────────────────────
  {
    id: "codeNode_compute_since",
    type: "codeNode",
    label: "Compute Since",
    data: {
      code: `
const sinceRaw = inputs.graphqlNode_trigger?.since;
let sinceTimestamp;
if (sinceRaw && sinceRaw.trim() !== "") {
  sinceTimestamp = sinceRaw.trim();
} else {
  // Default: 24 hours ago
  const d = new Date();
  d.setHours(d.getHours() - 24);
  sinceTimestamp = d.toISOString();
}

const repo = inputs.graphqlNode_trigger?.repo || "";
const parts = repo.split("/");
const owner = parts[0] || "";
const repoName = parts[1] || "";

return { sinceTimestamp, owner, repoName, repo };
      `.trim(),
      inputs: ["graphqlNode_trigger"],
    },
  },

  // ─── 3. Fetch Commits ────────────────────────────────────────────────────────
  {
    id: "apiNode_commits",
    type: "apiNode",
    label: "Fetch Commits",
    data: {
      method: "GET",
      url: "https://api.github.com/repos/{{codeNode_compute_since.owner}}/{{codeNode_compute_since.repoName}}/commits?since={{codeNode_compute_since.sinceTimestamp}}&per_page=30",
      headers: {
        Authorization: "Bearer {{graphqlNode_trigger.github_token}}",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  },

  // ─── 4. Fetch Merged PRs ─────────────────────────────────────────────────────
  {
    id: "apiNode_merged_prs",
    type: "apiNode",
    label: "Fetch Merged PRs",
    data: {
      method: "GET",
      url: "https://api.github.com/repos/{{codeNode_compute_since.owner}}/{{codeNode_compute_since.repoName}}/pulls?state=closed&sort=updated&direction=desc&per_page=20",
      headers: {
        Authorization: "Bearer {{graphqlNode_trigger.github_token}}",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  },

  // ─── 5. Fetch Open Issues ────────────────────────────────────────────────────
  {
    id: "apiNode_open_issues",
    type: "apiNode",
    label: "Fetch Open Issues",
    data: {
      method: "GET",
      url: "https://api.github.com/repos/{{codeNode_compute_since.owner}}/{{codeNode_compute_since.repoName}}/issues?state=open&sort=updated&direction=desc&per_page=20",
      headers: {
        Authorization: "Bearer {{graphqlNode_trigger.github_token}}",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  },

  // ─── 6. Format Activity ──────────────────────────────────────────────────────
  {
    id: "codeNode_format",
    type: "codeNode",
    label: "Format Activity",
    data: {
      code: `
const repo = inputs.codeNode_compute_since?.repo || "unknown/repo";
const sinceTimestamp = inputs.codeNode_compute_since?.sinceTimestamp || "";

// ── Commits ──────────────────────────────────────────────────────────────────
const rawCommits = inputs.apiNode_commits?.output || [];
const commits = Array.isArray(rawCommits)
  ? rawCommits.slice(0, 12).map((c) => {
      const sha = (c.sha || "").slice(0, 7);
      const msg = (c.commit?.message || "").split("\\n")[0].trim();
      return \`  - [\${sha}] \${msg}\`;
    })
  : [];

// ── Merged PRs ───────────────────────────────────────────────────────────────
const rawPRs = inputs.apiNode_merged_prs?.output || [];
const now = new Date();
const mergedPRs = Array.isArray(rawPRs)
  ? rawPRs
      .filter((pr) => pr.merged_at)
      .slice(0, 10)
      .map((pr) => {
        const ageDays = Math.floor(
          (now - new Date(pr.merged_at)) / (1000 * 60 * 60 * 24)
        );
        return \`  - #\${pr.number} — \${pr.title} (merged \${ageDays === 0 ? "today" : ageDays + "d ago"})\`;
      })
  : [];

// ── Open Issues ───────────────────────────────────────────────────────────────
// GitHub issues endpoint returns both issues and PRs; filter out PRs
const rawIssues = inputs.apiNode_open_issues?.output || [];
const openIssues = Array.isArray(rawIssues)
  ? rawIssues
      .filter((i) => !i.pull_request)
      .slice(0, 10)
      .map((i) => {
        const ageDays = Math.floor(
          (now - new Date(i.created_at)) / (1000 * 60 * 60 * 24)
        );
        const stale = ageDays >= 2 ? " ⚠️" : "";
        return \`  - #\${i.number} — \${i.title} (open \${ageDays}d)\${stale}\`;
      })
  : [];

// ── Open PRs (from merged PR endpoint, pick state=open separately) ────────────
// Note: merged PRs endpoint returns closed PRs; open PRs come from issues endpoint
// (GitHub issues?state=open also includes open PRs which have pull_request key)
const openPRs = Array.isArray(rawIssues)
  ? rawIssues
      .filter((i) => i.pull_request)
      .slice(0, 10)
      .map((i) => {
        const ageDays = Math.floor(
          (now - new Date(i.created_at)) / (1000 * 60 * 60 * 24)
        );
        const stale = ageDays >= 2 ? " ⚠️" : "";
        return \`  - #\${i.number} — \${i.title} (open \${ageDays}d)\${stale}\`;
      })
  : [];

// ── Assemble output block ─────────────────────────────────────────────────────
const lines = [
  \`REPO: \${repo}\`,
  \`PERIOD: \${sinceTimestamp} → \${now.toISOString()}\`,
  "",
  "RECENT COMMITS:",
  commits.length > 0 ? commits.join("\\n") : "  (none)",
  "",
  "MERGED PULL REQUESTS:",
  mergedPRs.length > 0 ? mergedPRs.join("\\n") : "  (none in window)",
  "",
  "OPEN PULL REQUESTS:",
  openPRs.length > 0 ? openPRs.join("\\n") : "  (none)",
  "",
  "OPEN ISSUES:",
  openIssues.length > 0 ? openIssues.join("\\n") : "  (none)",
];

const output = lines.join("\\n");

// ── One-liners ────────────────────────────────────────────────────────────────
const highlights = [
  mergedPRs.length > 0 ? \`\${mergedPRs.length} PR(s) merged\` : null,
  commits.length > 0 ? \`\${commits.length} commit(s) pushed\` : null,
]
  .filter(Boolean)
  .join(", ") || "No activity in window";

const staleCount = [...openPRs, ...openIssues].filter((l) =>
  l.includes("⚠️")
).length;
const blockers =
  staleCount > 0
    ? \`\${staleCount} stale item(s) need attention\`
    : openPRs.length > 0 || openIssues.length > 0
    ? \`\${openPRs.length} open PR(s), \${openIssues.length} open issue(s)\`
    : "No blockers";

return { output, highlights, blockers };
      `.trim(),
      inputs: [
        "codeNode_compute_since",
        "apiNode_commits",
        "apiNode_merged_prs",
        "apiNode_open_issues",
      ],
    },
  },

  // ─── 7. Generate Standup ─────────────────────────────────────────────────────
  {
    id: "LLMNode_generate_standup",
    type: "LLMNode",
    label: "Generate Standup",
    data: {
      systemPrompt: "@prompts/git-standup-digest_generate-standup_system.md",
      userPrompt: "{{codeNode_format.output}}",
      modelConfig: "@model-configs/git-standup-digest_generate-standup.ts",
      inputs: ["codeNode_format"],
    },
  },

  // ─── 8. API Response ─────────────────────────────────────────────────────────
  {
    id: "graphqlResponseNode_response",
    type: "graphqlResponseNode",
    label: "API Response",
    data: {
      output: {
        digest: "{{LLMNode_generate_standup.output}}",
        highlights: "{{codeNode_format.highlights}}",
        blockers: "{{codeNode_format.blockers}}",
      },
    },
  },
];

export const edges = [
  { source: "graphqlNode_trigger", target: "codeNode_compute_since" },
  { source: "codeNode_compute_since", target: "apiNode_commits" },
  { source: "codeNode_compute_since", target: "apiNode_merged_prs" },
  { source: "codeNode_compute_since", target: "apiNode_open_issues" },
  { source: "apiNode_commits", target: "codeNode_format" },
  { source: "apiNode_merged_prs", target: "codeNode_format" },
  { source: "apiNode_open_issues", target: "codeNode_format" },
  { source: "codeNode_format", target: "LLMNode_generate_standup" },
  { source: "LLMNode_generate_standup", target: "graphqlResponseNode_response" },
];
