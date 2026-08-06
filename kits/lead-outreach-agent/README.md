# Lead Outreach Agent

Turn a single lead into a personalized cold email — in seconds.

Give the agent a prospect's **name**, **company**, and **website**, pick a **tone**, and it drafts a **cold email + follow-up** that opens with a specific, relevant observation about the company. Built as a [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) **kit** (one Lamatic flow + a Next.js app).

## Why

Writing a good cold email means researching the prospect and drafting both the email and a follow-up — a few minutes per lead that doesn't scale. This agent does the drafting for you and keeps the copy specific to the company instead of generic.

## How it works

```
name + company + website + tone
        │  (API Request)
        ▼
  [ Generate Text ]  ── Groq · llama-3.3-70b-versatile
        │              personalized, tone-matched, strict JSON
        ▼
  answer = { subject, email, followUp }   (API Response)
```

A single Lamatic flow does the drafting; the Next.js app is a thin UI that calls the flow and renders the result. See [`agent.md`](./agent.md) for the node-by-node breakdown.

## Run it locally

1. In [Lamatic Studio](https://studio.lamatic.ai), the flow is already built and deployed (this repo ships its exported config in `flows/`).
2. Grab your credentials from **Studio → Settings** and the deployed **Flow ID**.
3. Start the app:

```bash
cd apps
cp .env.example .env.local     # fill in your real values
npm install
npm run dev
```

Open http://localhost:3000, enter a lead, and generate.

### Environment variables (`apps/.env.local`)

| Key | Where to find it (Lamatic Studio) |
|---|---|
| `LEAD_OUTREACH_AGENT` | Deployed flow's **Flow ID** |
| `LAMATIC_API_URL` | Settings → API → **Endpoint** |
| `LAMATIC_PROJECT_ID` | Settings → **Project ID** |
| `LAMATIC_API_KEY` | Settings → **API Keys** |

## Deploy

Use the one-click Vercel deploy in [`lamatic.config.ts`](./lamatic.config.ts) (`links.deploy`), which points Vercel at `kits/lead-outreach-agent/apps` and prompts for the four env vars above.

## Guardrails

The agent only **drafts** copy — it never sends anything — and is instructed not to fabricate facts it isn't sure about. See [`constitutions/default.md`](./constitutions/default.md).

---

Built by **Rishav Jamwal** for the Lamatic AgentKit Challenge.
