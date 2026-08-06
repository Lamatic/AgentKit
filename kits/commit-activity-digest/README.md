# Commit Activity Digest

Turn a block of raw `git log` output into a structured engineering activity digest — categorized by work type, with technology detection and key highlights — ready for standups, weekly reports, or stakeholder updates.

> **Type:** Template (single Lamatic flow)

## The problem

Every week, someone asks "what did we ship?" and someone else spends 20 minutes scrolling through commit history, mentally grouping features vs fixes vs chores, and writing a summary in Slack. It's tedious, inconsistent, and easy to miss things.

## What it does

Paste your `git log` output (commit messages + optionally file paths and stats) and get back a Markdown digest with:

- **Summary** — 2-3 sentence overview of the period
- **Work Breakdown** — commits grouped by type (Features, Fixes, Refactoring, Infrastructure, Tests, Docs)
- **Technologies Touched** — languages and frameworks detected from file paths
- **Key Metrics** — commit count, lines changed, areas affected
- **Highlights** — the 1-3 things a busy reader should know

### Example

**Input**

```text
a1f2e3d feat: add JWT refresh endpoint
 src/auth/refresh.ts | 45 ++++
 src/auth/middleware.ts | 12 +-

b2c3d4e fix: prevent crash on empty CSV upload
 src/upload/parser.ts | 8 ++--

c3d4e5f refactor: extract shared validation logic
 src/lib/validators.ts | 62 ++++++
 src/api/users.ts | 18 +--

d4e5f6g feat: add dark mode toggle to settings
 src/components/settings.tsx | 34 ++++
 src/styles/theme.css | 22 ++++
```

**Output**

```markdown
### Summary
This period focused on authentication improvements and UI enhancements,
with a JWT refresh endpoint and dark mode toggle as the headline additions.
A crash on CSV upload was fixed and shared validation logic was consolidated.

### Work Breakdown

**Features**
- Added JWT token refresh endpoint (auth module)
- Added dark mode toggle to settings page (UI)

**Fixes**
- Fixed crash when uploading empty CSV files (upload module)

**Refactoring**
- Extracted shared validation logic into a reusable module

### Technologies Touched
TypeScript, React, CSS

### Highlights
- JWT refresh endpoint strengthens the auth flow
- Dark mode is now available in settings
```

## Setup

1. Import the flow into your Lamatic Studio project
2. Attach a text model to the **Analyze Activity** node
3. Deploy the flow
4. Call via GraphQL API with your git log as input

## Usage

Send a request with your git log output:

```json
{
  "git_log": "a1f2e3d feat: add auth endpoint\n src/auth.ts | 45 ++++\n...",
  "context": "Last 7 days, main branch"
}
```

The `context` field is optional — use it to tell the model what period or branch this covers.

**Tip:** Generate the input with:

```bash
git log --oneline --stat --since="7 days ago" --no-merges
```

## How it works

```text
API Request (git_log, context?)
      │
      ▼
Analyze Activity (LLM)  ──uses──▶ prompts/*  ·  constitutions/default.md  ·  model-configs/*
      │
      ▼
API Response → { digest }
```

A single flow, one LLM node. Prompts, guardrails, and model settings are externalized via `@references`.

## Project structure

```text
commit-activity-digest/
├── lamatic.config.ts
├── agent.md
├── README.md
├── flows/
│   └── commit-activity-digest.ts
├── constitutions/
│   └── default.md
├── prompts/
│   ├── commit-activity-digest_analyze-activity_system.md
│   └── commit-activity-digest_analyze-activity_user.md
└── model-configs/
    └── commit-activity-digest_analyzeActivity_generative-model-name.ts
```

## Stack

- [Lamatic.ai](https://lamatic.ai) — AI flow orchestration
- LLM — activity analysis and digest generation
