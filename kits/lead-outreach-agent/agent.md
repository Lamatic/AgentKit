# Lead Outreach Agent

## Overview
This kit solves a small but painful sales/BD problem: writing a cold email that actually sounds researched. Given just a lead's **name**, **company**, and **website**, the agent reads the company's own site, understands what they do, and drafts a short, personalized cold email plus a follow-up — in the tone you choose. It is a **single-flow** AgentKit pipeline invoked by a Next.js web UI (or any backend) via Lamatic's API layer.

The problem it removes is the manual loop most people run before every cold email: open the prospect's site, skim it, figure out an angle, write a draft, then write a follow-up. That is 5–10 minutes per lead and it does not scale. This agent grounds the copy in the prospect's real website content so the email references something specific instead of sounding generic.

## Purpose
The goal is a reliable "lead in → outreach out" endpoint. After it runs, the caller has a ready-to-send draft: a subject line, a personalized email body, and a follow-up message. The application stays thin — all the prompt logic, model choice, and web-grounding live in one deployed Lamatic flow, so the copy behavior can be tuned in Lamatic Studio without touching the app.

## Flows

### `1. Lead Outreach Agent`

- **Flow ID / env-key mapping:** `lead-outreach-agent` (configured via `LEAD_OUTREACH_AGENT`)

#### Trigger
- **Invocation type:** API request (GraphQL trigger node), called from the Next.js server action.
- **Expected input shape:**
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `name` | `string` | Yes | The lead / contact's name. |
  | `company` | `string` | Yes | The lead's company name. |
  | `website` | `string` | Yes | The company's website URL — used to ground the copy. |
  | `tone` | `string` | Yes | Desired tone: e.g. `friendly`, `formal`, `direct`, `playful`. |

#### Processing
1. **Scrape / crawl** the `website` (Firecrawl node) to pull the company's public content.
2. **LLM** node takes the scraped context + lead details + tone and produces a JSON object with a subject, a personalized email, and a follow-up.
3. **Response** node returns the result under a single `answer` field.

#### Output
| Field | Type | Description |
|---|---|---|
| `answer` | `object` | `{ "subject": string, "email": string, "followUp": string }` — the ready-to-send draft. |

## Dependencies
- **Upstream flows:** none — this is a standalone entry-point flow.
- **External services:** a web-scraping provider (Firecrawl) and an LLM provider, both connected in Lamatic.
- **Consumer:** the Next.js app in `apps/`, which reads the `answer` object and renders the subject, email, and follow-up with copy buttons.

## Guardrails
See [`constitutions/default.md`](./constitutions/default.md). The agent only drafts outreach copy, never sends anything on its own, and does not fabricate facts about the prospect beyond what the website supports.
