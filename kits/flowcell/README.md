# Flowcell

Every Lamatic kit assumes the API call succeeds. trigger → LLM node → response, no retry, no fallback, no guard against runaway call volume. Flowcell is a drop-in TypeScript client that replaces the bare `lamatic-client.ts` every kit already ships, adding retry, circuit breaking, fallback routing, and a runaway-call guard around any flow call — without touching the flow graph itself. Distinct from correctness-testing tools (which judge output quality), Flowcell handles call-level failure and cost: it is a vendored runtime client other kits copy in, demonstrated here against two demo flows, not a test-suite you run cases against.

## How it works

```
input → runaway guard → [breaker CLOSED] → primary (+ retries) → result
                           ↓ OPEN              ↓ exhausted
                        fallback (circuit_open)  fallback (retries_exhausted)
```

`resilientClient.execute()` wraps any flow call in three concerns:

1. **Runaway guard** — an estimated-cost check runs before the primary is ever touched. Calls that would push the instance past its configured ceiling return `{ path: "capped", attempts: 0 }` with zero network traffic.
2. **Retry + circuit breaker** — transient failures retry with exponential backoff, jitter, and `Retry-After` support. Repeated failures trip the breaker; while OPEN, the primary is not called at all.
3. **Fallback routing** — when the primary can't serve, a cheaper fallback flow answers instead, with the reason recorded (`retries_exhausted` vs `circuit_open` — different stories, surfaced separately).

## Retry classification

Classify on **transport/HTTP status first**:

| Retryable | Not retryable |
|---|---|
| 408, 429, 500, 502, 503, 504 | 400, 401, 403, 404, 422 |
| `timeout`, `ECONNRESET`, `fetch failed` | malformed JSON on a 200, schema failure, bad config, budget exceeded |

Key rule: if a 502 has a malformed body, it's still a 502 — retryable. Malformed JSON is only a non-retryable reason when the HTTP layer itself succeeded (200 with a garbage payload). Retrying a 200-with-bad-JSON just pays for the same bad answer again.

Backoff: `baseDelayMs * 2^(attempt-1)`, jittered to `[0.5x, 1.0x]`, raised to `Retry-After` when larger, capped at `maxDelayMs`. `Retry-After` is parsed from the response header when Lamatic or the upstream provider returns one on a 429.

## Circuit breaker

Three states, no ambiguity:

```
CLOSED --failures >= threshold--> OPEN
OPEN --cooldown elapsed--> HALF_OPEN
HALF_OPEN --probe succeeds--> CLOSED
HALF_OPEN --probe fails--> OPEN
```

- **CLOSED** — normal. Requests go to primary; failures increment the counter.
- **OPEN** — primary is not called at all. Requests go straight to fallback with `reason: "circuit_open"`.
- **HALF_OPEN** — exactly one probe request is admitted to primary. Success resets to CLOSED; failure returns to OPEN and restarts cooldown.

## Cost tracking: a runaway-call guard, not billing control

`estimatedCostUsd` is `estimatedInputTokens × inputPrice + estimatedOutputTokens × outputPrice` against a static price table (`src/priceTable.ts`) — an execution-budget estimate, not an accounting-grade billing figure. Token counts are rough (`~4 chars/token`), prices are editable constants, and per-attempt costs accumulate across retries plus the fallback call.

Be precise about what the guard is: your provider bills your API key directly, and nothing in Flowcell sits between your key and their billing. It cannot stop intentional high usage, it does not coordinate across client instances, and provider-side spend alerts typically arrive hours late. What it does is narrower and entirely in-process: retries multiply cost exactly when success is least likely, so the guard refuses the *next* call before any request goes out — a kill switch for orchestration bugs and runaway call volume within a single client instance, in the same category as the retry and breaker logic rather than as a billing product.

## Demo (no credentials needed)

```bash
cd kits/flowcell
npm install
npm test     # 33 tests: breaker table, retry table, transport adapter, end-to-end scenarios
npm run demo # 4 terminal outputs, each proving one mechanism
```

