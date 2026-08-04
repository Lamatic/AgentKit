# API Change Review

## Overview

An agent that reads two versions of an OpenAPI 3.x specification and answers the question a reviewer actually has: *who breaks, and what do they have to do about it?* It classifies every difference by consumer impact, issues a merge verdict, and drafts the migration notes and changelog entry that would otherwise be written by hand — or skipped.

## Purpose

API teams change specs continuously. Working out which of those changes break existing consumers is manual, tedious, and fails in the expensive direction: the cost of missing one breaking change is a broken integration in production, while the cost of over-flagging is a minute of reading. The write-up for consumers is then a second task that gets dropped under deadline.

This agent removes both. It never misses a structural difference, because finding differences is not left to a model — and it explains each one in consumer terms, because explaining is exactly what a model is good at.

## Architecture

The work is split on the deterministic/agentic line, and the split is deliberate:

```
Two OpenAPI specs
   │
   ├─ apps/lib/spec-diff.ts     deterministic — runs in the Next.js app
   │     └─ change facts        { id, kind, location, before, after, requiredNow }
   │
   └─ flows/api-review-change   judgment — runs in Lamatic
         ├─ Generate JSON       severity + consumer impact per change
         ├─ Generate Text       migration notes ---CHANGELOG--- changelog
         └─ Code                assemble into the response shape
```

Comparing two schemas is a solved problem with a right answer. Running it in TypeScript makes it reproducible, unit-testable, and free. It was also a practical necessity: Lamatic code nodes inline their variables into source text, so a realistic spec pair exceeds the node payload limit.

The flow therefore receives **change facts, never raw specs**, and the app carries **no severity mapping of its own**. Severity is the flow's answer; duplicating the rules client-side would let the two drift apart silently.

Each change fact crosses the boundary JSON-encoded. Studio's trigger schema offers only `[]` or `[string]` for arrays, and object-shaped items are rejected at ingestion with HTTP 400, so the app serializes and the assemble node parses. That node accepts both shapes, so nothing breaks if the schema is later widened to `[]`.

## Flows

### `api-review-change`

**Trigger** — API Request (GraphQL). Accepts:

| Field | Type | Meaning |
|---|---|---|
| `changes` | `[string]` | Change facts from `diffSpecs()`, each JSON-encoded |
| `totalChanges` | int | Length of `changes` |
| `oldVersion` | string | `info.version` of the previous spec, or null |
| `newVersion` | string | `info.version` of the new spec, or null |
| `endpointsTouched` | array | Distinct locations affected |
| `audience` | string | `consumer developers` or `release notes` |

**Processing** — a condition splits on `totalChanges > 0`. The populated branch runs *Generate JSON* to assess each change, then *Generate Text* to draft both documents in one call, separated by a `---CHANGELOG---` line. The empty branch runs a no-op Code node. Both converge on an assemble node that produces an identical response shape, so the caller never has to know which branch ran.

**Response** —

```typescript
{
  verdict: "safe-to-merge" | "review-required" | "needs-major-version" | "no-api-change",
  summary: string,
  oldVersion: string | null,
  newVersion: string | null,
  totalChanges: number,
  counts: { breaking: number, potentiallyBreaking: number, additive: number },
  changes: Array<{
    id, kind, location, before, after,
    severity: "breaking" | "potentially-breaking" | "additive" | "unclassified",
    reason: string | null,
    consumerImpact: string | null,
    confidence: number | null
  }>,
  migrationNotes: string | null,   // markdown
  changelog: string | null         // markdown, Keep a Changelog style
}
```

The verdict is computed arithmetically from the severity counts, not asked of a model: any breaking change means `needs-major-version`, any potentially-breaking means `review-required`, otherwise `safe-to-merge`.

**When to use it** — before merging a spec change, when cutting a release, or when a consumer asks what changed between two published versions.

**Dependencies** — one text generation model for the drafting node and one structured-output model for the classification node.

## Guardrails

Beyond `constitutions/default.md`:

- **Never invent API surface.** The classifier receives already-computed facts and returns exactly one assessment per input change, keyed by `id`. It does not re-derive changes or add ones it was not given.
- **Reason from data, not from labels.** A `param.added` that is required is breaking despite sitting in the additive category. Where the severity rule and the `requiredNow` value disagree, the data wins and confidence drops.
- **Never invent endpoints, fields, versions, or dates** in the migration notes or changelog. Fields are referenced by the exact path supplied.
- **Unassessed changes are surfaced, not hidden.** Any change the classifier does not return an assessment for is marked `unclassified` and still rendered.

### Not in scope

- Rewriting or fixing the spec.
- Judging whether a change is a good idea — only what it costs consumers.
- Swagger 2.0. OpenAPI 3.x only; 2.0 documents are not converted.
- External `$ref` resolution. Anything not starting `#/` is left unresolved rather than fetched over the network.

## Integration reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic | Hosts and executes the flow | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |
| Text generation model | Migration notes + changelog | Configured in Studio on the Generate Text node |
| Structured output model | Per-change severity assessment | Configured in Studio on the Generate JSON node |

No other external service is called. The app makes exactly one outbound request per review, from a server action.

## Environment setup

| Variable | Source |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio → API Docs → Endpoint |
| `LAMATIC_API_CHANGE_REVIEW_FLOW_ID` | Flow → three-dot menu → Flow ID |

All four are read server-side only. None is prefixed `NEXT_PUBLIC_`, and the SDK is instantiated exclusively inside `apps/actions/orchestrate.ts`.

## Quickstart

1. Deploy the `api-review-change` flow in Lamatic Studio and copy its Flow ID.
2. `cd kits/api-change-review/apps`
3. `cp .env.example .env.local` and fill in the four values above.
4. `npm install && npm run dev`
5. Open http://localhost:3000 and press **Load example**.
6. Press **Review changes**.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Missing LAMATIC_… — copy apps/.env.example…` | No `.env.local`, or a blank value | Fill in all four variables and restart the dev server |
| `… does not look like an OpenAPI document` | Pasted a fragment, a Swagger 2.0 file, or the wrong file | Paste a full OpenAPI 3.x document with a top-level `paths` |
| `… is not valid JSON or YAML` | Truncated paste or mixed indentation | Re-copy the whole file, or upload it instead of pasting |
| `Could not reach Lamatic` | Wrong `LAMATIC_API_URL`, or no network | Re-copy the endpoint from Studio → API Docs |
| `The flow returned an unexpected shape` | Flow ID points at a different flow, or the response node's output mapping changed | Confirm the Flow ID, and that the API Response node still maps `verdict` |
| Every change comes back `unclassified` | The classification node returned no assessments, or returned ids that don't match the input | Check the Generate JSON node's model is configured and its schema is unchanged |
| Notes and changelog are empty or generic | The Generate Text node's prompt variables resolve to nothing | Confirm the node IDs in the user prompt match the current graph |
| Verdict is `no-api-change` for specs that clearly differ | The differences are outside the diffed surface — descriptions, examples, and summaries are intentionally ignored | Expected; only consumer-visible structure is compared |
