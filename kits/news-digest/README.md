# News Digest

A scheduled agent flow that scrapes multiple tech/AI news sources every morning, extracts and deduplicates genuine articles, ranks them by significance, and emails a clean, formatted digest — no manual triggering, no dashboard to check.

## What it does

Every day at 8:00 AM UTC, this flow:

1. Reads a configurable topic and story count from a central config node
2. Scrapes a fixed list of news sources in a single batch request
3. Extracts genuine articles (filtering out ads, nav menus, sponsored posts, and other page noise) and deduplicates stories that appear across multiple sources
4. Ranks the remaining stories by significance and selects the top N
5. Formats the result as a clean HTML email
6. Sends it via Gmail

The result is a single daily email — a short, readable digest instead of five browser tabs.

## Why this exists

Most "AI news" tools are either chat interfaces you have to remember to open, or raw RSS feeds with no filtering. This flow is passive: it runs on a schedule and delivers a finished result, so staying current doesn't require remembering to check anything.

## Architecture

```
Cron Trigger (daily, 8am UTC)
        │
        ▼
Variable Node (topic, top_n — single source of config truth)
        │
        ▼
Firecrawl (Sync Batch Scrape — multiple sources in one call)
        │
        ▼
Generate Text #1 — extraction & dedup
  (filters noise, removes duplicate stories across sources,
   outputs a clean JSON array of candidate articles)
        │
        ▼
Generate Text #2 — ranking & formatting
  (selects and ranks the top N stories, writes 2-sentence
   summaries, outputs ready-to-send HTML)
        │
        ▼
Gmail (sends the formatted digest)
```

The extraction and ranking steps are deliberately split into two LLM calls rather than one. Extraction/dedup and summarization/formatting are different jobs with different success criteria — combining them into a single prompt tends to produce worse results at both.

## News sources (default)

- techcrunch.com
- news.ycombinator.com
- theverge.com/tech
- arstechnica.com
- reuters.com/technology

Sources are configured as a comma-separated URL list in the Firecrawl node and can be edited directly there.

## Configuration

All user-facing settings live in a single **Variable Node**, so there's one place to change behavior without touching prompts or downstream nodes:

```json
{
  "topic": {
    "type": "string",
    "value": "AI/ML & Tech Companies"
  },
  "top_n": {
    "type": "number",
    "value": "10"
  }
}
```

| Field | Purpose |
|---|---|
| `topic` | Filters which articles are considered relevant during extraction, and appears in the email heading and subject line |
| `top_n` | Number of stories included in the final digest |

To change the topic or story count, edit these values in the Variable Node and redeploy — no prompt or code changes needed.

## Setup

1. **Connect credentials** for the three integrations this flow uses:
   - **Firecrawl** — API key, set on the Firecrawl node's `credentials` field
   - **Gemini** — API key, set on both Generate Text nodes (used for extraction and ranking)
   - **Gmail** — OAuth connection, set on the Gmail node's `credentials` field
2. **Set your recipient email.** Open the Gmail node and replace the `recipient_email` field with your own address. This is not read from a variable — you must edit it directly on the node before deploying, or the digest will be sent to the original author's inbox instead of yours.
3. **(Optional) Adjust the topic and story count** — edit `topic` and `top_n` in the Variable Node.
4. **(Optional) Adjust news sources** — edit the comma-separated URL list in the Firecrawl node's `urls` field.
5. **Deploy** the flow in Lamatic Studio. The Cron trigger fires automatically on its configured schedule (default: daily, 8:00 AM UTC) — no manual step needed after deployment.

## Design notes / tradeoffs

- **Single-recipient by design.** This flow is scoped for one user/inbox, not a multi-tenant subscription service. Multi-user support (per-user topics, a signup flow, persistent storage per user) was deliberately left out to keep the flow focused and easy to review — see `agent.md` for more on this decision.
- **Dedup happens before ranking, not after.** The first LLM call removes duplicate coverage of the same story across sources, so the ranking step never has to reason about near-identical entries competing for the same slot.
- **Config lives in one node.** Rather than scattering the topic string across multiple prompts, it's centralized in the Variable Node and referenced everywhere via `{{variablesNode_218.output.topic}}`.

## Known limitations

- Changing the topic or story count requires editing the Variable Node in Studio and redeploying — there's no end-user-facing settings UI. This is a direct consequence of the single-recipient scope described above.
