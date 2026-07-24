# Phishing Triage — Web App

A Next.js analyst console for the Phishing Email Triage flow. Paste an email; it calls the deployed Lamatic flow and renders a colour-coded verdict, risk-score meter, indicators, and extracted URLs.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Description |
|---|---|
| `PHISHING_TRIAGE` | The deployed Phishing Triage flow ID (Lamatic Studio). |
| `LAMATIC_API_URL` | Your Lamatic project API URL. |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID. |
| `LAMATIC_API_KEY` | Your Lamatic API key. |

Get these from Lamatic Studio → **Settings** (credentials) and from your deployed flow (flow ID). Never commit `.env.local`.

## How it works

- `orchestrate.ts` reads the env vars and exposes `config` (API credentials + flow map).
- `lib/lamatic-client.ts` instantiates the Lamatic SDK client from that config.
- `actions/orchestrate.ts` is a server action that calls `executeFlow(PHISHING_TRIAGE, inputs)` and normalises the `answer` payload into a typed `Verdict`.
- `app/page.tsx` is the client console that collects the email and renders the verdict.

## Deploy

Use the **Deploy on Lamatic/Vercel** button in the kit README, or import `kits/phishing-triage/apps` into Vercel and set the four environment variables above.
