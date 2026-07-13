# FlowGuard app

Next.js 14 (App Router) dashboard that orchestrates FlowGuard's flows via the Lamatic SDK.

```bash
npm install
cp .env.example .env.local   # fill in Lamatic creds + FLOW_ID_* values
npm run dev                  # http://localhost:3000
npm run type-check
npm test                     # verdict/diff unit tests, no API key required
```

- `actions/orchestrate.ts` — server-action state machine (generate → execute → judge → aggregate → report).
- `lib/lamatic-client.ts` — SDK client + typed flow wrappers + target-flow executor.
- `lib/pool.ts` — bounded concurrency, per-case timeout, retry, isolation.
- `lib/verdict.ts` — pure verdict + regression-diff math (unit-tested).
- `lib/cache.ts`, `lib/store.ts` — content-hash cache + in-memory run store.
- `types/index.ts` — Zod schemas: the single source of truth for every contract.

See the kit [`README.md`](../README.md) for the full quickstart and how to build the flows.
