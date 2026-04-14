# EDA ML Readiness Assessment Flow

Scores the dataset's ML readiness (0–100) and generates an actionable preprocessing checklist.

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `datasetSummary` | Object | Computed dataset summary |
| `schemaInsights` | String | Markdown output from `eda-schema-analysis` flow |
| `statisticalInsights` | String | Markdown output from `eda-statistical-insights` flow |

## Output

Markdown report containing:
- ML Readiness Score (0–100) with dimension breakdown
- Suggested ML tasks (classification, regression, clustering, etc.)
- Recommended target variable(s) with reasoning
- Ordered preprocessing checklist (imputation, encoding, scaling, outlier handling)
- Potential pitfalls (leakage, imbalance, multicollinearity)
- Concrete next steps

## Setup in Lamatic Studio

1. Create a new flow → trigger: **API Request**
2. Set input schema: `datasetSummary` (Object), `schemaInsights` (String), `statisticalInsights` (String)
3. Add a **Generate Text** node — copy prompts from `config.json`
4. Wire output to **API Response** node
5. Deploy and copy the **Flow ID** → set as `EDA_ML_READINESS_FLOW_ID` in `.env.local`