1. **Retry recovers** — primary returns 500 twice, then 200 → `{ path: "retried", attempts: 3 }`.
2. **Circuit open** — failures past threshold flip the breaker to OPEN; next call → `{ path: "fallback", fallback: { reason: "circuit_open" }, attempts: 0 }` (primary untouched).
3. **Retries exhausted** — fresh breaker, exactly `maxAttempts` primary failures in one call → `{ path: "fallback", fallback: { reason: "retries_exhausted" } }`.
4. **Runaway guard** — tiny `maxEstimatedUsd` → `{ path: "capped", attempts: 0 }` before any network call.

Live hook: once the flows are deployed, send `{ "query": "...", "forceFail": true }` to Demo Primary to force a real failure through the `Code` node (`scripts/demo-primary_code-node-936_code.ts`) and watch the client retry, trip the breaker, and fall back against live endpoints.

## Use in your kit (vendored drop-in)

```typescript
import { createResilientClient } from "./resilientClient.js";
import { lamaticTransport } from "./lamaticTransport.js";
import { lamaticClient } from "./lamatic-client.js"; // your existing client

const client = createResilientClient(
  {
    primaryFlowId: process.env.MY_FLOW_ID!,
    fallbackFlowId: process.env.MY_FALLBACK_FLOW_ID!,
    retry: { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 5000, jitter: true, respectRetryAfter: true },
    failureThreshold: 5,
    cooldownMs: 30_000,
    runawayGuard: { maxEstimatedUsd: 1.0 },
  },
  lamaticTransport(lamaticClient),
);

const result = await client.execute({ query: "..." });
if (result.path === "capped") { /* refuse gracefully */ }
```

Copy `src/` into your kit next to its `lamatic-client.ts`. There is no cross-kit npm import — the repo is flat with per-kit dependencies, so vendoring is the integration pattern. Always wrap the SDK with `lamaticTransport`: raw `executeFlow` resolves flow failures as `{ status: "error", ... }` envelopes instead of rejecting, which would hide failures from the breaker. The adapter converts error envelopes into thrown errors (with `statusCode` as `httpStatus`) and unwraps the `result` payload on success.

## Environment

| Var | Purpose |
|---|---|
| `LAMATIC_API_URL` / `LAMATIC_PROJECT_ID` / `LAMATIC_API_KEY` | Lamatic project credentials |
| `FLOWCELL_PRIMARY_FLOW_ID` | Primary flow to call first |
| `FLOWCELL_FALLBACK_FLOW_ID` | Cheap fallback flow |
| `FLOWCELL_MAX_ESTIMATED_USD` | Per-instance estimated-spend ceiling for the runaway guard (not account billing) |

See `.env.example`. Never commit `.env` / `.env.local`.

## Non-goals

Flowcell is one client, one primary flow, one fallback flow, and three concerns: retry, breaker, runaway-call guard. Deliberately not included: a dashboard, Prometheus/Grafana, Redis-backed distributed state, multi-region failover, N-way fallback chains, or a tracing platform. Those solve a different problem at a different scale than a challenge submission needs, and adding them would trade a working, testable client for an unfinished platform.

## Tradeoffs & future work

- `ExecutionResult.data` is typed `T | null` so the capped path can return without a network call. That means callers null-check even on success paths; a discriminated union (`{ path: "capped"; data: null } | { path: ...; data: T }`) would remove that tax at the cost of complexity — the right call if this ever grows beyond a challenge submission.
- The `@prompts/...` / `@model-configs/...` / `@scripts/...` references in `flows/` follow the repo's documented convention (verified against `article-summariser` and `knowledge-chatbot` exports); confirm Studio resolves them the same way once the flows are opened in Studio.
- The `Force Fail` code node assumes a thrown `Error` fails the node and the flow run; confirm this throw-propagates in Studio before recording the live walkthrough.

## Files

- `src/resilientClient.ts` — `createResilientClient().execute()` orchestrator
- `src/lamaticTransport.ts` — SDK adapter: error envelopes → throws, success → unwrapped `result`
- `src/circuitBreaker.ts`, `src/retryPolicy.ts`, `src/costTracker.ts`, `src/priceTable.ts`, `src/types.ts`
- `flows/demo-primary.ts`, `flows/demo-fallback.ts` — demo flow contracts with `@references`
- `__tests__/` — breaker, retry, and end-to-end client tests
