# feat: Add SQL Performance Tuner kit

## Summary

Adds the SQL Performance Tuner AgentKit challenge submission: a bounded SQLite
optimization agent with a Next.js app, two Lamatic flows, deterministic safety
and equivalence checks, adaptive experiment evidence, reviewer explanation, and
QA artifacts.

## What is included

- Next.js app for demo/live SQLite query tuning
- `sql-tuner-strategist` Lamatic flow export
- `sql-tuner-reviewer` Lamatic flow export
- Prompt and model config resources for both flows
- Deterministic SQLite sandbox, guards, result comparison, benchmarking, and
  winner selection
- Reviewer transparency UI and evidence trail
- Contract checks and focused runner tests
- Browser QA notes, screenshots, and demo-video script

## Safety boundary

- Accepts only deterministic `SELECT` or `WITH` input queries.
- Runs candidate changes only in fresh in-memory SQLite copies.
- Allows only simple `CREATE INDEX ... ON table(column, ...)` candidates.
- Rejects unsafe SQL, duplicate/equivalent candidates, non-equivalent rewrites,
  execution failures, and improvements below `1.10x`.
- Keeps Lamatic credentials server-side and ignores `.env.local`.

## Testing

```bash
cd kits/sql-performance-tuner/apps
npm run check:contracts
npm run typecheck -- --incremental false
npm test
npm run build
```

All commands passed locally.

Additional smoke coverage:

- Demo API run returned `status: improved` with reviewer output.
- Live Lamatic API run returned `status: improved` with reviewer output and a
  measured `1.44x` conclusion.
- Uploaded SQLite fixture run returned reviewer output.
- No-improvement query returned `status: no-proven-improvement` and recommended
  keeping the original query.
- Invalid SQL and invalid SQLite upload return `400` without invoking Lamatic.

## QA artifacts

- `docs/qa/browser-qa.md`
- `docs/qa/sql-tuner-shell-desktop.png`
- `docs/qa/sql-tuner-shell-mobile.png`
- `docs/demo-video-script.md`

## Challenge

Please apply the `agentkit-challenge` label.
