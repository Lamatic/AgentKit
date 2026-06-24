# LLM Eval Harness — App

Next.js front end for the **LLM Eval Harness** kit. It calls two Lamatic flows
(`run-target` and `judge`) to score a system prompt against a golden set and
render a CI-style pass/fail gate.

See the [kit README](../README.md) for the full overview.

## Run locally

```bash
cp .env.example .env.local   # fill in flow IDs + Lamatic credentials
npm install
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | Source |
|----------|--------|
| `JUDGE_FLOW` | Deployed `judge` flow ID (Lamatic Studio) |
| `RUN_TARGET_FLOW` | Deployed `run-target` flow ID |
| `LAMATIC_API_URL` | Studio → Settings / API |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → API Keys |

## Structure

- `actions/orchestrate.ts` — server action: per-case `run-target` → `judge` loop, aggregation, gate
- `lib/lamatic-client.ts` — Lamatic SDK client + flow IDs from env
- `lib/eval.ts` — judge-output parsing, HTML decode, gate computation, bounded concurrency
- `lib/types.ts` — shared data contracts
- `components/gate-banner.tsx`, `components/results-table.tsx` — results UI
- `app/page.tsx` — the harness UI
