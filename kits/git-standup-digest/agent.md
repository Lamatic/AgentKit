# Git Standup Digest

## Overview
This template solves the daily developer pain of manually scanning GitHub to understand what happened overnight or over a time window. It implements a **single-flow**, API-triggered agent pipeline in Lamatic AgentKit that fetches repository activity from the GitHub REST API — commits, merged pull requests, and open issues — then uses an LLM to synthesize everything into a concise, human-readable standup digest.

The primary invoker is any HTTP/GraphQL-capable client: a cron job, a Slack bot, a CI step, or a developer's morning script. Key integrations include the GitHub REST API (via API nodes), a code node for data formatting, and an LLM text-generation node for synthesis.

---

## Purpose
The goal of this agent is to replace the 10–15 minutes developers spend every morning clicking through GitHub tabs — commit history, PR list, issue tracker — with a single AI-written briefing that answers: *"What happened since yesterday, what's blocked, and what shipped?"*

After it runs, the caller has a structured digest covering:
- **What changed**: merged PRs and recent commits
- **Highlights**: key wins from the time window
- **Blockers**: open/stale PRs and critical open issues

Because this kit is a template with a single runnable flow, the system purpose is intentionally focused and composable: it is a reliable digest primitive that can be scheduled, embedded in a Slack workflow, triggered from a dashboard, or chained into a larger DevOps notification pipeline.

---

## Flows

### Git Standup Digest

**Trigger:**
- Invocation: API call via `API Request` (`graphqlNode`) followed by `API Response` (`graphqlResponseNode`)
- Input payload shape:

```json
{
  "repo": "owner/repo",
  "github_token": "ghp_...",
  "since": "2026-07-11T00:00:00Z"
}
```

**What it does:**
1. `API Request` (`graphqlNode`) — receives the inbound payload with `repo`, `github_token`, and `since`
2. `Fetch Commits` (`apiNode`) — calls `GET /repos/{owner}/{repo}/commits?since={since}` with Bearer auth; returns up to 30 recent commits
3. `Fetch Merged PRs` (`apiNode`) — calls `GET /repos/{owner}/{repo}/pulls?state=closed&sort=updated&direction=desc` to get recently merged pull requests
4. `Fetch Open Issues` (`apiNode`) — calls `GET /repos/{owner}/{repo}/issues?state=open&sort=updated&direction=desc` to surface active blockers
5. `Format Activity` (`codeNode`) — collects the three API responses, extracts relevant fields (commit messages, PR titles, issue titles), and formats them into a clean text block for the LLM
6. `Generate Standup` (`LLMNode`) — runs the system prompt with the formatted activity block and synthesizes a human-readable digest
7. `API Response` (`graphqlResponseNode`) — returns `{ digest, highlights, blockers }` to the caller

**Output:**
```json
{
  "digest": "## Git Standup — owner/repo\n...",
  "highlights": "...",
  "blockers": "..."
}
```

**When to use this flow:**
- Use when you want an AI-generated async standup from any GitHub repo
- Use when running a scheduled morning briefing for an engineering team
- Use when embedding a digest step inside a Slack bot, dashboard, or CI notification pipeline
- Use when a solo developer wants a quick "what did I do yesterday" self-report

**Dependencies:**
- GitHub Personal Access Token (PAT) with `repo` scope (passed as `github_token` in the request payload)
- LLM provider configured in Lamatic Studio

---

## Environment Variables / Private Inputs

| Variable | Description |
|---|---|
| `LAMATIC_API_KEY` | Your Lamatic project API key |

> The GitHub token is passed per-request in the payload (`github_token`), not as an env var, so each caller can scope it to the target repo.

---

## Architecture

```
[API Request]
     ↓
[Fetch Commits (GitHub API)]  ←─ GET /repos/{owner}/{repo}/commits?since=...
     ↓
[Fetch Merged PRs (GitHub API)] ←─ GET /repos/{owner}/{repo}/pulls?state=closed
     ↓
[Fetch Open Issues (GitHub API)] ←─ GET /repos/{owner}/{repo}/issues?state=open
     ↓
[Format Activity (codeNode)] ←─ extracts & formats commits + PRs + issues
     ↓
[Generate Standup (LLMNode)] ←─ synthesizes digest using @prompts/...
     ↓
[API Response]
```
