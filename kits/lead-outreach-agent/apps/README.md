# Lead Outreach Agent — App

The Next.js UI for the Lead Outreach Agent kit. It's a thin client: it collects the
lead details and calls the deployed Lamatic flow via a server action.

## Setup

```bash
cp .env.example .env.local     # fill in your real values
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Key | Where to find it (Lamatic Studio) |
|---|---|
| `LEAD_OUTREACH_AGENT` | Your deployed flow's **Flow ID** |
| `LAMATIC_API_URL` | Settings → API → Endpoint |
| `LAMATIC_PROJECT_ID` | Settings → Project ID |
| `LAMATIC_API_KEY` | Settings → API Keys |

## Structure

- `app/page.tsx` — the form + result UI (client component)
- `actions/generate.ts` — server action that calls the Lamatic flow
- `lib/lamatic-client.ts` — Lamatic SDK client
- `lib/config.ts` — maps env vars to the client + flow map
