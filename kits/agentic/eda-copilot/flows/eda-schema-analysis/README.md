# EDA Schema Analysis Flow

Analyzes a CSV dataset's column schema and produces a structured data quality report.

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `datasetSummary` | Object | Computed summary from client-side EDA utility (column stats, missing %, etc.) |
| `fileName` | String | Name of the uploaded CSV file |

## Output

Markdown report containing:
- Dataset overview and quality rating (Poor / Fair / Good / Excellent)
- Column-by-column semantic type inference and quality notes
- Specific data quality issues flagged
- Data Quality Score (0–100)

## Setup in Lamatic Studio

1. Create a new flow → trigger: **API Request**
2. Set input schema: `datasetSummary` (Object), `fileName` (String)
3. Add a **Generate Text** node — copy the system/user prompts from `config.json`
4. Wire output to **API Response** node
5. Deploy and copy the **Flow ID** → set as `EDA_SCHEMA_ANALYSIS_FLOW_ID` in `.env.local`
