# LLM Silent Failure Detector — App

Next.js frontend for the `llm-silent-failure-detector` Lamatic flow. Paste a batch of LLM interaction logs and get back a report of grounding failures and schema violations, clustered into named failure modes.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   - `LAMATIC_FLOW_ID` — the deployed flow's ID (Studio → your flow → detail panel)
   - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — from Studio → Settings

3. Run locally:

   ```bash
   npm run dev
   ```

## How it works

- `app/page.tsx` — log input form and failure report display
- `actions/orchestrate.ts` — server action that sends the log batch to the deployed flow and returns the parsed report
- `lib/lamatic-client.ts` — Lamatic SDK client, initialized from environment variables

The flow itself does the actual work (grounding check, schema validation, clustering, naming) — this app is a thin interface on top of it.
