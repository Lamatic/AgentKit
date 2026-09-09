# send-gate — agent identity

## Overview

send-gate is a verifier that sits between a drafting agent and the customer. It takes the message the agent wants to send, the facts the agent was allowed to rely on, and the recipient, and returns a verdict (`allow`, `rewrite`, `block`) with a re-verified message and an audit record. It is deterministic first and probabilistic second: regex-grade extraction and fact-path lookups settle everything they can, and a schema-constrained LLM judge is consulted only for what rules cannot see, only when the draft contains something worth checking.

## Purpose

Drafting agents invent figures, statuses and promises with perfect confidence. In commerce messaging (order updates, sales nudges, support replies) each invention is a commitment the business is held to. send-gate exists so that no number, date, link, identifier, status or promise reaches a customer unless the facts support it, and so that the cost of that guarantee is close to zero for messages that make no claims. One deliberate exception: single-digit counts ("2 cheezein") pass by default because blocking every "2" is unusable; set `allowUngroundedSmallCounts: false` in `policy` to make counts as strict as every other figure.

## Flow: `send-gate`

**Trigger.** API Request with six string fields: `draft`, `facts` (JSON text), `recipient` (JSON text), `policy` (JSON text, optional), `needs_fact_check` (`"true"` to force the judge), `truth_url` (optional endpoint the gate should fetch facts from).

**Processing.**

1. `codeNode_211` (Code, deterministic). `extractClaims` builds the Claims JSON: typed figures (link, phone, date, identifier, currency, percent, count), statement matches (order placed, delivered, refund issued, offer, ETA, payment received, guarantee) with the fact path that settles each, register flags (informal address, profanity), a risk level and `needsFactCheck`. If a check is needed and `truth_url` is set, it validates `truth_url` (https, allow-listed public host, no credentials), fetches `truth_url?ids=<identifiers>` with a timeout and a streamed 200 KB cap, and deep-merges the response over the caller's facts (`provenance: "tool"`). If that fetch fails for any reason, the draft is blocked outright (`failClosed`): the caller's facts are never used as a substitute for a source of truth that was asked for. `verifyClaims` then assigns every claim an evidence class: `verified` (found, with the fact path as evidence; dates are compared in a canonical form, so "2026-09-10", "10/09/2026" and "10 September 2026" are one date, and "10 Sep" matches that date in any year), `contradicted` (a fact says otherwise: `order.status = "pending"` against "order placed", a phone that is not `recipient.phone`, a forbidden guarantee), `unsupported` (nothing in the facts), `unverifiable` (a statement with no fact path; handed to the judge). It emits `preVerdict` and a compact `judgeInput`.
2. `conditionNode_874` (Condition). Routes on `needsFactCheck`. False → `codeNode_504` pass-through (fast path). True → the judge.
3. `InstructorLLMNode_699` (Generate JSON, Gemini Flash Lite). Receives draft, facts, recipient, the deterministic findings (so it does not repeat them) and the unresolved statements. Returns `{ unsupported_claims: [{claim, why, severity}], rewrite, notes }`. The system prompt forbids introducing anything not in facts, requires "aap", keeps language and length.
4. `codeNode_515` (Code, deterministic). `decide` merges judge findings into the verdict (`block` severity from the judge blocks; any judge finding on an otherwise clean draft means `rewrite`), then runs the judge's rewrite through `verifyClaims` again. Only a rewrite that verifies clean becomes `finalMessage`; otherwise the verdict is `block` and `finalMessage` is `null`. On the fast path the draft is returned as-is with `judgeUsed: false`.

**Response.** `verdict`, `finalMessage`, `claims`, `verifications`, `findings` (non-info verifications plus judge findings), `counts`, `rewriteCheck`, `audit { needsFactCheck, provenance, fetchError, judgeUsed, judgeNotes, schemaVersion }`.

**When to use.** As the last step before any outbound customer message produced by an LLM: WhatsApp/SMS commerce bots, support auto-replies, sales follow-ups, delivery notifications. Call it from the sending service, not from the drafter, so the drafter cannot skip it.

