# FabLens — Fabric Impact Analyzer

FabLens lets you paste a clothing product URL and instantly understand what it's made of—and how those materials impact your skin and the environment.

It combines a structured material database with AI analysis to give clear, explainable insights.

---

## What It Does

- Extracts materials from product pages using Lamatic workflows
- Normalizes and deduplicates material data
- Scores materials across:
  - 🌱 Environmental impact (biodegradability, water usage, chemical processing)
  - 🧴 Skin safety (breathability, irritation risk)
- Uses a **hybrid scoring system**:
  - Known materials → local database
  - Unknown materials → AI analysis fallback
- Displays transparent positives and negatives

---

## Tech Stack

- **Lamatic** — workflow orchestration + LLM execution (GraphQL API)
- **Firecrawl** — webpage content extraction
- **Next.js (App Router)** — frontend + API routes
- **Tailwind CSS** — styling
- **Groq (llama-4-scout)** — AI inference

---

## Setup

```bash
cd kits/fablens/apps
cp .env.example .env.local
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LAMATIC_API_KEY` | Your Lamatic API key from studio.lamatic.ai |
| `FABLENS_WORKFLOW_ID` | Workflow ID used by the FabLens Lamatic step |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID |
| `LAMATIC_WORKFLOW_ID` | Workflow ID used for material extraction |
| `LAMATIC_SCORING_WORKFLOW_ID` | Workflow ID used for unknown-material scoring fallback |
| `LAMATIC_HOST` | Your Lamatic GraphQL endpoint (e.g. https://<org>.lamatic.dev/graphql) |

## Supported Sites

Works best with product pages that clearly list materials:

- BIBA
- Patagonia
- Independent/D2C brands

## Future Plans

- Percentage-weighted scoring
- Improved compound material handling
- Expanded material database
- Support for furniture & cosmetics
- Image-based material detection

## Limitations

- Sites with bot protection (e.g. H&M, Amazon) may fail
- Missing material data → no analysis
- Compound materials (e.g. polycotton) may not always resolve accurately
- No percentage-weighted scoring
