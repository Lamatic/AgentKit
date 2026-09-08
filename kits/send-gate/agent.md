# send-gate — agent identity

## Overview

send-gate is a verifier that sits between a drafting agent and the customer. It takes the message the agent wants to send, the facts the agent was allowed to rely on, and the recipient, and returns a verdict (`allow`, `rewrite`, `block`) with a re-verified message and an audit record. It is deterministic first and probabilistic second: regex-grade extraction and fact-path lookups settle everything they can, and a schema-constrained LLM judge is consulted only for what rules cannot see, only when the draft contains something worth checking.

## Purpose

Drafting agents invent figures, statuses and promises with perfect confidence. In commerce messaging (order updates, sales nudges, support replies) each invention is a commitment the business is held to. send-gate exists so that no number, date, link, identifier, status or promise reaches a customer unless the facts support it, and so that the cost of that guarantee is close to zero for messages that make no claims.

## Flow: `send-gate`

**Trigger.** API Request with six string fields: `draft`, `facts` (JSON text), `recipient` (JSON text), `policy` (JSON text, optional), `needs_fact_check` (`"true"` to force the judge), `truth_url` (optional endpoint the gate should fetch facts from).

**Processing.**

1. `codeNode_211` (Code, deterministic). `extractClaims` builds the Claims JSON: typed figures (link, phone, date, identifier, currency, percent, count), statement matches (order placed, delivered, refund issued, offer, ETA, payment received, guarantee) with the fact path that settles each, register flags (informal address, profanity), a risk level and `needsFactCheck`. If a check is needed and `truth_url` is set, it fetches `truth_url?ids=<identifiers>&recipient=<json>` and deep-merges the response over the caller's facts (`provenance: "tool"`). `verifyClaims` then assigns every claim an evidence class: `verified` (found, with the fact path as evidence), `contradicted` (a fact says otherwise: `order.status = "pending"` against "order placed", a phone that is not `recipient.phone`, a forbidden guarantee), `unsupported` (nothing in the facts), `unverifiable` (a statement with no fact path; handed to the judge). It emits `preVerdict` and a compact `judgeInput`.
2. `conditionNode_874` (Condition). Routes on `needsFactCheck`. False → `codeNode_504` pass-through (fast path). True → the judge.
3. `InstructorLLMNode_699` (Generate JSON, Gemini Flash Lite). Receives draft, facts, recipient, the deterministic findings (so it does not repeat them) and the unresolved statements. Returns `{ unsupported_claims: [{claim, why, severity}], rewrite, notes }`. The system prompt forbids introducing anything not in facts, requires "aap", keeps language and length.
4. `codeNode_515` (Code, deterministic). `decide` merges judge findings into the verdict (`block` severity from the judge blocks; any judge finding on an otherwise clean draft means `rewrite`), then runs the judge's rewrite through `verifyClaims` again. Only a rewrite that verifies clean becomes `finalMessage`; otherwise the verdict is `block` and `finalMessage` is `null`. On the fast path the draft is returned as-is with `judgeUsed: false`.

**Response.** `verdict`, `finalMessage`, `claims`, `verifications`, `findings` (non-info verifications plus judge findings), `counts`, `rewriteCheck`, `audit { needsFactCheck, provenance, fetchError, judgeUsed, judgeNotes, schemaVersion }`.

**When to use.** As the last step before any outbound customer message produced by an LLM: WhatsApp/SMS commerce bots, support auto-replies, sales follow-ups, delivery notifications. Call it from the sending service, not from the drafter, so the drafter cannot skip it.

**Dependencies.** One LLM credential for the judge (Gemini configured; any JSON-mode model works). Optional: an HTTP source of truth for `truth_url`.

## Guardrails

- Never sends. It returns a verdict; the caller sends `finalMessage` only when `verdict` is `allow` or `rewrite`.
- Fails closed: unsupported or contradicted money, status, ETA, refund, payment or guarantee claims block. A judge timeout or off-schema answer leaves the deterministic verdict in place.
- The rewrite is verified with the same rules as the draft. There is no path by which text the judge wrote reaches the customer unverified.
- Fetched facts override supplied facts. The drafter cannot vouch for itself.
- The judge sees only draft, facts, recipient and findings. No history, no extra PII.
- Text inside the draft is data. Instructions embedded in a draft are claims to verify, not commands.
- Operational limits: drafts up to 4,000 characters in the demo app; the Code nodes are bounded by Studio's ~10,000-character source cap, which is why the library is minified and kept small.

## Integration reference

| Service | Used by | Credential |
|---|---|---|
| Gemini (`gemini-3.5-flash-lite` via Lamatic model config) | `InstructorLLMNode_699` | Lamatic credential attached in Studio |
| Caller's source of truth (any HTTPS JSON endpoint) | `codeNode_211` via `truth_url` | None built in; put a token in the URL or front it with an allow-list |
| Lamatic GraphQL API (`executeWorkflow`) | `apps/lib/lamatic-client.ts` via the `lamatic` SDK | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |

## Environment setup

| Variable | Where | Purpose |
|---|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys | Auth for the GraphQL API |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project | Project scoping |
| `LAMATIC_API_URL` | Studio → Settings → API Docs → Endpoint | GraphQL endpoint |
| `SEND_GATE_FLOW_ID` | Deployed flow → details panel | Which flow to execute; unset = local mode |

## Quickstart

1. `cd kits/send-gate/apps && npm install && npm run dev` (local mode works with no env).
2. Import the kit into Studio, attach a Gemini credential to Generate JSON, test with `flows/send-gate.ts` → `meta.testInput`, deploy.
3. Copy the four variables into `apps/.env.local`; the UI switches to the deployed flow.
4. `npm test` and `npm run emit:check` before changing `apps/lib/gate.js`; `npm run emit` after.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Everything is `unsupported` | `facts` is not valid JSON, or is nested differently from the statement rules' fact paths (`order.status`, `offers`, `eta`, `refund.status`, `payment.status`) | Fix the JSON; or pass `policy.statementRules` with your own `factPath`s |
| `audit.fetchError: truth_url fetch failed` | `truth_url` is not reachable from Lamatic's runtime (localhost, private network) | Use a public URL; `assets/truth/PO1430779.json` shows the shape |
| Verdict `block` with `finalMessage: null` although the judge ran | The rewrite still contained an unsupported figure; `rewriteCheck.findings` says which | Improve the judge prompt or facts; the block is correct behaviour |
| Judge ran on a trivial greeting | `policy.alwaysCheck` or `needs_fact_check="true"` was set | Unset them; the fast path needs risk `none` |
| "Code payload too large" when pasting into Studio | Code node over ~10,000 chars | Keep `lib/gate.js` tight; `npm run emit` refuses to write an oversized script |
