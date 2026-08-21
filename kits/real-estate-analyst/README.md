# Real Estate Investment Analyst

**Gap:** Real estate and logistics are unrepresented industries in the AgentKit
registry. Investors currently do rental-property math by hand in spreadsheets.

## What it does

Ingests a property list from Google Sheets, runs deterministic financial
calculations (NOI, Cap Rate, Cash-on-Cash Return, DSCR, GRM, mortgage
amortization) in `scripts/calculations.ts`, then passes those computed metrics
to an LLM which writes an investor-grade brief with a Buy / Hold / Pass
verdict. The Next.js app renders a sortable table with an expandable brief
per property.

## Architecture
## Setup

1. `cd apps && npm install`
2. Copy `.env.example` to `apps/.env.local` and fill in `LAMATIC_CONFIG_REALESTATE`
   (a base64-encoded JSON blob of your Lamatic project's `api` credentials and
   `flows` map), `PROPERTY_SHEET_ID`, and `GOOGLE_SHEETS_API_KEY`.
3. Deploy `flows/property-analysis-flow.ts` in Lamatic Studio.
4. `npm run dev` inside `apps/` to run the frontend locally.

## Formulas

| Metric | Formula |
|---|---|
| NOI | Effective Gross Income − Operating Expenses |
| Cap Rate | NOI / Purchase Price |
| Cash-on-Cash Return | Annual Cash Flow / Cash Invested |
| DSCR | NOI / Annual Debt Service (>1.25 generally healthy) |
| GRM | Purchase Price / Gross Annual Rent (lower is generally better) |

## Disclaimer

Informational analysis only. Not licensed financial, investment, tax, or
legal advice.
