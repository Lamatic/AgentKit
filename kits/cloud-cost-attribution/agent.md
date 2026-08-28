# Cloud Cost Attribution

## Overview

An agent that answers the question a cloud bill anomaly alert never does:
*which change caused this?* It takes a FOCUS billing export and a change log
(deploys, config edits, infra changes), finds the anomalies, and attributes
each one to the specific candidate change that most plausibly explains it —
or says honestly that none of them do — then proposes a costed fix.

## Purpose

Every cost-anomaly tool on the market (AWS Cost Anomaly Detection, CloudZero,
Vantage, Datadog Cost Management) tells you *what* got more expensive: a
service, a region, a tag. None of them tell you *which of your deploys did
it*. AWS's own documentation is explicit that CloudTrail — the mechanism
behind its attribution — does not log data-plane operations (S3 `GetObject`,
DynamoDB `GetItem`) by default, so the most common cause of a real spend spike
is invisible to it. Engineers are left correlating a cost graph against a
deploy log by eye.

This agent automates that correlation, with the discipline a dollar figure
demands: every number in the answer is computed by code, never by a model.

## Architecture

```
FOCUS billing CSV  +  change-event log
   │
   ├─ apps/lib/detect-anomalies.ts   deterministic — runs in the Next.js app
   │     └─ AnomalyEpisode[]          spike/drift, $ deltas, robust z-score,
   │                                  usage-vs-rate driver — all arithmetic
   │
   └─ flows/cost-attribution          judgment — runs in Lamatic
         ├─ Redact                   strips account identifiers, caps payload
         ├─ Attribute (opus-5)       which candidate change explains this,
         │                           and how confidently — no numbers
         ├─ Remediate (sonnet-5)     a fix + a savings bucket, not a number
         └─ Assemble                 rehydrates identifiers, computes every
                                     dollar figure from the anomaly + a fixed
                                     multiplier table, builds the response
```

Detecting an anomaly and pricing its remediation are both solved arithmetic
problems — a spike is a z-score threshold, a savings estimate is a delta times
a bucket multiplier. Running them in TypeScript makes the numbers
reproducible and testable (`npm run eval`) independent of any model call.
*Which change caused this* is not arithmetic — it is judgment over a short
list of plausible-looking decoys, which is exactly what a model is for.

The flow therefore never receives raw account identifiers (redacted before
the model sees them) and never emits a dollar figure or percentage — the
constitution states this explicitly, and the assemble node enforces it
structurally by never reading a number out of the model's output.

## Flows

### `cost-attribution`

**Trigger** — API Request (GraphQL). Accepts:

| Field | Type | Meaning |
|---|---|---|
| `anomalies` | `[string]` | `AnomalyEpisode[]` from `detectAnomalies()`, each JSON-encoded |
| `changeEvents` | `[string]` | The change log, each event JSON-encoded |
| `periodLabel` | string | Human-readable billing period |
| `currency` | string | ISO currency code |

**Processing** — Redact strips `SubAccountId` to a placeholder and selects,
per anomaly, up to 25 candidate change events in `[inflection − 7d,
inflection + 2h]`. Attribute picks the causing event (or abstains) with
evidence and rejected-candidate reasoning. Remediate proposes a fix and a
`savingsKey` bucket, independent of the attributed cause's confidence.
Assemble rehydrates identifiers, coerces any invented `causeEventId` or
`savingsKey` to a safe default, computes every dollar figure from
`deltaAbs` and the multiplier table, and sorts anomalies by dollar impact.

**Response** —

```typescript
{
  periodLabel: string,
  currency: string,
  totalCurrent: number,
  totalBaseline: number,
  totalDeltaAbs: number,
  totalDeltaPct: number,
  anomalies: Array<AnomalyEpisode & {
    attribution: { causeEventId: string | null, confidence, evidence, reasoning, rejectedCandidates },
    remediation: { action, rationale, effort, risk, prerequisites, savingsKey },
    estimatedMonthlySavings: number,
    flags: string[]   // e.g. "hallucinated-cause", "unknown-savings-key"
  }>,
  totalEstimatedSavings: number,
  unattributedCount: number,
  execSummary: string
}
```

