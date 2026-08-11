# Changelog → Release Notes Agent

Turns a repository's merged pull requests into clean, customer-facing release notes — automatically grouped and rewritten in plain language, ready to publish.

## What it does

Give it a GitHub repo, and it will:
1. Fetch merged pull requests via the GitHub Search API
2. Feed the PR titles and descriptions to an LLM
3. Return formatted markdown release notes, grouped into Features, Fixes, Breaking Changes, and Other — with internal-only PRs (chores, CI config, typo fixes) filtered out and everything rewritten for an end-user audience instead of developer jargon

## Setup

1. Import the flow: in Lamatic Studio (studio.lamatic.ai), create a new project and import this flow, or recreate it from `flows/changelog-release-notes-agent.ts`.
2. Configure the model: the Generate Text node uses a Lamatic-managed LLM by default — no external API key required. To use your own provider, add credentials under Settings → Connections.
3. Deploy: click Deploy in the flow editor. Note your endpoint URL and API key from Settings → API Keys.
4. Call the API: send a POST request with `owner` and `repo`.

```bash
curl -X POST https://your-deployed-flow-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LAMATIC_API_KEY" \
  -d '{"owner": "facebook", "repo": "react"}'
```

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `owner` | string | GitHub username or org (e.g. `facebook`) |
| `repo` | string | Repository name (e.g. `react`) |

## Example output

```markdown
## 🚀 Features
- Added support for async server components

## 🐛 Fixes
- Fixed a memory leak in the reconciler

## ⚠️ Breaking Changes
- Removed deprecated componentWillMount lifecycle method
```

## How it works

- Trigger: API Request node accepting `owner` and `repo`
- Data fetch: GitHub Search API query for merged pull requests on the given repo
- Generation: LLM node drafts and groups the release notes, treating all fetched PR text as untrusted data, not instructions
- Response: returns the generated markdown as the API response

## Use cases

- Drafting release notes before a version bump
- Giving a PM or support team a quick summary of what shipped
- Bootstrapping a changelog for a repo that's never had one