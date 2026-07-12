<a href="https://studio.lamatic.ai/template/git-standup-digest" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;transition:background 0.2s;box-shadow:0 2px 8px 0 #0001;">Deploy on Lamatic</span>
  </div>
</a>

# Git Standup Digest

> **Problem:** Developers waste 10–15 minutes every morning manually scanning GitHub commit logs, PR lists, and issue trackers to figure out what happened overnight. There's no single AI-powered briefing that turns raw Git activity into a clean daily standup digest.

**Git Standup Digest** is a Lamatic template that calls the GitHub REST API to fetch recent commits, merged PRs, and open issues, then uses an LLM to write a concise, human-readable async standup — replacing manual log scanning with an AI-written morning briefing.

## About This Flow

This single-flow, API-triggered template:
1. Accepts a GitHub repo identifier + time window (ISO-8601 `since` datetime)
2. Fetches commits, merged PRs, and open issues via the GitHub REST API
3. Formats the raw activity data into a clean context block
4. Synthesizes a structured standup digest using an LLM

This flow includes **6 nodes** working together to produce the digest:
- `graphqlNode` (API Request trigger)
- `apiNode` × 3 (commits, merged PRs, open issues)
- `codeNode` (format activity)
- `LLMNode` (generate standup)
- `graphqlResponseNode` (API Response)

## Quick Start

### 1. Import into Lamatic Studio

1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and sign in
2. Create a new project
3. Import this template or copy the flow from `flows/git-standup-digest.ts`
4. Configure your LLM provider in the `Generate Standup` node

### 2. Get Your GitHub Token

Create a GitHub Personal Access Token (PAT) with `repo` scope at:
`https://github.com/settings/tokens`

Pass it as `github_token` in your request payload — no environment variable needed.

### 3. Call the Flow

```bash
curl -X POST https://your-lamatic-endpoint/graphql \
  -H "Authorization: Bearer $LAMATIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "owner/repo-name",
    "github_token": "ghp_your_token_here",
    "since": "2026-07-11T00:00:00Z"
  }'
```

**Response:**
```json
{
  "digest": "## Git Standup — owner/repo\n\n**Period:** Last 24 hours\n\n### ✅ What shipped\n- Merged: feat: add user authentication (#42)\n- Merged: fix: resolve null pointer in payment flow (#41)\n\n### 🔨 Recent commits\n- fix typos in README\n- refactor: extract shared utility functions\n\n### 🚧 Open / needs attention\n- #38 — perf: reduce bundle size (open, 3 days old)\n- #35 — bug: intermittent test failures (open, 5 days old)",
  "highlights": "2 PRs merged, 4 commits pushed",
  "blockers": "2 open PRs older than 2 days"
}
```

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `repo` | string | **Yes** | Full repo name in `owner/repo` format (e.g. `vercel/next.js`) |
| `github_token` | string | **Yes** | GitHub PAT with `repo` scope |
| `since` | string | No | ISO-8601 datetime (defaults to 24 hours ago if omitted) |

## Outputs

| Field | Type | Description |
|---|---|---|
| `digest` | string | Full AI-written standup digest in Markdown |
| `highlights` | string | One-line summary of key wins (merged PRs, commit count) |
| `blockers` | string | One-line summary of open/stale items needing attention |

## Use Cases

- **Engineering team standup**: Schedule this every morning via cron and post to Slack
- **Solo developer self-review**: "What did I ship yesterday?"
- **Manager digest**: Get a quick read on team repo activity without context-switching
- **CI/CD notification**: Trigger post-deploy to summarize what changed

## Files Included

- `flows/git-standup-digest.ts` — Complete flow definition with all nodes and edges
- `prompts/git-standup-digest_generate-standup_system.md` — LLM system prompt for digest synthesis
- `model-configs/git-standup-digest_generate-standup.ts` — Model configuration reference
- `constitutions/default.md` — Agent behavioral guardrails

## Customization Tips

- **Extend the time window**: Change `since` to `7 days ago` for a weekly digest
- **Filter by author**: Add `?author=username` to the commits API call
- **Add labels filtering**: Append `?labels=bug` to the issues fetch for bug-only digests
- **Chain with Slack**: Pipe the `digest` output to a Slack webhook node after `API Response`

## Community

- [Lamatic Slack](https://lamatic.ai/docs/slack) — get help and share what you build
- [AgentKit GitHub](https://github.com/Lamatic/AgentKit) — browse more templates, kits, and bundles
