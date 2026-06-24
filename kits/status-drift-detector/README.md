# Status Drift Detector

A single-flow Lamatic template that catches **status drift** — when the same task or issue says one thing in one tool (e.g. a GitHub PR) and something stale or contradictory in another (e.g. a Linear/Notion/Jira ticket).

## The problem

Teams track work in multiple places: code lives in GitHub, planning lives in a separate tracker. These two sources of truth fall out of sync constantly — a PR gets merged but the ticket still says "In Progress," or a ticket gets closed but the linked PR is still open. Nobody notices until standup, or worse, until a stakeholder asks for a status update.

## What this flow does

Given two short status descriptions (one from each source) plus optional context, the flow:

1. Compares the two statuses using an LLM reasoning step
2. Determines whether they're in sync or have drifted
3. If drifted, suggests the status that best reflects reality and explains why

## Input

```json
{
  "source_a_status": "GitHub PR #42 merged to main 2 days ago",
  "source_b_status": "Linear ticket ENG-118 still marked 'In Progress'",
  "context": "Engineering sprint board, backend team"
}
```

## Output

The flow returns a `result` field containing a JSON string in this shape:

```json
{
  "drift_detected": true,
  "current_status_a": "Merged",
  "current_status_b": "In Progress",
  "suggested_status": "Done",
  "reason": "The PR was merged 2 days ago, but the tracker ticket hasn't been updated to reflect completion."
}
```

> **Note:** Some models occasionally wrap the JSON in markdown code fences despite instructions not to. If you're consuming this programmatically, strip any leading/trailing code fence markers before calling `JSON.parse()` on the `result` string.

## How it works

A single `Generate Text` (LLM) node sits between the API trigger and the API response. The system prompt instructs the model to act as a status-reconciliation assistant, always return strict JSON in the shape above, and to handle missing/empty inputs gracefully (returning `drift_detected: false` and an explanatory reason rather than refusing or asking clarifying questions).

## Setup

1. Deploy this flow in [Lamatic Studio](https://studio.lamatic.ai)
2. Get your `LAMATIC_API_KEY` from **Settings → API Keys**
3. Get the Flow ID from the deployed flow's details panel
4. Call it via the Lamatic SDK or REST API with the input shape above

## Tradeoffs & assumptions

- This is intentionally a single-flow **template**, not a full app — it's meant to be called from existing tooling (a GitHub Action, a cron job, a Slack bot, etc.) rather than used through a dedicated UI.
- The flow does not connect directly to GitHub or any tracker API — it expects the calling system to fetch and pass in the two status strings. This keeps the flow provider-agnostic: it works the same whether your second source is Linear, Jira, Notion, Asana, or anything else, without needing a dedicated integration per tool.
- "Drift" detection is intentionally conservative — the prompt instructs the model not to flag minor wording differences as drift, only genuine status mismatches.
