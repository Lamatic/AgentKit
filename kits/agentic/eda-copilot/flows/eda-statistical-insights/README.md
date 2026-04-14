# EDA Statistical Insights Flow

Interprets statistical distributions, highlights correlations, and flags outlier-prone columns.

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `datasetSummary` | Object | Computed summary including per-column stats, skewness, and correlation hints |
| `schemaInsights` | String | Markdown output from the `eda-schema-analysis` flow |

## Output

Markdown report containing:
- Distribution analysis per numeric column (shape, skewness, tail behaviour)
- Top correlation highlights and their modeling implications
- Outlier assessment based on IQR vs min/max ranges
- Categorical imbalance and high-cardinality warnings
- 3–5 key findings summary

## Setup in Lamatic Studio

1. Create a new flow → trigger: **API Request**
2. Set input schema: `datasetSummary` (Object), `schemaInsights` (String)
3. Add a **Generate Text** node — copy prompts from `config.json`
4. Wire output to **API Response** node
5. Deploy and copy the **Flow ID** → set as `EDA_STATISTICAL_INSIGHTS_FLOW_ID` in `.env.local`
