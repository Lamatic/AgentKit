# Fixture provenance

`focus-baseline.csv` is derived from the **FOCUS Sample Data** project published by
the FinOps Foundation / Linux Foundation:

- Source: https://github.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS-Sample-Data
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Attribution: FinOps Open Cost and Usage Specification (FOCUS), a Linux Foundation project.

## What we did to it

1. Took the AWS sample month, kept only `ChargeCategory == "Usage"` rows.
2. Re-sampled to hourly grain (source ships daily/monthly in places) by splitting
   each period evenly across its covered hours — this is a synthetic densification,
   not real hourly telemetry.
3. Trimmed the columns and re-labeled the period to Sept 2024 so the fixture set has
   a stable, documented `periodLabel`.
4. `case-*.csv` files start from this baseline and inject synthetic anomalies —
   see `../generate.ts` for the exact, seeded injection logic. Every injected
   anomaly is a fabrication for eval purposes; none reflect a real incident.

## Re-download steps

```
curl -L -o focus-source-raw.csv \
  https://raw.githubusercontent.com/FinOps-Open-Cost-and-Usage-Spec/FOCUS-Sample-Data/main/samples/focus-1.0/aws/focus_1_0_aws.csv
```

Then run `npm run fixtures` (`assets/fixtures/generate.ts`) to regenerate the
derived `focus-baseline.csv` and every `case-*.csv` / `expected-*.json` pair
deterministically from the seed.
