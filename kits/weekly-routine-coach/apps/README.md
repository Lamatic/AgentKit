# Weekly Routine Coach — App

Next.js 16 + React 19 + Tailwind v4 + shadcn/ui front-end for the Weekly Routine Coach kit.

See the [kit README](../README.md) and [`agent.md`](../agent.md) at the kit root for the full picture (problem statement, flow design, platform quirks).

## Run locally

```bash
cp .env.example .env.local
# fill in the 6 env vars (see ../README.md → Setup)
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000.

## Architecture

- `app/page.tsx` — single-page state machine: `intake` (chat) → `generating` (loader) → `week` (grid) → `replanning` (slip dialog).
- `actions/orchestrate.ts` — three typed server actions (`callIntake`, `callGenerateWeek`, `callReplan`) wrapping the Lamatic flows with input serialization and output `unwrap()`.
- `lib/lamatic-client.ts` — minimal GraphQL `fetch` client that calls Lamatic's `executeWorkflow` mutation. Includes the `unwrap()` helper that strips the `$` prefix Lamatic leaves on substituted values and `JSON.parse()`-es obj/arr fields that round-trip as strings.

## Environment variables

| Var | Source |
|---|---|
| `LAMATIC_API_URL` | Studio → Settings → API Keys → Connect dialog → API URL |
| `LAMATIC_PROJECT_ID` | Same dialog → Project ID |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `INTAKE_FLOW_ID` | Studio → `intake` flow → Details → Flow ID |
| `GENERATE_WEEK_FLOW_ID` | Studio → `generate-week` flow → Details → Flow ID |
| `REPLAN_FLOW_ID` | Studio → `replan` flow → Details → Flow ID |

## Notes

- `--legacy-peer-deps` is needed because `vaul` (shadcn's Drawer dependency) declares React 16–18 as peer; we run on React 19. Runtime behavior is identical.
- `tsconfig.json` must include `"paths": { "@/*": ["./*"] }` for the `@/components/...` imports. Already configured.
- `postcss.config.mjs` is required for Tailwind v4 (which uses `@tailwindcss/postcss` instead of the legacy `tailwindcss` plugin).
