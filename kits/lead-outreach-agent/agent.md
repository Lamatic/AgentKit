# Lead Outreach Agent

## Overview
This kit solves a small but real sales/BD problem: writing a cold email that sounds researched instead of generic. Given a lead's **name**, **company**, and **website**, plus a **tone**, the agent drafts a short, personalized **cold email + follow-up** that opens with a specific, relevant observation about the company. It is a **single-flow** AgentKit pipeline invoked by a Next.js web UI (or any backend) via Lamatic's API layer.

## Purpose
The goal is a reliable "lead in → outreach out" endpoint. After it runs, the caller has a ready-to-send draft: a subject line, a personalized email body, and a follow-up. All prompt logic and model choice live in one deployed Lamatic flow, so the copy behavior can be tuned in Lamatic Studio without touching the app.

## Flow

### `1. Lead Outreach Agent` (3 nodes)

- **Flow ID / env-key mapping:** `lead-outreach-agent` (app env var `LEAD_OUTREACH_AGENT`)

| Node | Type | What it does |
|---|---|---|
| **API Request** | `graphqlNode` trigger | Accepts the request. Input schema: `name`, `company`, `website`, `tone` (all strings). |
| **Generate Text** | `LLMNode` (Groq · `llama-3.3-70b-versatile`) | Writes the outreach. The system prompt constrains it to a personalized email that references the company and never fabricates facts; it returns strict JSON. |
| **API Response** | `graphqlResponseNode` | Maps a single field `answer` = the LLM's JSON output. |

#### Input
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | The lead / contact's name. |
| `company` | string | Yes | The lead's company name. |
| `website` | string | Yes | The company's website URL. |
| `tone` | string | Yes | Desired tone: friendly, formal, direct, playful. |

#### Output
| Field | Type | Description |
|---|---|---|
| `answer` | object \| string | `{ "subject": string, "email": string, "followUp": string }` — the ready-to-send draft. |

## Grounding & honesty
The agent personalizes using what the model reliably knows about the company from its name and website, and is instructed **not to fabricate** specifics (funding, headcount, exact metrics). It only **drafts** copy — it never sends anything. Guardrails: [`constitutions/default.md`](./constitutions/default.md).

## Extending it
To ground the copy in live page content, add a **Web Search** or scraping node between the trigger and the LLM and feed its output into the prompt — the rest of the kit (app, config, response mapping) stays the same.
