# Cloud Cost Attribution

Git blame for your cloud bill.

Upload a FOCUS billing export and a change log (deploys, config edits, infra
changes). It finds the spend anomalies, attributes each one to the specific
change most likely to have caused it — or says honestly that none of them do
— and returns a costed remediation plan.

## What you get back

- **Every anomaly above the noise floor** — spike or gradual drift, with the
  dollar delta, percentage, and whether it's usage-driven (more requests) or
  rate-driven (same requests, higher unit cost).
- **A specific attributed cause** — one candidate change from your log, with
  evidence and the reasons every other nearby candidate was rejected — or an
  honest `null` when nothing in the log explains it.
- **A costed fix** — action, effort, risk, prerequisites, and an estimated
  monthly savings figure.

Every `$` and `%` in the response is computed by code, never by a model. See
[Architecture](#architecture).

## Why this and not AWS Cost Anomaly Detection

| Tool | Tells you what got more expensive | Tells you which change caused it |
|---|:---:|:---:|
| AWS Cost Anomaly Detection / Amazon Q | ✅ | control-plane only, via CloudTrail |
| GCP / Azure cost anomaly tools | ✅ | ❌ |
| CloudZero, Vantage, Kubecost, Finout | ✅ | manual tagging only (e.g. `metadata.git_sha`) |
| Datadog Cost Management, Harness CCM | ✅ | owns deploy tracking separately, not wired to cost |
| **This kit** | ✅ | ✅ — ranks candidate changes from your log, with evidence |

AWS's own CloudTrail documentation is explicit about the gap this kit fills:

> By default, trails and event data stores do not log data events. […] Data
> events provide information about the resource operations performed on or in
> a resource. These are also known as *data plane operations*.
>
> — [Logging data events, AWS CloudTrail User Guide](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html)

`S3 GetObject`, `DynamoDB GetItem`, and every other data-plane operation —
the exact category of call that drives most real cost spikes — is invisible
to CloudTrail unless a customer pays extra to opt in. Attribution products
built on CloudTrail inherit that blind spot. This kit works from your billing
export and your own change log instead, so it never depends on CloudTrail
coverage at all — and it also doesn't stop at "which AWS API call" the way
CloudTrail-based attribution does. It ranks *your deploys, PRs, and config
changes* as candidate causes, which is the granularity an engineer actually
acts on.

**What this kit does not claim:** it does not replace anomaly *detection* for
teams already happy with their existing tool — the detector here (`apps/lib/detect-anomalies.ts`)
is a reasonably capable spike/drift detector, but the differentiated part is
attribution. It also does not connect to any cloud API — see
[Limitations](#limitations).

## Architecture

```text
FOCUS billing CSV  +  change-event log
   │
   ├─ apps/lib/detect-anomalies.ts   deterministic — runs in the Next.js app
   │     └─ AnomalyEpisode[]          spike/drift, $ deltas, robust z-score,
   │                                  usage-vs-rate driver — all arithmetic
   │
   └─ flows/cost-attribution          judgment only, runs in Lamatic
         ├─ Redact                   strips SubAccountId, caps payload (≤10
         │                           anomalies, ≤25 candidates, ≤60 series pts)
         ├─ Attribute (opus-5)       causeEventId | null, confidence, evidence
         ├─ Remediate (sonnet-5)     action + savingsKey bucket (not a number)
         └─ Assemble                 rehydrates identifiers, computes every
                                     $/% from AnomalyEpisode fields + a fixed
                                     multiplier table, sorts by dollar impact
```

**The model never does arithmetic.** Detecting an anomaly is a statistics
problem (median-absolute-deviation z-score against a same-hour-of-week
baseline); pricing a remediation is a lookup (a fixed `savingsKey → multiplier`
table times the anomaly's own delta). Both run in TypeScript, are unit-tested,
and are the same code the offline eval suite asserts against. *Which change
caused this* is a judgment call over a short list of plausible-looking decoys
— the one part of this pipeline that genuinely needs a model.

Enforcement of the "never a number" rule is three layers deep, not just a
prompt request: the constitution states it explicitly, the assemble node
(`scripts/cost-attribution_assemble.ts`) never reads a numeric field out of
either LLM node's output, and the offline eval's S2 suite asserts that every
dollar figure in a report traces back to a deterministic source.

## Quickstart

```bash
cd kits/cloud-cost-attribution/apps
cp .env.example .env.local     # then fill in the four values below
npm install
npm run dev
```

Open http://localhost:3000 and press **Load example** — it loads the
flagship fixture: an S3 `GetObject` cost spike caused by a deploy that
switched image pulls from an authenticated pull-through cache to a public
registry, plus a change log containing that deploy and three deliberately
tempting decoys (see [Decoy taxonomy](#decoy-taxonomy)).

### Environment

| Variable | Where to find it |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project → Project ID |
| `LAMATIC_API_URL` | Studio → API Docs → Endpoint |
| `LAMATIC_COST_ATTRIBUTION_FLOW_ID` | Flow → three-dot menu → Flow ID |

All four are server-side only, read exclusively in
`apps/actions/orchestrate.ts`. None is prefixed `NEXT_PUBLIC_`.

### Turning a git log into a change-event log

The flow's `ChangeEvent` shape is deliberately small — this one-liner is
enough to get a real repo's deploy history into the expected shape:

```bash
git log -z --since="60 days ago" --pretty=format:'%H%x1f%aI%x1f%s%x1f%an' | \
  jq -R -s '
    split("\u0000") | map(select(length > 0)) | map(split("\u001f")) |
    map({id: .[0], timestamp: .[1], type: "deploy", title: .[2], diffSummary: .[2], filesTouched: [], author: .[3], refs: []})
  ' > change-events.json
```

`git log -z` NUL-terminates each commit record instead of the default blank
line, and `%x1f` separates fields within a record — both are non-printable
control bytes that cannot appear in a commit hash, an ISO timestamp, or (in
practice) a commit subject or author name, so a subject containing a literal
`\x1f` won't corrupt the split (unlike a printable delimiter such as `,` or
`|`, which a commit message could plausibly contain). `%s` (the commit
subject) can also contain quotes and backslashes — piping raw
`--pretty=format` output straight into a hand-built JSON string breaks on
those; routing each field through `jq -R` (raw string input) escapes it
properly. Fill `filesTouched` from `git show --stat` per commit if you want
the extra evidence signal — the attribute
prompt uses it when present.

## Layout

```text
kits/cloud-cost-attribution/
├── lamatic.config.ts          project metadata
├── agent.md                   agent identity + capabilities
├── flows/cost-attribution.ts  the flow graph (see provenance note in the file header)
├── constitutions/default.md   guardrails, incl. the numeric-integrity rule
├── prompts/                   externalized attribute/remediate prompts
├── model-configs/             opus-5 (attribute), sonnet-5 (remediate)
├── scripts/                   redact + assemble code-node bodies
├── assets/fixtures/           seeded fixture generator + golden eval set
└── apps/
    ├── actions/orchestrate.ts the only place the SDK is called
    ├── lib/detect-anomalies.ts the deterministic anomaly detector
    ├── lib/parse-billing.ts   FOCUS CSV -> FocusRow[]
    ├── lib/focus.ts           FOCUS 1.0/1.4 column shim + validation
    ├── lib/savings.ts         the savingsKey -> multiplier table
    ├── lib/eval.ts            npm run eval — offline, no network, no keys
    ├── lib/eval-live.ts       npm run eval:live — S1, needs a deployed flow
    ├── components/            UploadPanel, SpendWaterfall, AnomalyCard,
    │                          AttributionTrace, SavingsTable, EvidencePanel
    └── public/samples/        the flagship example (data-plane case)
```

## Data scope: FOCUS 1.4 (partial conformance)

This kit consumes a specific column subset of the [FOCUS](https://focus.finops.org/)
1.4 spec: `ChargePeriodStart/End`, `BillingCurrency`, `EffectiveCost`,
`BilledCost`, `ChargeCategory`, `ChargeDescription`, `ServiceName`,
`ServiceCategory`, `RegionId`, `SubAccountId`, `ResourceId`, `ResourceType`,
`SkuId`, `PricingQuantity`, `PricingUnit`, `Tags`. `apps/lib/focus.ts` accepts
either 1.0 or 1.4 column names and normalizes to 1.4. **It does not implement
the full FOCUS conformance suite** (1,514 validation rules) — only the
consumed columns are validated present and well-typed; anything else in the
export is ignored. Detection scope is further narrowed to
`ChargeCategory == "Usage"` rows only — Purchase, Credit, and Tax rows are
never flagged as anomalies.

## Fixtures: real substrate, synthetic anomalies

`assets/fixtures/source/focus_sample.csv` is unchanged and matches
`samples/focus-1.0/aws/focus_1_0_aws.csv` from the upstream
[FOCUS-Sample-Data](https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS-Sample-Data)
project (FinOps Foundation / Linux Foundation), licensed
[**CC BY 4.0**](https://creativecommons.org/licenses/by/4.0/), kept here as a
provenance reference. `generate.ts` does not read that file — it is a fully
synthetic, seeded generator (hand-written `PROFILES` table + a seeded PRNG)
that builds a 28-day hourly baseline using `ServiceName` / `RegionId` /
`ChargeDescription` / `SkuId` / `SubAccountId` values shaped like that
source's real entries (e.g. `Amazon Simple Storage Service`,
`$0.004 per 10,000 GET and all other requests`, `us-east-1`), at hand-picked
hourly cost levels chosen to be demo-legible. `npm run fixtures` regenerates
the whole set byte-identically from the seed. Every injected anomaly is a
synthetic fabrication for eval purposes — none reflect a real incident. Full
provenance: `assets/fixtures/source/README.md`.

### Decoy taxonomy

The change-event log ships four decoy types alongside each true cause, so
attribution has something real to fail against:

| Decoy | Description | Example in the fixture set |
|---|---|---|
| D1 — temporal | Closer in time than the true cause, but unrelated | "scale checkout-service replicas 4→8", 45 min before the true cause's inflection |
| D2 — direction | Same domain, opposite effect | "add CloudFront cache headers to reduce origin GETs" — would *lower* the cost, not raise it |
| D3 — wrong-service | Plausible wording, different service | "migrate DynamoDB nightly backups to public S3 bucket" — mentions "migrate" and "public" like the true cause, wrong service |
| D4 — abstain | No change explains it (a pure rate change) | the DynamoDB rate-spike fixture has no true cause at all — the correct answer is `causeEventId: null` |

## Eval

```bash
npm run eval        # offline: S2 numeric integrity, S3 hallucination coercion,
                     #   S4 false-positive, S5 determinism, + detection sanity
                     #   — no network, no API keys. Currently 52/52.
npm run eval:live    # S1: attribution vs a naive nearest-in-time baseline on
                     #   the D1-D4 decoy set. Needs a deployed flow + model
                     #   credentials — writes eval-results.json with an ISO
                     #   date and the exact model ids used.
```

**S1 has not been run against a deployed flow yet** — building and deploying
the Studio graph requires interactive access to Lamatic Studio that this
kit's authoring environment did not have (see the provenance note in
`flows/cost-attribution.ts`). `npm run eval:live` is fully implemented and
ready to run once the flow is deployed; this README will be updated with the
dated, model-pinned result from `apps/eval-results.json` at that point,
honestly, whether attribution beats the baseline or not. Until then, treat
the attribution claim as architecturally enforced (a hallucinated or
off-list `causeEventId` is structurally impossible to return, per S3) but
**not yet empirically measured**.

## Limitations

- **Confidence is not a probability.** `high` / `medium` / `low` reflects how
  tightly the model judged timing + mechanism to line up, not a calibrated
  statistical confidence interval. Treat it as a triage signal.
- **Attribution quality degrades with commit-message quality.** The model
  reasons from `diffSummary` and `title` — a change log of `"fix stuff"` gives
  it nothing to work with. The `git log` adapter above pulls the commit
  subject; richer `diffSummary` text (a PR description, a `git show --stat`
  file list) measurably improves attribution, per the prompt design.
- **Single currency per run.** A billing export mixing currencies is rejected
  outright, not converted.
- **Static files only.** This kit does not call any cloud billing API and
  never asks for cloud credentials — it works entirely from files you
  provide. Turning a live AWS/GCP/Azure account into a FOCUS export is a
  separate, already-solved problem (each provider ships a FOCUS exporter).
- **Drift detection caps confidence at medium**, by design — a gradual,
  fuzzy-inflection anomaly cannot support a "high" claim about one specific
  causing event, even when the model is confident.
- **The flow graph needs a Studio round-trip before this kit is submission-ready.**
  `flows/cost-attribution.ts` was authored against the node/edge schema of a
  merged, Studio-exported reference kit, not exported from Studio itself
  (see the file's header comment). Import it, verify every node, and
  re-export before relying on it as canonical.
- **Rate limiting is per-instance, not global.** `apps/lib/rate-limit.ts` keeps
  its counters in memory, scoped to one serverless instance — the effective
  limit scales with how many warm instances the deployment has. Fine for this
  kit's demo scope; back it with a shared store (Upstash Redis, available
  through the Vercel Marketplace) if you need a real global cap in production.
