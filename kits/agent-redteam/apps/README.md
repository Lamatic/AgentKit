# Agent Red-Team Harness — App

Next.js front end for the **Agent Red-Team Harness** kit. It calls two Lamatic flows
(`run-target` and `judge`) to fire a curated attack battery at a system prompt and
render a pass/fail security gate.

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
| `RUN_TARGET_FLOW` | Deployed `run-target` flow ID (Lamatic Studio) |
| `JUDGE_FLOW` | Deployed `judge` flow ID |
| `LAMATIC_API_URL` | Studio → Settings / API |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → API Keys |

## Structure

- `actions/orchestrate.ts` — server action: per-attack `run-target` → `judge` loop, aggregation, gate
- `lib/lamatic-client.ts` — Lamatic SDK client + flow IDs from env
- `lib/eval.ts` — judge-output parsing, HTML decode, gate computation (with per-category breakdown), bounded concurrency
- `lib/attacks.ts` — the curated attack library + sample weak/hardened system prompts
- `lib/types.ts` — shared data contracts
- `components/security-scorecard.tsx`, `components/attack-results-table.tsx` — results UI
- `app/page.tsx` — the harness UI
