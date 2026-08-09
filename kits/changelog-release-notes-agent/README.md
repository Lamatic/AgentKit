# Changelog → Release Notes Agent

Turns a repository's merged pull requests into clean, customer-facing release notes — automatically grouped and rewritten in plain language, ready to publish.

## What it does

Give it a GitHub repo, and it will:
1. Fetch the most recently merged pull requests via the GitHub REST API
2. Feed the PR titles and descriptions to an LLM
3. Return formatted markdown release notes, grouped into **Features**, **Fixes**, **Breaking Changes**, and **Other** — with internal-only PRs (chores, CI config, typo fixes) filtered out and everything rewritten for an end-user audience instead of developer jargon

No manual changelog writing, no digging through commit history.

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `owner` | string | GitHub username or org that owns the repo (e.g. `facebook`) |
| `repo` | string | Repository name (e.g. `react`) |

## Example request

```json
{
  "owner": "facebook",
  "repo": "react"
}
```

## Example output

```markdown
## 🚀 Features
- Added support for async server components

## 🐛 Fixes
- Fixed a memory leak in the reconciler

## ⚠️ Breaking Changes
- Removed deprecated `componentWillMount` lifecycle method
```

## How it works

- **Trigger:** API Request node accepting `owner` and `repo`
- **Data fetch:** HTTP GET to `api.github.com/repos/{owner}/{repo}/pulls?state=closed&sort=updated&direction=desc`, filtered to merged PRs
- **Generation:** LLM node drafts and groups the release notes per a fixed prompt (see `prompts/`)
- **Response:** Returns the generated markdown as the API response

## Use cases

- Drafting release notes before a version bump
- Giving a PM or support team a quick, readable summary of what shipped
- Bootstrapping a changelog for a repo that's never had one