# Cloud Carbon Advisor

Git blame for your cloud carbon.

Upload a cloud usage export (a [FOCUS](https://focus.finops.org/)-style billing
CSV). It computes an auditable CO₂e footprint per service and region, finds your
carbon hotspots, and returns an **impact-ranked decarbonization plan** — with a
specific lever for each hotspot, its effort, its risk, and a projected saving.

Every gram is computed by code from published emissions factors. The model never
emits a number — it only decides *which lever to pull*. See [Architecture](#architecture).

## What you get back

- **A footprint, per service and region** — estimated electricity (kWh), the
  region's grid carbon intensity, and the resulting kgCO₂e, aggregated into the
  hotspots that actually matter.
- **A diagnosed driver for each hotspot** — is this carbon coming from a *dirty
  grid*, *heavy compute*, *storage bloat*, or *egress*? The driver decides the
  fix.
- **A costed lever** — a concrete action (migrate region, move to ARM, tier cold
  storage, schedule to low-carbon hours…), its effort and risk, and a projected
  reduction in kgCO₂e — with cross-region moves flagged, never presented as free.
- **The region-migration ceiling** — computed exactly: how much CO₂e each
  hotspot would drop if it ran on the cleanest same-provider region.

## Why this and not the cloud providers' own carbon tools

| Tool | Multi-cloud | No cloud credentials needed | Tells you **what to do** |
|---|:---:|:---:|:---:|
| AWS Customer Carbon Footprint Tool | ❌ AWS only | ❌ needs the account | ❌ reports only |
| GCP Carbon Footprint / Azure Emissions Impact | ❌ one cloud each | ❌ needs the account | ❌ reports only |
| Cloud Carbon Footprint (OSS) | ✅ | ❌ connects to billing APIs | ⚠️ estimates, limited guidance |
| **This kit** | ✅ | ✅ works from a static usage export | ✅ a ranked, costed lever per hotspot |

The providers' first-party tools each cover one cloud, require access to the
account, and stop at *reporting* — they tell you your number, not which of your
workloads to move or how. [Cloud Carbon Footprint](https://www.cloudcarbonfootprint.org/),
the excellent open-source estimator this kit borrows its methodology from, is
multi-cloud but is a self-hosted application that connects to your billing APIs.

This kit deliberately trades live integration for zero-credential portability: it
works from a usage **file** you already have, across any provider in one report,
and its differentiated output is the **plan** — a prioritized list of levers an
engineer can act on this week — not another dashboard of numbers.

**What this kit does not claim:** it is not an audited carbon-accounting system
of record (see [Limitations](#limitations)), and it does not connect to any cloud
API. It is a fast, defensible planning tool for *where to cut carbon first*.

## Architecture

```text
FOCUS usage CSV
   │
   ├─ apps/lib/compute-emissions.ts     deterministic — runs in the Next.js app
   │     energy(kWh) × PUE × grid-intensity(region) = gCO₂e, per service/region;
   │     ranks hotspots; computes the cleaner-region delta exactly — all arithmetic
   │
   └─ flows/carbon-advisor              judgment only — runs in Lamatic
         └─ Generate JSON (structured LLM)  one diagnosis + one recommendation per
                                            hotspot: driverClass, a lever, effort,
                                            risk, a reductionKey bucket — the report's
                                            metrics are computed downstream, not here
   │
   └─ apps/lib/assemble.ts              deterministic — prices each chosen lever
         from a fixed reductionKey→multiplier table, reconciles totals, writes
         relatable equivalences, and produces the report.
```

**The model never does arithmetic.** Estimating emissions is a chain of lookups
(usage × energy coefficient × PUE × grid intensity); pricing a lever is a bucket
multiplier times the hotspot's own footprint. Both run in TypeScript, are
unit-tested, and are the same code the offline eval asserts against. *Which
driver, and which lever* is a judgment call — the one part of the pipeline that
genuinely needs a model.

Enforcement of "never a number" is layered, not just a prompt request: the
[constitution](./constitutions/default.md) states it, the app's `coercePlan`
(`apps/lib/plan.ts`) forces every enum into range and drops any invented hotspot
id before anything is priced, and the app prices levers from its own tested
table — so
every figure in a report traces back to a deterministic source. `npm run eval`
asserts exactly that.

## Emissions methodology & sources

This kit follows the methodology of the open-source
[Cloud Carbon Footprint](https://www.cloudcarbonfootprint.org/docs/methodology)
project:

```text
emissions (gCO₂e) = energy (kWh) × PUE × grid carbon intensity (gCO₂e/kWh)
energy (kWh)      = usage amount × energy coefficient for that usage class
```

- **Energy coefficients** (compute per vCPU-hour, memory/storage per GB-hour,
  network per GB) — Cloud Carbon Footprint methodology, including its ~40% lower
  coefficient for ARM/Graviton silicon.
- **PUE** — provider sustainability disclosures (AWS 1.135, Google 1.10, Azure
  1.125), 1.20 where unknown.
- **Grid carbon intensity by region** — Cloud Carbon Footprint's
  grid-emissions-factors, provider carbon-data pages, and Ember's yearly grid
  averages.

All factors live in one auditable file, [`apps/lib/emissions-factors.ts`](./apps/lib/emissions-factors.ts),
and are trivially swappable. These are order-of-magnitude-correct *planning*
figures; the kit's value is the **relative** comparison between regions and
levers, which is robust to the absolute uncertainty in any single coefficient.

## Quickstart

**Option A — full experience (with the Lamatic flow):**

1. Import [`flows/carbon-advisor.ts`](./flows/carbon-advisor.ts) into Lamatic
   Studio, attach a Gemini (or other) credential to the Generate JSON node, deploy,
   and copy the Flow ID.
2. `cd kits/cloud-carbon-advisor/apps`
3. `cp .env.example .env.local` and fill in the four values (see below).
4. `npm install && npm run dev`
5. Open http://localhost:3000, press **Load example**, then **Analyze footprint**.

**Option B — offline (no credentials):** skip step 1 and leave
`LAMATIC_CARBON_ADVISOR_FLOW_ID` blank. The app computes the full footprint and
runs a deterministic **heuristic** plan, clearly badged, so you can explore it
with zero setup. Connect the flow to replace the heuristic with real reasoning.

Independent of Studio: `npm run eval` runs 58 offline assertions (numeric
integrity, classifier, cleaner-region math, savings pricing, model-output
coercion, CSV-injection) with no network and no model calls.

## Environment

| Variable | Source |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio → API Docs → Endpoint |
| `LAMATIC_CARBON_ADVISOR_FLOW_ID` | Flow → three-dot menu → Flow ID |

All four are read server-side only and never prefixed `NEXT_PUBLIC_`: the three
`LAMATIC_API_*` values are consumed by the Lamatic client used in
`apps/actions/orchestrate.ts`, and `LAMATIC_CARBON_ADVISOR_FLOW_ID` is resolved
through the `apps/orchestrate.js` deployment manifest. Account identifiers are
stripped before the flow is called.

## Input format

A CSV with at least these columns (common aliases are accepted, e.g.
`Region`/`RegionId`, `UsageQuantity`/`PricingQuantity`):

`ServiceName`, `ServiceCategory`, `RegionId`, `PricingUnit`, `PricingQuantity` —
plus optional `ProviderName`, `SubAccountId`, `SkuId`, `BilledCost`,
`BillingCurrency`. See [`apps/public/sample-usage.csv`](./apps/public/sample-usage.csv)
for a working example.

## Limitations

- **Planning-grade, not audited.** Estimates use public average factors, not your
  actual metered power draw or your provider's market-based (contractual) carbon
  accounting. Treat the output as *where to look first*, not a compliance figure.
- **Representative region set.** [`emissions-factors.ts`](./apps/lib/emissions-factors.ts)
  covers the most-used regions and the cleanest ones; an unlisted region falls
  back to the global grid average (~475 gCO₂e/kWh) rather than scoring zero.
- **No utilisation signal.** Billing usage doesn't reveal CPU utilisation, so
  `over-provisioned` is diagnosed conservatively and rightsizing is an estimate.
- **Location-based intensity.** Grid intensities are yearly location-based
  averages, not hour-by-hour marginal intensity; `schedule-shift` savings are
  therefore directional.
- **The region-migration ceiling is a ceiling.** Moving a workload to the
  cleanest grid ignores data-residency, latency, and egress-repatriation cost —
  which is exactly why the model weighs those into `effort`/`risk` and flags
  cross-region moves.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Missing LAMATIC_…` | No `.env.local`, or a blank value | Fill in the four variables (or leave the Flow ID blank for offline mode) and restart |
| `CSV is missing required column(s)` | Not a FOCUS-style export, or wrong delimiter | Ensure ServiceName, RegionId, PricingUnit, PricingQuantity columns exist |
| Badge says **offline heuristic** | No Flow ID configured | Expected — set `LAMATIC_CARBON_ADVISOR_FLOW_ID` to use the Lamatic flow |
| An unlisted region shows ~475 g/kWh | Region not in the factor table | Expected fallback; add it to `emissions-factors.ts` for precision |
| A hotspot shows a `flags` chip | The model returned an out-of-range enum or a bad id | Expected and handled — the coerced-to-safe value is shown, not an error |
| `Could not reach Lamatic` | Wrong `LAMATIC_API_URL`, or no network | Re-copy the endpoint from Studio → API Docs |

## License

Contributed to [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) under the
repository's license.
