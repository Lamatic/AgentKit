# Claim Appeal Writer

## Overview

Claim Appeal Writer turns an insurance claim denial into a fightable, cited appeal. Given the text of a denial letter and the policyholder's own policy document, it extracts the facts that matter (what was denied, why, under which plan type, by when it must be appealed), retrieves the policy clauses that actually govern the claim, looks up the appeal rules for the member's state and plan type, and drafts a formal appeal letter that quotes the policy back at the insurer — together with an evidence checklist, a deadline, and an escalation path.

It is a **three-flow** AgentKit kit: `index-policy` (RAG ingestion), `analyze-denial` (schema-constrained extraction), and `draft-appeal` (retrieval + web grounding + synthesis). A Next.js app wraps them in a three-step wizard with a human confirmation step between extraction and drafting.

Scope of v1: **US health insurance denials** (employer/ERISA, ACA marketplace, Medicare, Medicaid, individual). Other insurance lines and jurisdictions are extension points, not implemented.

---

## Purpose

Most denied claims are never appealed, yet a large share of appeals succeed. The barrier is not the right to appeal — it is the work: reading a denial letter, cross-referencing a 100-page policy, knowing the procedural rules, and writing a formal letter that cites all three. This system collapses that work into one guided interaction while keeping the policyholder in control (they confirm the extracted facts before anything is drafted and review the letter before sending).

The system is built around a hard **no-fabrication** rule. Every policy citation must trace to an excerpt retrieved from the user's indexed policy; every regulatory reference must trace to a retrieved web source. When the policy does not support a rebuttal, the letter says so and formally requests that the insurer identify the provision it relied upon, the claim file, and the clinical criteria used — a legitimate and effective appeal tactic in its own right.

## Flows

### `1. Claim Appeal Writer - Index Policy`

- **Flow ID / Env key:** `index-policy` → `CLAIM_APPEAL_INDEX_POLICY`

#### Trigger

API request. Input: `policyText` (string, full text of the policy), `policyId` (string, caller-generated), `policyTitle` (string, optional).

#### What it does

1. `API Request` — receives the payload.
2. `Chunking` — recursive character splitter, 800 chars / 100 overlap, splitting on paragraph, line and sentence boundaries so numbered clauses stay intact.
3. `Prepare Chunks` (code) — flattens to a string array.
4. `Vectorize` — embeds each chunk.
5. `Transform Metadata` (code) — attaches `{ content, policyId, title, source, chunkIndex }` to each vector.
6. `Index` — writes to the project's managed vector DB; primary key `source` = `<policyId>#chunk-<n>`; duplicates overwrite, so re-indexing a policy is idempotent.
7. `API Response` — `{ policyId, chunks, status }`.

#### Output

`policyId`, `chunks` (count), `status`.

#### Dependencies

Embedding model and vector DB selected in Studio. No upstream flow.

---

### `2. Claim Appeal Writer - Analyze Denial`

- **Flow ID / Env key:** `analyze-denial` → `CLAIM_APPEAL_ANALYZE_DENIAL`

#### Trigger

API request. Input: `denialText` (string).

#### What it does

1. `API Request`.
2. `Extract Denial Facts` (Generate JSON, schema-constrained) — extracts insurer, claim/member numbers, dates, service denied, amount in dispute, each denial reason with its code and a category (`medical-necessity`, `prior-authorization`, `out-of-network`, `not-covered`, `experimental-investigational`, `coding-error`, `timely-filing`, `eligibility`, `other`), the verbatim appeal window stated in the letter, the appeals address, the plan type, a confidence grade, a `missingInfo` list of things a human must verify, and a two-sentence plain-English summary.
3. `API Response` — `{ denialFacts }`.

#### Output

`denialFacts` object. The `category` per reason is the routing signal for how the drafter argues; `missingInfo` drives the app's confirmation step.

#### Dependencies

A chat model. No upstream flow.

---

### `3. Claim Appeal Writer - Draft Appeal`

- **Flow ID / Env key:** `draft-appeal` → `CLAIM_APPEAL_DRAFT_APPEAL`

#### Trigger

API request. Input: `denialFacts` (object, from flow 2, optionally edited by the user), `policyId` (string, as used in flow 1), `state` (string, US state), `patientContext` (string, optional free text).

#### What it does

