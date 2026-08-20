# Appeal Copilot — App

Next.js app for the Appeal Copilot AgentKit contribution. See the [kit README](../README.md) for the full product description and Lamatic Studio setup.

## Quickstart

```bash
cp .env.example .env.local   # optional — leave unset for demo mode
npm install
npm run dev
# open http://localhost:3000
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `LAMATIC_API_URL` | For live mode | Lamatic project API base URL |
| `LAMATIC_PROJECT_ID` | For live mode | Lamatic project ID |
| `LAMATIC_API_KEY` | For live mode | Lamatic project API key |
| `APPEAL_ANALYSIS_FLOW_ID` | For live mode | Deployed flow ID for `appeal-analysis` |

Leave all four unset to run in demo mode (mocked pipeline output, no Lamatic account required).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (also type-checks)
- `npm run lint` — ESLint
- `npm test` — runs `lib/deadline-urgency.test.ts` via Node's built-in test runner

## Structure

- `app/page.tsx` — the entire UI (input form, loading pipeline, results)
- `actions/orchestrate.ts` — server action; calls the live Lamatic flow or falls back to demo mode
- `lib/lamatic-client.ts` — Lamatic SDK client + config check
- `lib/demo-data.ts` — 3 example scenarios and their mocked structured output
- `lib/deadline-urgency.ts` — pure date-math function, unit-tested
- `lib/types.ts` — shared result types