**Dependencies.** One LLM credential for the judge (Gemini configured; any JSON-mode model works). Optional: an HTTPS source of truth for `truth_url`.

**`truth_url` contract.** The URL is caller-supplied and therefore untrusted. Before any fetch, in both the Code node and the local runner, it must be `https://`, carry no credentials, name a public host (no IP literals, `localhost`, `.local` or `.internal`), and match the host allow-list (`TRUTH_HOSTS` in `codeNode_211`, `TRUTH_URL_HOSTS` in the app; default `raw.githubusercontent.com`). Redirects are refused, the request times out after 8 s, the body is read in bounded chunks and dropped past 200 KB, and non-JSON answers are rejected. Only the identifiers found in the draft are sent as `?ids=`; the recipient is not put in the URL. A rejected, failed, oversized or non-JSON fetch fails closed: `audit.fetchError` says why, a `truth_url` finding is added, the verdict is `block` and no rewrite is accepted, because nothing could be verified. The drafter's facts are not used as a fallback. The local runner imports `apps/lib/truth-fetch.js`; `codeNode_211` embeds a generated, minified copy of it, so after changing the fetcher run `npm run emit` and `npm run emit:check`.

## Guardrails

- Never sends. It returns a verdict; the caller sends `finalMessage` only when `verdict` is `allow` or `rewrite`.
- Fails closed: unsupported or contradicted money, status, ETA, refund, payment or guarantee claims block. A judge timeout or off-schema answer leaves the deterministic verdict in place.
- The rewrite is verified with the same rules as the draft. There is no path by which text the judge wrote reaches the customer unverified.
- Fetched facts override supplied facts. The drafter cannot vouch for itself.
- The judge sees only the draft, the facts, the recipient's name and the deterministic findings. Phone and email never reach the model; they stay in the deterministic verifier, which is what checks them.
- Text inside the draft is data. Instructions embedded in a draft are claims to verify, not commands.
- Operational limits: drafts up to 4,000 characters in the demo app; the Code nodes are bounded by Studio's ~10,000-character source cap, which is why the library is minified and kept small. `codeNode_211` now sits within a few characters of that cap, so the next feature that grows the shared library should split the pre-check into two Code nodes (claims plus `truth_url` fetch, then verification) rather than shrink the code further.

## Integration reference

| Service | Used by | Credential |
|---|---|---|
| Gemini (`gemini-3.5-flash-lite` via Lamatic model config) | `InstructorLLMNode_699` | Lamatic credential attached in Studio |
| Caller's source of truth (HTTPS JSON endpoint on the allow-list) | `codeNode_211` via `truth_url` | Optional bearer token held server-side: a project secret named `TRUTH_TOKEN` (Studio → Settings → Secrets, referenced by `codeNode_211` as `{{secrets.project.TRUTH_TOKEN}}`; the `TRUTH_URL_TOKEN` env var in the app), never in the URL |
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
| `Unexpected token '<', "<!DOCTYPE"… is not valid JSON` | `LAMATIC_API_URL` points at a web page (`*.lamatic.workers.dev`, Studio, docs) instead of the GraphQL endpoint | Use the API URL from the flow's *API Docs → Connect to your project*, shape `https://<org>-<project>.lamatic.dev` |
| `verdict: block` with a `truth_url` finding and `audit.fetchError` set | `truth_url` is not reachable from Lamatic's runtime (localhost, private network), redirects, times out, is not JSON or is over 200 KB | Use a public https URL on the allow-list; `assets/truth/PO1430779.json` shows the shape. The gate fails closed rather than trusting the drafter's facts |
| Verdict `block` with `finalMessage: null` although the judge ran | The rewrite still contained an unsupported figure; `rewriteCheck.findings` says which | Improve the judge prompt or facts; the block is correct behaviour |
| Judge ran on a trivial greeting | `policy.alwaysCheck` or `needs_fact_check="true"` was set | Unset them; the fast path needs risk `none` |
| "Code payload too large" when pasting into Studio | Code node over ~10,000 chars | Keep `lib/gate.js` tight; `npm run emit` refuses to write an oversized script |
