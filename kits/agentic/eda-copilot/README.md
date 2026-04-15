# EDA Copilot — AI-Powered Exploratory Data Analysis

> Upload any CSV. Get instant AI-powered statistical insights, correlation analysis, outlier detection, and ML readiness assessment — all powered by [Lamatic.ai](https://lamatic.ai) flows.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/eda-copilot)

---

## What It Does

EDA Copilot is a data scientist's shortcut from raw CSV to actionable insights. Instead of writing pandas code, you drop a file and a three-stage Lamatic.ai agent pipeline does the work:

| Stage | Flow | What it does |
|-------|------|--------------|
| 1 | Schema Analysis | Detects column types, missing data, and data quality issues |
| 2 | Statistical Insights | Interprets distributions, correlations, and outliers |
| 3 | ML Readiness | Scores dataset and generates preprocessing recommendations |

The client-side engine computes raw statistics (mean, std, quartiles, correlation matrix, skewness) and sends a compact summary payload to Lamatic — keeping API costs low even for large files.

---

## Demo

![EDA Copilot Screenshot](public/preview.png)

Try it live → **[agent-kit-eda-copilot.vercel.app](https://agent-kit-eda-copilot.vercel.app)**

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/agentic/eda-copilot
npm install
```

### 2. Set up Lamatic flows

1. Sign up at [lamatic.ai](https://lamatic.ai)
2. Import each flow from the `/flows` directory into your Lamatic project
3. Copy each flow's ID into `.env.local`

```bash
cp .env.example .env.local
```

```env
LAMATIC_API_URL=https://your-project.lamatic.ai/api/v1
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_API_KEY=your-api-key

EDA_SCHEMA_ANALYSIS_FLOW_ID=your-schema-analysis-flow-id
EDA_STATISTICAL_INSIGHTS_FLOW_ID=your-statistical-insights-flow-id
EDA_ML_READINESS_FLOW_ID=your-ml-readiness-flow-id
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and drop a CSV file to start analyzing.

---

## Lamatic Flow Setup

The `/flows` directory contains three JSON files describing each flow's logic. To set them up in Lamatic Studio:

1. **Go to your Lamatic project → Flows → New Flow**
2. Use the `systemPrompt` and `userPromptTemplate` from each flow JSON as your LLM node configuration
3. Set the input schema to match the `inputs` field in each flow JSON
4. Deploy the flow and copy its Flow ID to `.env.local`

### Flow Prompts at a Glance

**Flow 1 — Schema Analysis** (`eda-schema-analysis.json`)
- Input: `datasetSummary` (object), `fileName` (string)
- Output: Markdown schema report with data quality score

**Flow 2 — Statistical Insights** (`eda-statistical-insights.json`)
- Input: `datasetSummary` (object), `schemaInsights` (string from Flow 1)
- Output: Markdown insights on distributions, correlations, outliers

**Flow 3 — ML Readiness** (`eda-ml-readiness.json`)
- Input: `datasetSummary`, `schemaInsights`, `statisticalInsights` (from Flows 1 & 2)
- Output: ML readiness score 0–100 + preprocessing checklist

---

## Architecture

```
┌─────────────────────────────────────────────┐
│               Browser (Next.js)              │
│                                              │
│  CSV Upload → PapaParse → computeSummary()  │
│        ↓ (compact stats payload)            │
│  /api/analyze?step=schema                   │
│       ↓                                     │
│  /api/analyze?step=statistical              │
│       ↓                                     │
│  /api/analyze?step=mlReadiness              │
│       ↓                                     │
│  Results rendered with Recharts + Markdown  │
└──────────────┬──────────────────────────────┘
               │ REST API calls
┌──────────────▼──────────────────────────────┐
│            Lamatic.ai Flows                  │
│                                              │
│  Flow 1: Schema Analysis (LLM node)         │
│  Flow 2: Statistical Insights (LLM node)    │
│  Flow 3: ML Readiness (LLM node)            │
└─────────────────────────────────────────────┘
```

**Key design decision:** All heavy computation (statistics, correlations, skewness) runs client-side in the browser using pure TypeScript. Only a compact JSON summary is sent to Lamatic flows — this keeps token usage low and makes the app fast even for 100k+ row datasets.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **CSV Parsing**: PapaParse (client-side, zero server load)
- **Charts**: Recharts
- **Markdown**: react-markdown
- **AI Orchestration**: Lamatic.ai (3 sequential LLM flows)

---

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/agentic/eda-copilot)

You'll be prompted to set the environment variables during deployment.

---

## Project Structure

```
eda-copilot/
├── app/
│   ├── api/analyze/route.ts   # Lamatic flow API gateway
│   ├── layout.tsx
│   ├── page.tsx               # Main UI
│   └── globals.css
├── actions/
│   └── orchestrate.js         # Flow definitions & API config
├── components/
│   ├── FileUpload.tsx          # Drag-and-drop CSV uploader
│   ├── DataPreview.tsx         # Column chips + sample table
│   ├── AnalysisProgress.tsx    # Step-by-step progress tracker
│   └── AnalysisResults.tsx     # Full results with charts
├── lib/
│   └── utils.ts               # Client-side EDA engine
├── flows/
│   ├── eda-schema-analysis.json
│   ├── eda-statistical-insights.json
│   └── eda-ml-readiness.json
├── config.json                # Kit metadata
├── .env.example
└── README.md
```

---

## License

MIT — part of the [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) open-source collection.
