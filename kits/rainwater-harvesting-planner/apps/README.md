# Rainwater Harvesting Planner — app

Next.js app for the `rainwater-harvesting-planner` AgentKit kit. See the [kit README](../README.md) for the full setup.

```bash
cp .env.example .env.local   # add Lamatic credentials + RAINWATER_PLAN_FLOW_ID
npm install
npm run dev                  # http://localhost:3000
npm test                     # calculation unit tests (Node 22+)
```

- `actions/orchestrate.ts` — server action: geocode → 5-year rainfall → calculations → Lamatic flow.
- `lib/calc.ts` — deterministic harvest, demand and tank-sizing maths.
- `lib/rainfall.ts` — Open-Meteo geocoding and historical rainfall.
- `lib/lamatic-client.ts` — minimal GraphQL `executeWorkflow` client.
