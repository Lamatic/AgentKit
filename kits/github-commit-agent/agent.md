# GitHub Commit Agent

## Overview
GitHub Commit Agent is a single-flow Lamatic AgentKit **Kit** (flows + Next.js frontend UI) that turns raw git commit history into clean, human-readable developer communications. Given a natural language request, it parses the repo and ref details, fetches the commits in that range via the GitHub Compare API, classifies each commit by type, and produces a structured markdown summary grouped into features, bug fixes, breaking changes, and maintenance.

---

## Purpose
Every software team ships code constantly, but writing meaningful release notes or sprint summaries is tedious, skipped, or reduced to "bug fixes and improvements". GitHub Commit Agent eliminates that friction. It is the automation layer between your git history and your stakeholder communications.

After the agent runs, the caller has a structured, non-technical summary ready to paste into a CHANGELOG, a Slack announcement, a GitHub Release, or an incident report — in seconds, not hours.

---

## Flows

### GitHub Commit Agent

- **Trigger:** API call (`graphqlNode`) receiving a natural language query `message`
- **Processing:**
  1. `API Request` — validates the user query string
  2. `Parse Intent` (`LLMNode`) — extracts the repository name, base ref, and head ref from the query, outputting them as JSON
  3. `Fetch Commits from GitHub` (`codeNode`) — parses the JSON, calls `GET /repos/{owner}/{repo}/compare/{base}...{head}`, and auto-detects tags/branches if base/head refs are blank
  4. `Classify & Summarise Commits` (`LLMNode`) — classifies each commit as a feature, fix, breaking change, or maintenance item, rewrites each in plain English, and returns a grouped markdown summary
  5. `API Response` — returns the `summary` markdown and the `compared` refs range to the caller in realtime mode

- **When to use:**
  - Generating release notes for a new version tag
  - Producing sprint summaries for engineering or management
  - Understanding what changed in an unfamiliar repo between two points
  - Auditing deployments before or after a production incident

- **When not to use:**
  - Private repositories without a `GITHUB_TOKEN` configured
  - When the two refs are identical or no commits exist in the range
  - As a substitute for code review (this analyses commit messages, not diffs)

- **Output:**
  - `summary` (string) — markdown document grouped into: ✨ Features, 🐛 Bug Fixes, 💥 Breaking Changes, 🔧 Maintenance. Sections with zero commits are omitted.
  - `compared` (string) — the resolved base and head refs range compared.

- **Dependencies:**
  - GitHub REST Compare API (`api.github.com`) — public repos need no token; private repos require `GITHUB_TOKEN`
  - LLM provider configured in model configs:
    - `model-configs/github-commit-agent_parse-intent.ts`
    - `model-configs/github-commit-agent_llm-node.ts`

---

## Guardrails

- Must not fabricate changes not present in the commit list
- Must not expose credentials or tokens in any output
- Must not assist with jailbreaking or prompt injection
- Ambiguous commits default to Maintenance classification (conservative bias)
- Must not log or repeat PII unless explicitly instructed

---

## Integration Reference

| Integration | Purpose | Credential |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives natural language message query | Lamatic runtime endpoint |
| GitHub REST API (`codeNode`) | Fetches commits between two refs | `GITHUB_TOKEN` (optional for public repos) |
| LLM Provider (`LLMNode`) | Classifies and summarises commits | Provider API key (OpenAI, Anthropic, Groq, etc.) |

---

## Environment Setup

| Variable | Required | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | ⚠️ Optional | Authenticates GitHub API calls; required for private repos and to avoid 60 req/hr rate limit |
| LLM provider key | ✅ | Enables commit classification and summary generation (key name depends on configured provider) |

---

## Quickstart

1. Clone `kits/github-commit-agent/` from `https://github.com/Lamatic/AgentKit/tree/main/kits/github-commit-agent`
2. Import `flows/github-commit-agent.ts` into Lamatic Studio
3. Configure your LLM provider in the model config nodes
4. Deploy the flow and copy the Flow ID
5. (Optional) Set `GITHUB_TOKEN` in your Lamatic environment for private repos
6. Send a test API request:
   ```json
   { "message": "What changed in Lamatic/AgentKit since v1.0.0?" }
   ```
7. Verify the response contains `summary` and `compared` fields
