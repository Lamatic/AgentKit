# Cloud Carbon Advisor

## Overview

An agent that answers the question a cloud carbon dashboard never does: *what do
I do about it?* It takes a FOCUS usage export, computes an auditable CO₂e
footprint per service and region, finds the hotspots, diagnoses why each one
emits what it does, and returns a specific, costed decarbonization lever for each
— or says honestly that no single driver dominates.

## Purpose

Every first-party cloud carbon tool (AWS Customer Carbon Footprint Tool, Google
Cloud Carbon Footprint, Azure Emissions Impact Dashboard) covers a single cloud,
requires access to the account, and stops at *reporting* — a number, a trend, a
breakdown. None of them rank *which of your workloads to move first*, or tell you
the lever and its cost. Cloud Carbon Footprint (open source) is multi-cloud and
estimate-based but is a self-hosted app wired to your billing APIs.

This agent automates the step after the number: from a usage file — any provider,
no cloud credentials — it produces a prioritized, costed plan, with the
discipline a carbon figure demands: every number is computed by code, never by a
model.

## Architecture

```text
FOCUS usage CSV
   │
   ├─ apps/lib/compute-emissions.ts   deterministic — runs in the Next.js app
   │     └─ Hotspot[]                  energy × PUE × grid-intensity = gCO₂e,
   │                                   ranked; cleaner-region delta computed exactly
   │
   └─ flows/carbon-advisor            judgment — runs in Lamatic
         └─ Generate JSON (structured LLM)  one diagnosis + one recommendation per
                                            hotspot: driverClass, a lever, effort/risk,
                                            a reductionKey bucket (metrics computed downstream)
   │
   └─ apps/lib/assemble.ts            deterministic — prices each lever from a
                                      fixed multiplier table, builds the report
```

Estimating emissions and pricing a lever are both solved arithmetic problems, so
they run in TypeScript and are unit-tested (`npm run eval`). *Which driver, and
which lever* is judgment over the hotspot's shape — which is what the model is
for. The flow never receives account identifiers (stripped before the call) and
never emits a number.

## Flows

### `carbon-advisor`

**Trigger** — API Request (GraphQL). Accepts:

| Field | Type | Meaning |
|---|---|---|
| `hotspots` | `[string]` | Ranked `Hotspot[]` from the app's footprint engine, each JSON-encoded, identifier-free |
| `periodLabel` | string | Human-readable billing period |
| `currency` | string | ISO currency code |

**Processing** — a single structured-output node (Generate JSON) returns, per
hotspot: a diagnosis of the dominant carbon driver (`dirty-grid`,
`compute-heavy`, `storage-bloat`, `egress-heavy`, `over-provisioned`, `mixed`)
with evidence and rejected alternatives, and a recommendation — one lever and a
`reductionKey` bucket, weighing cross-region data residency and latency into
effort/risk. Downstream, the app's `coercePlan` (`apps/lib/plan.ts`) coerces
every enum into range, drops any hotspot id the model invented, and never reads
a number out of the model's output.

**Response** —

```typescript
{
  diagnoses: Array<{ hotspotId, driverClass, confidence, evidence, reasoning, rejectedDrivers }>,
  recommendations: Array<{ hotspotId, action, rationale, effort, risk, prerequisites, reductionKey }>
}
```

The app then prices each `reductionKey` deterministically, reconciles totals, and
renders the footprint dashboard and plan.

**When to use it** — at the end of a billing period, before a FinOps/GreenOps
review, or whenever "our cloud footprint is X tonnes" needs to become "and here
are the three moves that cut it most".

**Dependencies** — one structured-output ("instructor") model returning both the
diagnosis and the recommendation for every hotspot.

## Guardrails

Beyond [`constitutions/default.md`](./constitutions/default.md):

- **Never emit a number.** Neither model node is asked for a gram, kWh, or
  percentage. The app computes every figure from the footprint and a fixed
  multiplier table.
- **Never invent an enum or an id.** `driverClass`, `reductionKey`, `effort`, and
  `risk` are coerced to a safe value if out of range; a `hotspotId` that does not
  match an input hotspot is dropped. Coerced fields surface as a `flags` chip
  rather than a silent error.
- **No greenwashing.** A cross-continent migration is never presented as free —
  its residency/latency cost is raised into `risk` and a prerequisite, and an
  honest `region-migration-partial` beats a reckless `-major`.

### Not in scope

- Live cloud billing APIs or credentials — this kit is static-file-in by design.
- Audited, market-based carbon accounting — figures are location-based planning
  estimates (see the README's Limitations).
- Hour-by-hour marginal grid intensity — intensities are yearly averages, so
  `schedule-shift` savings are directional.

## Integration reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic | Hosts and executes the flow | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |
| Structured-output model (Generate JSON) | Diagnosis + recommendation per hotspot | Configured in Studio on the Generate JSON node |

No cloud-provider credentials are ever requested — usage data is a file the user
supplies.

## Environment setup

| Variable | Source |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio → API Docs → Endpoint |
| `LAMATIC_CARBON_ADVISOR_FLOW_ID` | Flow → three-dot menu → Flow ID (blank ⇒ offline heuristic mode) |

## Quickstart

1. Import `flows/carbon-advisor.ts` into Lamatic Studio, attach a model
   credential to the Generate JSON node, deploy, and copy the Flow ID.
2. `cd kits/cloud-carbon-advisor/apps`
3. `cp .env.example .env.local` and fill in the four values above.
4. `npm install && npm run dev`
5. Open http://localhost:3000, press **Load example**, then **Analyze footprint**.

Offline: leave the Flow ID blank to run the deterministic heuristic plan with no
credentials. `npm run eval` runs the 58-assertion offline suite.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Missing LAMATIC_…` | No `.env.local`, or a blank required value | Fill the variables (Flow ID may stay blank) and restart |
| `CSV is missing required column(s)` | Not a FOCUS-style export | Ensure ServiceName, RegionId, PricingUnit, PricingQuantity exist |
| Badge shows **offline heuristic** | No Flow ID configured | Set `LAMATIC_CARBON_ADVISOR_FLOW_ID` to use the flow |
| A `flags` chip on a hotspot | Model returned an out-of-range enum or bad id | Expected and handled — the safe coerced value is shown |
| `Could not reach Lamatic` | Wrong `LAMATIC_API_URL` or no network | Re-copy the endpoint from Studio → API Docs |
| Every recommendation is "no recommendation" | The model node is misconfigured | Confirm a credential is attached to the Generate JSON node in Studio |
