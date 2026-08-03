# EDA Analyst

An autonomous **exploratory-data-analysis agent** built on a Lamatic flow. Point it at a CSV and it returns a self-contained interactive dashboard — after cleaning the data, checking its own work, and deciding which analyses are worth running.

The guiding principle: **code computes every number; the LLM only makes decisions.** The model never sees raw rows and never invents a statistic — it chooses *what* to clean, *how* to impute, and *which* analyses to run, while deterministic JavaScript does all the math. Every LLM decision is guarded by a validation gate.

---

## What it does

Given `{ "fileUrl": "<public CSV URL>" }`, the flow returns:

```json
{
  "dashboardHtml": "<!doctype html> … a full, self-contained dashboard …",
  "chartCount": 5,
  "validated": true
}
```

`dashboardHtml` is a complete HTML page (Chart.js via CDN) you can drop into an `<iframe>` or save as a `.html` file. It contains: a data-integrity banner, a **cleaning log** (every impute/drop/dedupe with the agent's reason), the **findings** (histograms, category bars, group comparisons, correlation scatters), **data-quality notes**, and a full **column profile** table.

---

## How it works (pipeline)

```
API Request ({fileUrl})
  → Extract from File (CSV → rows)
  → Profile (code)                     compute per-column stats, types, missingness, correlations
  ── SANITIZE ─────────────────────────────────────────────
  → Chunker (code)                     split the profile into size-bounded column groups
  → Batch → Clean Planner (LLM)        per chunk: decide keep / impute(mean|median|mode) / drop
  → Merge (code)                       reassemble one cleaning plan (+ dedupe decision)
  → Apply Cleaning (code)              execute the plan → cleaned rows + changelog + re-profile
  → Validation Gate (code)             revert to original if cleaning degraded the data
  ── ANALYZE ──────────────────────────────────────────────
  → Insight Planner (LLM)              propose 4–6 grounded analyses
  → Insight Validation (code)          drop invalid tasks; check coverage
  → Batch → Re-Planner (LLM, 0–1×)     only fires if the plan has gaps ("more calls when needed")
  → Merge Insights (code)              validated, de-duplicated task list
  → Executor (code)                    run each analysis → findings (real numbers + chart data)
  → Findings Gate (code)               drop any finding with broken/empty chart data
  ── VISUALIZE ────────────────────────────────────────────
  → Renderer (code)                    build the self-contained HTML + Chart.js dashboard
  → API Response ({dashboardHtml, chartCount, validated})
```

Two guarantees make it trustworthy:

- **Fail-safe cleaning.** The validation gate compares the before/after profiles and *reverts to the original data* if cleaning would drop an unplanned column, increase missingness, degrade a type, or empty the dataset.
- **Bounded, adaptive cost.** The clean-planner scales across many columns via a Batch (more LLM calls only when the data is wide), and the insight re-planner fires *only* when the first plan is incomplete — so simple datasets use fewer calls.

---

## Inputs & outputs

| Field | Type | Description |
|---|---|---|
| `fileUrl` (in) | `string` | A public `http(s)` URL to a CSV file. |
| `dashboardHtml` (out) | `string` | Complete self-contained HTML dashboard. |
| `chartCount` (out) | `int` | Number of charts rendered. |
| `validated` (out) | `bool` | Whether cleaning passed the validation gate. |

**Test input** (ships with the flow):
```json
{ "fileUrl": "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv" }
```

---

## Environment

The agent's LLM decision nodes use an OpenAI-compatible model configured in Lamatic Studio (credentials live in your Lamatic project, not in this repo).

For the app (`apps/`):

| Variable | Purpose |
|---|---|
| `EDA_ANALYST` | The deployed flow ID for this agent. |
| `LAMATIC_API_URL` | Your Lamatic API endpoint. |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID. |
| `LAMATIC_API_KEY` | Your Lamatic API key (keep secret; never commit). |

Copy `apps/.env.example` to `apps/.env.local` and fill these in.

---

## Quickstart

1. **Fork & deploy the flow** in [Lamatic Studio](https://studio.lamatic.ai) (import `flows/eda-analyst.ts` or rebuild from this kit), then **Deploy**.
2. **Configure the app**: `cp apps/.env.example apps/.env.local` and fill the values above.
3. **Run the app**:
   ```bash
   cd apps
   npm install
   npm run dev
   ```
4. Open the app, give it a CSV URL, and view / download the generated dashboard.

To try the flow without the app, call its API with the test input above and open the returned `dashboardHtml` in a browser.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Extract returns no rows | `fileUrl` not reachable, not a CSV, or login-gated | Use a public, direct-download CSV URL. |
| `validated: false` banner | Cleaning would have degraded the data | Expected safety behavior — the dashboard is built on the original data; check the banner's reason. |
| Empty / fewer charts | Some planned analyses were rejected by a gate | The findings gate drops analyses with invalid chart data; the rest still render. |
| Dashboard blank in an iframe | CSP blocking the Chart.js CDN | Serve the HTML where the jsdelivr CDN is allowed (a normal browser tab works). |
