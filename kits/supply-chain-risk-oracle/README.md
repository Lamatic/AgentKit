# Supply Chain Risk Oracle

An autonomous AI agent that ingests a supplier list, scans global news and weather for disruption events, assigns a **Disruption Probability Score** to each supplier, and auto-drafts professional mitigation emails — all in one pipeline.

## The Problem

Global supply chains are vulnerable to geopolitical unrest, extreme weather, labor strikes, and port closures. Procurement teams learn about disruptions **after** they have already caused delays. This agent flips that — it monitors the world for you and surfaces risks before they hit your operations.

## What It Does

1. **Upload** a CSV or JSON file listing your suppliers (name, location, components supplied)
2. **Scan** — the agent searches live news, weather alerts, and geopolitical feeds for each supplier's region
3. **Score** — every supplier gets a Disruption Probability Score (0–100) with an explanation
4. **Dashboard** — see a color-coded risk matrix at a glance
5. **Draft** — for Critical/High-risk suppliers, the agent generates a professional supplier inquiry email ready for human review before sending

## Flows

| Flow | Purpose | Env Key |
|------|---------|---------|
| `supply-chain-scan` | Parses suppliers, searches for disruption events, returns scored risk matrix | `SUPPLY_CHAIN_SCAN_FLOW_ID` |
| `supply-chain-email-draft` | Generates a professional outreach email for a specific high-risk supplier | `SUPPLY_CHAIN_EMAIL_DRAFT_FLOW_ID` |

## Tech Stack

- **Platform:** Lamatic.ai (visual flow builder + edge-deployed GraphQL API)
- **Frontend:** Next.js 15, shadcn/ui, Tailwind CSS
- **LLM:** Configurable in Lamatic Studio (works with any provider — free tiers of Google Gemini or Groq recommended)
- **Web Search:** Configurable in Lamatic Studio (Tavily free tier recommended)

## Setup

### Prerequisites

- Node.js 18+
- A [Lamatic.ai](https://lamatic.ai) account (free tier works)
- Deployed flows (see below)

### 1. Build and Deploy Flows in Lamatic Studio

Sign in at [studio.lamatic.ai](https://studio.lamatic.ai) and create two flows:

#### Flow 1: Supply Chain Scan
- **Trigger:** API Request
- **Input fields:** `suppliers` (string — raw CSV or JSON), `scan_focus` (string — optional focus area)
- **Nodes:**
  1. `LLMNode` — Parse suppliers from raw input, output structured JSON array
  2. `LLMNode` (with web search tool) — For each supplier, search for disruption events near their location
  3. `LLMNode` — Score each supplier 0–100 and output full risk matrix JSON
- **Output:** `{ risk_matrix: [...], high_risk_suppliers: [...], scan_timestamp: "..." }`

#### Flow 2: Email Draft
- **Trigger:** API Request
- **Input fields:** `supplier_name`, `location`, `risk_score`, `risk_factors`, `components_supplied`
- **Nodes:**
  1. `LLMNode` — Generate professional supplier inquiry email
- **Output:** `{ email_subject: "...", email_body: "...", urgency_level: "..." }`

### 2. Get Your Credentials

From Lamatic Studio → **Settings**:
- `LAMATIC_API_KEY`
- `LAMATIC_PROJECT_ID`
- `LAMATIC_API_URL`

From each deployed flow's detail panel:
- `SUPPLY_CHAIN_SCAN_FLOW_ID`
- `SUPPLY_CHAIN_EMAIL_DRAFT_FLOW_ID`

> **API Keys for NewsAPI and OpenWeatherMap:** Store these as environment variables directly inside Lamatic Studio (open your flow → Settings → Environment Variables). Reference them in your API nodes as `{{env.NEWS_API_KEY}}` and `{{env.WEATHER_API_KEY}}`. This keeps them out of execution logs and away from the app layer.

### 3. Run Locally

```bash
cd kits/supply-chain-risk-oracle/apps
cp .env.example .env.local
# Fill in .env.local with your real values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

Click the deploy button or run:

```bash
vercel --cwd kits/supply-chain-risk-oracle/apps
```

## Sample Supplier CSV Format

```csv
name,location,lat,lng,components_supplied,tier
Apex Electronics,Shenzhen China,22.5431,114.0579,Microcontrollers,1
Pacific Textiles,Dhaka Bangladesh,23.8103,90.4125,Fabric,1
Euro Chemicals,Rotterdam Netherlands,51.9244,4.4777,Adhesives,2
```

## Risk Score Interpretation

| Score | Level | Color | Recommended Action |
|-------|-------|-------|--------------------|
| 80–100 | Critical | 🔴 Red | Immediate outreach + activate backup supplier |
| 60–79 | High | 🟠 Orange | Draft inquiry email + monitor daily |
| 40–59 | Elevated | 🟡 Yellow | Monitor every 48 hours |
| 0–39 | Normal | 🟢 Green | Standard monitoring cadence |

## License

MIT
