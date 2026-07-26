# Know Thy Person — Agent

## Overview
A meeting-prep research agent. Given a person's email and name (and, optionally, a
link to their LinkedIn / X / company or personal site), it produces a fully-sourced
dossier to help you build genuine rapport before a scheduled meeting.

## Purpose
Before a meeting you want to know the *person*, not just their title — enough to open
warmly and human. Doing this by hand doesn't scale, and the worst outcome is a *wrong*
fact stated with confidence. This agent leads with the non-work / rapport angle and is
built to **never fabricate**: every rendered claim carries a source URL, and anything it
can't verify is surfaced as "couldn't confirm" instead of invented.

## Flow: `know-thy-person`
- **Trigger (API Request):** `email` (required), `name` (required), `person_context`
  (optional — their company or personal website URL; a LinkedIn/X link isn't crawlable but
   still helps pin the right person).
- **Processing:**
  1. **Resolve** (code, no LLM) — deterministically parses company/domain from the email
     (no model call). Generic providers (gmail, outlook, …) resolve to no company, by design.
  2. **Serper** — live web search over the person's public presence.
  3. **Firecrawl** — crawls the most relevant public pages (personal/company sites, press,
     talks, profiles) for source-attributable content.
  4. **Synthesize** (`gemini-2.5-flash`) — converts the sourced material into a strict
     dossier JSON where every identity / outside-work / talking-point item carries a
     `source_url`.
- **Response (API Response):** `answer` — the dossier object (see README for the schema).
- **When to use:** ahead of a 1:1, sales call, interview, or intro where rapport matters.
- **Output:** `{ result: { answer: <dossier> } }`.

## Guardrails
- Cites or stays silent — never fabricates facts about a real person.
- Public information only. This is meeting prep, not surveillance.
- LinkedIn and X are **not** scraped directly (anti-bot walls); facts about them are used
  only when they surface in public search/crawl results.
- Data-broker / people-search aggregator sites are blacklisted as sources.
- Low-footprint people correctly return sparse, honest results.

## Integration Reference
- **Serper** — web search (configured in Lamatic Studio).
- **Firecrawl** — page crawling (configured in Lamatic Studio).
- **OpenRouter** — serves `gemini-2.5-flash` for the Synthesize node (the only LLM in the
  flow; Resolve is deterministic code). Configured in Lamatic Studio, not in the app.

## Environment Setup
| Var | Source / purpose |
|---|---|
| `KNOW_THY_PERSON` | Deployed flow ID (Studio → Flow → Details). |
| `LAMATIC_API_URL` / `LAMATIC_PROJECT_ID` / `LAMATIC_API_KEY` | Studio → Settings → API Keys. |

## Quickstart
1. `cd kits/know-thy-person/apps`
2. `cp .env.example .env.local` and fill in the four values above.
3. `npm install --legacy-peer-deps`
4. `npm run dev` → open http://localhost:3000

## Inputs
- `email` (required), `name` (required), `person_context` (optional URL).

## Output
- `answer`: a dossier object (see README for the schema).
