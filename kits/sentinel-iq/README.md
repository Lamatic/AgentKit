# SentinelIQ

Security incident triage agent built on Lamatic. Paste a raw alert, get a severity-scored, ATT&CK-mapped triage report.

## Setup
```bash
cd kits/sentinel-iq/apps
cp .example.env .env.local
npm install
npm run dev
```

Fill `.env.local` with your Lamatic API key, project ID, API URL, and `SENTINEL_TRIAGE_FLOW_ID`

## Flow
`flows/sentinel-triage.ts` — API trigger → IOC extraction code node → LLM triage node → API response