1. `API Request`.
2. `Build Queries` (code) — derives one retrieval query (service + stated reasons + category-specific policy vocabulary such as "retroactive authorization" or "network adequacy") and one web query (state + plan type + appeal/external-review rights + insurer).
3. `Vector Search` — top-20 semantic search over the policy index.
4. `Web Search` — top-5 Serper results for the regulatory query.
5. `Format Context` (code) — scopes results to `policyId`, keeps the top 8, labels each `(Policy excerpt n, chunk k)`, formats web sources with title + URL.
6. `Draft Letter` (Generate Text) — writes the appeal under a strict system prompt: one section per denial reason, verbatim short quotes with the supplied labels only, category-specific argument patterns, an appeal-rights paragraph grounded in the web sources, bracketed placeholders for facts only the patient knows, and the explicit fallback when the policy does not support a rebuttal.
7. `Build Action Plan` (Generate JSON) — deadline (`letter` | `regulation` | `unknown` source, never computed), evidence checklist tailored to the denial categories, ordered next steps, escalation paragraph, and the list of citations actually used.
8. `Finalise Output` (code) — merges letter, plan, retrieved excerpts, web sources and disclaimer.
9. `API Response` — `{ result }`.

#### Output

`result.letter` (Markdown), `result.deadline`, `result.checklist[]`, `result.nextSteps[]`, `result.escalation`, `result.citationsUsed[]`, `result.policyExcerpts[]`, `result.webSources[]`, `result.disclaimer`.

#### Dependencies

Upstream: `index-policy` (same `policyId`), `analyze-denial`. External: embedding model + vector DB, chat model, Serper credential for Web Search.

### Flow Interaction

```
index-policy ──┐
               ├──► draft-appeal ──► app renders letter / checklist / deadline
analyze-denial ┘   (user confirms denialFacts in between)
```

## Security model and production considerations

This kit is a reference implementation with **no authentication layer**. The app
accepts a caller-supplied `policyId` and uses it to scope both indexing and
retrieval. That scoping is a *correctness* mechanism, not an *authorization*
one: it keeps one policy's clauses out of another policy's appeal, but it does
not prove the caller owns the policy. A caller who guessed or replayed another
user's `policyId` could retrieve excerpts from that policy.

Before deploying this to real users, bind `policyId` to an authenticated owner:

- Generate `policyId` server-side on upload and persist `{policyId, ownerId}`.
- Resolve the caller's identity from a session, not from the request body.
- Verify ownership before calling `index-policy` or `draft-appeal`, and pass the
  server-resolved `policyId` to the flow rather than the client-supplied one.
- Consider a per-user vector-store namespace so retrieval cannot cross tenants
  even if an id leaks.

The demo generates a fresh UUID per session (`crypto.randomUUID()`), so ids are
not guessable in practice, but that is defence in depth rather than authorization.


## Guardrails

See `constitutions/default.md`. In short: no fabricated citations, honest when the policy supports the denial, minimal restatement of medical detail, no advice to misrepresent facts, no legal-advice posture, mandatory disclaimer on every output, bracketed placeholders for anything only the patient can supply.

## What the agent will not do

- Invent policy sections, page numbers, regulations, or deadlines.
- Compute a deadline date no source states.
- Provide legal advice or impersonate a lawyer, physician, or regulator.
- Draft anything that misrepresents the facts of the claim.

## Integration Reference

The app calls each flow with the Lamatic SDK: `lamatic.executeFlow(flowId, payload)`. Flow IDs come from the env keys above; `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` authenticate.

## Common Failure Modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Letter has no policy citations | `policyId` mismatch between index and draft, or index-policy not run | Use the same `policyId`; check `chunks > 0` from flow 1 |
| Letter states no regulatory deadline | Web Search returned nothing (missing Serper credential) | Configure `SERPER_API_KEY` in Studio; the letter degrades gracefully |
| `denialFacts.confidence` is `low` | Poor OCR / truncated letter text | Re-upload a clearer scan; confirm `missingInfo` items in the app |
| Generate JSON node fails | Model does not support structured output | Select a model with JSON/schema support in Studio |

## Roadmap (not implemented)

- Scheduled deadline reminders (cron trigger + SMTP/Twilio) once a letter is generated.
- Insurer-specific appeals-address lookup.
- Auto, home, travel, and disability insurance lines; non-US jurisdictions.
