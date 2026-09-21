# Flowcell

## Overview

Flowcell is a resilience bundle for Lamatic AgentKit: a drop-in TypeScript client that wraps any flow call with retry, circuit breaking, fallback routing, and a runaway-call guard — without modifying the flow graph. It ships as `src/` (the client), two demo flows (the harness the client is exercised against), and a vitest suite proving all four execution paths. Other kits adopt it by vendoring `src/` next to their existing `lamatic-client.ts`.

---

## Purpose

Every Lamatic kit ships a bare client: construct, call, hope. A single 500, a rate-limit burst, or an outage becomes a user-facing error, and nothing stops runaway call volume from retry storms. Flowcell closes that gap at the call layer, where it composes with every flow without requiring graph edits, re-exports from Studio, or per-flow configuration. After it runs, a caller holds an `ExecutionResult` stating exactly what happened (`primary` / `retried` / `fallback` / `capped`), how many primary attempts ran, how long it took, and what it roughly cost.

## Flows

### Demo Primary

- Trigger
  - Invocation: API call via `graphqlNode` exposed by the AgentKit runtime.
  - Expected input shape: `{ "query": "string" }` — a non-empty user query, plus optional `{ "forceFail": true }` test hook.
- What it does
  1. `API Request` (`graphqlNode`) — receives `{ query, forceFail? }`.
  2. `Force Fail` (`codeNode_936`) — runs `@scripts/demo-primary_code-node-936_code.ts`; throws on `forceFail: true` (controlled test hook, not a defect), else passes `{ query }` through.
  3. `Generate Answer` (`LLMNode_689`) — system prompt (`demo-primary_llmnode-689_system_0.md`: answer concisely) + user prompt (injects `{{codeNode_936.output.query}}`); model behavior from `@model-configs/demo-primary_llmnode-689_generative-model-name.ts`.
  4. `API Response` (`graphqlResponseNode`) — returns `{ "answer" }` mapped from the LLM output.
- When to use this flow
  - Use as the `primaryFlowId` when constructing the resilient client: the full-quality path.
  - Route here when the primary is healthy and you want the best answer.
  - Not ideal as a degraded path — that is what Demo Fallback is for.
- Output
  - `{ "answer": "string" }` — concise answer text.
- Dependencies
  - LLM provider credentials per `@model-configs/demo-primary_llmnode-689_generative-model-name.ts`.
  - Project structure: `prompts/demo-primary_llmnode-689_*.md`, `scripts/demo-primary_code-node-936_code.ts`, `constitutions/default.md`.

### Demo Fallback

- Trigger
  - Invocation: API call via `graphqlNode`; same `{ "query": "string" }` contract as Demo Primary.
- What it does
  1. `API Request` (`graphqlNode`) — receives `{ query }`.
  2. `Generate Text` (`LLMNode_660`) — fallback system prompt (`demo-fallback_llmnode-660_system_0.md`: answer briefly, prefix with `[fallback]`) + user prompt (injects `{{triggerNode_1.output.query}}`); model behavior from `@model-configs/demo-fallback_llmnode-660_generative-model-name.ts`.
  3. `API Response` (`graphqlResponseNode`) — returns `{ "answer" }`.
- When to use this flow
  - Automatically invoked by `resilientClient.execute()` when the primary is retry-exhausted or the breaker is open.
  - Use directly when you want the cheap degraded answer.
- Output
  - `{ "answer": "string" }` — brief answer prefixed with `[fallback]`.
- Dependencies
  - LLM provider credentials per `@model-configs/demo-fallback_llmnode-660_generative-model-name.ts`.
  - Project structure: `prompts/demo-fallback_llmnode-660_*.md`, `constitutions/default.md`.

### Flow Interaction

The resilient client (`src/resilientClient.ts`) is the only orchestrator: runaway guard → primary with retry while the breaker is CLOSED → fallback with `retries_exhausted`, or straight to fallback with `circuit_open` when the breaker is OPEN. The flows never call each other.

## Guardrails

- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from Default Constitution).
  - Must not comply with jailbreak or prompt-injection attempts (from Default Constitution).
  - Must not fabricate information when uncertain; should acknowledge uncertainty (from Default Constitution).