**When to use it** — after a FinOps alert, at the end of a billing period, or
whenever "the AWS bill went up" needs a specific, defensible answer instead of
a guess.

**Dependencies** — one structured-output ("instructor") model for attribution
and one for remediation.

## Guardrails

Beyond `constitutions/default.md`:

- **Never emit a number.** Neither LLM node is ever asked for a dollar amount
  or percentage. The assemble node computes every figure from
  `AnomalyEpisode` fields and a fixed savings-multiplier table; it never reads
  a number out of the model's structured output.
- **Never invent a cause.** `causeEventId` must be copied from the anomaly's
  own candidate list or be `null`. An id that doesn't match is coerced to
  `null` and flagged `hallucinated-cause` — an honest abstain beats a
  confident wrong guess.
- **Drift anomalies cap at medium confidence.** A gradual, fuzzy-inflection
  anomaly cannot support "high" confidence in a single causing event; the
  assemble node caps it regardless of what the model returns.
- **Rate-driven anomalies reject usage fixes.** If the same usage got more
  expensive (not more usage), a remediation that proposes cutting traffic is
  flagged rather than presented as the answer.

### Not in scope

- Live cloud billing APIs or credentials — this kit is static-file-in,
  static-file-out by design (see Limitations in the README).
- Full FOCUS 1.4 conformance (1,514 validation rules) — only the columns this
  kit consumes are validated; see the README's conformance-scope section.
- Multi-currency in a single run — mixed currencies are rejected, not
  converted.

## Integration reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic | Hosts and executes the flow | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |
| Structured output model (attribute) | Causal attribution per anomaly | Configured in Studio on the Attribute node |
| Structured output model (remediate) | Remediation + savings bucket per anomaly | Configured in Studio on the Remediate node |

No other external service is called, and no cloud provider credentials are
ever requested — billing data and change events are files the user supplies.

## Environment setup

| Variable | Source |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio → API Docs → Endpoint |
| `LAMATIC_COST_ATTRIBUTION_FLOW_ID` | Flow → three-dot menu → Flow ID |

All four are read server-side only, inside `apps/actions/orchestrate.ts`.
None is prefixed `NEXT_PUBLIC_`.

## Quickstart

1. Import `flows/cost-attribution.ts` into Lamatic Studio (see the file's
   header comment — this graph needs a Studio round-trip before it is a
   canonical export), deploy it, and copy its Flow ID.
2. `cd kits/cloud-cost-attribution/apps`
3. `cp .env.example .env.local` and fill in the four values above.
4. `npm install && npm run dev`
5. Open http://localhost:3000 and press **Load example**.
6. Press **Analyze**.

Independent of Studio: `npm run fixtures` regenerates the fixture set, and
`npm run eval` runs 52 offline assertions (numeric integrity, false-positive,
determinism, hallucination-coercion) with no network and no model calls.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Missing LAMATIC_… — copy apps/.env.example…` | No `.env.local`, or a blank value | Fill in all four variables and restart the dev server |
| `Change events file is not valid JSON` | Uploaded the billing CSV in the wrong slot, or a truncated file | Re-select the change-events `.json` file |
| upload rejected as too large / too many rows | Over the 5 MB / 50,000-row cap (V7) | Split the billing export by period or account |
| `mixed currency in upload` | The CSV mixes `BillingCurrency` values | Filter to a single currency before uploading |
| `Could not reach Lamatic` | Wrong `LAMATIC_API_URL`, or no network | Re-copy the endpoint from Studio → API Docs |
| Every anomaly comes back unattributed | The Attribute node's model is misconfigured, or the change log has no events near the anomalies | Confirm the node's model config; widen the change log's date range |
| A `flags: ["hallucinated-cause"]` or `["unknown-savings-key"]` shows up | The model returned an id or key outside the allowed set | Expected and handled — the coerced-to-safe value is what's shown, not an error |
| No anomalies found on a real bill | Nothing crossed the significance floor ($50/day and 1% of total delta) | Expected on a stable bill; try a period with a known spike |
