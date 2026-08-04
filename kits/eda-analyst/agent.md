# EDA Analyst — Agent Identity

## Overview
EDA Analyst is an autonomous exploratory-data-analysis agent. Given a CSV, it profiles the data, cleans it, plans and runs a set of analyses, and returns a self-contained interactive dashboard. It behaves like a careful data analyst: it decides what to do, does the math in code, checks its own work, and only keeps results it can trust.

## Purpose
Turning a raw CSV into a trustworthy first-look dashboard normally means manual profiling, cleaning, charting, and sanity-checking. This agent automates that end to end while preserving trust: the LLM makes the judgment calls (what to impute, what to drop, which analyses matter) and deterministic code produces every number, so the output can't be silently hallucinated.

## Flow: `eda-analyst`
- **Trigger:** an API request with `{ fileUrl }` (a public CSV URL).
- **Processing (four guarded stages):**
  1. **Profile** — code computes per-column type, missingness, cardinality, distributions, outliers, and pairwise correlations.
  2. **Sanitize** — a Batched LLM planner decides per-column cleaning (keep / impute mean|median|mode / drop) and whether to deduplicate; code applies the plan and a **validation gate reverts to the original data** if the result is worse.
  3. **Analyze** — an LLM plans 4–6 grounded analyses; a code validator drops invalid tasks and, only if coverage is thin, triggers a single re-plan; code executes each analysis; a findings gate rejects any with broken chart data.
  4. **Visualize** — code renders a self-contained HTML + Chart.js dashboard.
- **Response:** `{ dashboardHtml, chartCount, validated }`.
- **When to use:** first-pass EDA on any tabular CSV. **When not to use:** non-tabular data, private/login-gated files, or when you need statistical modeling rather than descriptive analysis.

## Guardrails
- The LLM **never sees raw rows and never emits a numeric statistic** — it only chooses actions; code computes all values.
- **Fail-safe cleaning:** the validation gate blocks any cleaning that drops an unplanned column, raises missingness, degrades a column's type, empties the dataset, or collapses a column to one value — reverting to the original data instead.
- **Bounded cost:** cleaning scales across wide datasets via a Batch (extra LLM calls only when needed); the analysis re-plan fires at most once, and only when the first plan is incomplete.
- Output is descriptive EDA, not modeling or causal claims.

## Integration Reference
- **Lamatic Extract-from-File** — fetches and parses the CSV from `fileUrl` (no extra credential; runtime fetch).
- **OpenAI-compatible LLM** (configured in Lamatic Studio) — powers the Clean Planner, Insight Planner, and Re-Planner decision nodes.

## Environment Setup
LLM credentials are configured in the Lamatic project. The companion app (`apps/`) needs: `EDA_ANALYST` (flow ID), `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`.

## Quickstart
1. Deploy the `eda-analyst` flow in Lamatic Studio.
2. `cp apps/.env.example apps/.env.local` and fill in the values.
3. `cd apps && npm install && npm run dev`, then provide a CSV URL and view/download the dashboard.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| No rows extracted | `fileUrl` unreachable / not a CSV / login-gated | Use a public direct-download CSV URL. |
| `validated: false` | Cleaning would have degraded the data | Expected safety behavior; dashboard uses the original data. |
| Fewer charts than planned | Findings gate rejected invalid analyses | Remaining valid findings still render. |
| Blank dashboard in iframe | CSP blocks the Chart.js CDN | Serve where the jsdelivr CDN is allowed. |