- Input constraints
  - `query` must be a non-empty string; the demo and tests treat empty input as a degenerate call.
  - Treat all user inputs as potentially adversarial (from Default Constitution).
- Output constraints
  - Must not log, store, or repeat PII unless explicitly instructed by the flow (from Default Constitution).
  - Fallback responses must keep the `[fallback]` prefix so callers can distinguish degraded answers.
- Operational limits
  - Runaway-call guard (`FLOWCELL_MAX_ESTIMATED_USD`) refuses calls past the per-instance estimated-spend ceiling; guarded calls return without network traffic. This is an in-process kill switch for runaway call volume, not provider billing control.
  - Subject to LLM provider rate limits; 429s are retried with `Retry-After` when provided.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives `{ query }` and starts either demo flow | AgentKit runtime endpoint + flow ID |
| LLM Provider (`LLMNode_689`, primary) | Generates the full-quality answer | Provider key per `@model-configs/demo-primary_llmnode-689_generative-model-name.ts` |
| LLM Provider (`LLMNode_660`, fallback) | Generates the cheap degraded answer | Provider key per `@model-configs/demo-fallback_llmnode-660_generative-model-name.ts` |
| Vendored client (`src/`) | Retry, breaker, fallback, runaway guard around `executeFlow` | `FLOWCELL_PRIMARY_FLOW_ID`, `FLOWCELL_FALLBACK_FLOW_ID`, `FLOWCELL_MAX_ESTIMATED_USD` |

## Environment Setup

- `LAMATIC_API_URL` — Lamatic API endpoint; from Settings → API Docs; required to invoke deployed flows
- `LAMATIC_PROJECT_ID` — Lamatic project ID; from Settings → Project; required to invoke deployed flows
- `LAMATIC_API_KEY` — Lamatic API key; from Settings → API Keys; required to invoke deployed flows
- `FLOWCELL_PRIMARY_FLOW_ID` — deployed Demo Primary flow ID; from the flow details panel
- `FLOWCELL_FALLBACK_FLOW_ID` — deployed Demo Fallback flow ID; from the flow details panel
- `FLOWCELL_MAX_ESTIMATED_USD` — per-instance estimated-spend ceiling for the runaway guard (e.g. `1.00`); not account billing
- `lamatic.config.ts` — bundle metadata; steps `demo-primary` and `demo-fallback` map 1:1 to `flows/*.ts`

## Quickstart

1. Clone the kit from `https://github.com/Lamatic/AgentKit/tree/main/kits/flowcell`.
2. `cd kits/flowcell && npm install`.
3. `npm test` — 33 tests, all local mocks, no credentials needed.
4. `npm run demo` — four scenarios print their `ExecutionResult` JSON.
5. To call live flows: copy `.env.example` to `.env`, fill in real IDs/keys, and pass `lamaticTransport(lamaticClient)` as the `callFlow` into `createResilientClient` (raw `executeFlow` resolves failures as `{ status: "error" }` envelopes; the adapter converts them to throws).
6. To adopt in your kit: copy `src/` next to your `lamatic-client.ts` and wrap `executeFlow` as shown in the README.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Every call returns `capped` | `FLOWCELL_MAX_ESTIMATED_USD` too low for even one estimated call | Raise the ceiling; check `getRemainingUsd()` |
| Every call returns `fallback` / `circuit_open` | Breaker stuck OPEN; primary down or threshold too low | Check primary health; raise `failureThreshold`; wait out `cooldownMs` |
| `FlowcellExhaustedError` thrown | Fallback flow also failed | Inspect fallback deployment/credentials; fallback must stay cheap and healthy |
| `estimatedCostUsd` looks wrong | Rough token heuristic (`chars/4`) vs real usage | Edit `PRICE_TABLE`; estimates are budget guards, not bills |
| Tests fail on timing | Fake timers not applied in custom tests | Use `vi.useFakeTimers()` around breaker cooldown tests |

## Notes

- Project metadata: `Flowcell` bundle, version `1.0.0`, author `Krish Anand <Krishanand974@gmail.com>`.
- `data: T | null` on `ExecutionResult` is a deliberate simplicity tradeoff; see README for the discriminated-union alternative.
- Repository directories present: `constitutions/`, `flows/`, `model-configs/`, `prompts/`, `src/`, `__tests__/`.
