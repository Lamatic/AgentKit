# Lead Outreach Agent

Turn a single lead into a researched cold email — in seconds.

Give the agent a prospect's **name**, **company**, and **website**, pick a **tone**, and it reads the company's own site, then drafts a personalized **cold email + follow-up** that references something real about them. Built as a [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) **kit** (one Lamatic flow + a Next.js app).

## Why

Writing a good cold email means researching the prospect first: open their site, skim it, find an angle, draft the email, draft the follow-up. That's 5–10 minutes per lead and it doesn't scale. This agent does the research-and-draft loop for you and grounds the copy in the prospect's real website content, so it never sounds generic.

## How it works

```
name + company + website + tone
        │
        ▼
  [ Firecrawl ]  ── scrape the company website
        │
        ▼
  [   LLM    ]  ── draft, grounded on the scrape + tone
        │
        ▼
  answer = { subject, email, followUp }
```

A single Lamatic flow does the scraping + drafting; the Next.js app is a thin UI that calls the flow and renders the result.

## Run it locally

1. **Build the flow in Lamatic Studio** (see [`agent.md`](./agent.md) for the node layout), deploy it, and export it (⋮ → Export) into `flows/`.
2. Grab your credentials from **Studio → Settings → API Keys** and the deployed **Flow ID**.
3. Start the app:

```bash
cd apps
cp .env.example .env.local     # fill in your real values
npm install
npm run dev
```

Open http://localhost:3000, enter a lead, and generate.

### Environment variables (`apps/.env.local`)

| Key | Where to find it |
|---|---|
| `LEAD_OUTREACH_AGENT` | Deployed flow's **Flow ID** |
| `LAMATIC_API_URL` | Settings → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Settings → Project → Project ID |
| `LAMATIC_API_KEY` | Settings → API Keys → Copy |

## Deploy

Use the one-click Vercel deploy in [`lamatic.config.ts`](./lamatic.config.ts) (`links.deploy`), which points Vercel at `kits/lead-outreach-agent/apps` and prompts for the four env vars above.

## Guardrails

The agent only **drafts** copy — it never sends anything — and it grounds personalization in the scraped site instead of fabricating facts. See [`constitutions/default.md`](./constitutions/default.md).

---

Built by **Rishav Jamwal** for the Lamatic AgentKit Challenge.
