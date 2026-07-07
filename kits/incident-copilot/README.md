# Incident Copilot

An **investigation agent** for on-call engineers. Paste a production alert and it does what a good teammate does in the first ten minutes of an incident: reads the runbooks, checks what shipped recently, and comes back with **ranked, evidence-grounded hypotheses** — each with the evidence *for* and *against* it, and a concrete next step. Feed it new information and it **revises the ranking** instead of starting over. When you're ready, it drafts the Slack update and a postmortem skeleton.

It investigates. It does not act — no deploys, no restarts, no posting. Drafts only.

> This is the companion to [`llm-eval-harness`](../llm-eval-harness): that kit gates **generation** quality, this one helps you **diagnose** a live incident.

---

## Why this is different from a chatbot

A chatbot answers the question you asked. Incident Copilot **gathers evidence, weighs it, and argues against itself** — the three things that make it an agent rather than a prompt:

1. **It grounds every hypothesis in real evidence** — runbook excerpts (RAG) and the actual recent commits on the affected repo (a live tool call), never a guess.
2. **It surfaces contradicting evidence, not just supporting** — the constitution makes "argue both sides" a hard rule, so you get a calibrated ranking, not a confident single answer.
3. **It gets smarter with new information** — memory is scoped to the incident ID, so a follow-up (“the DB pool is maxed”) *revises* the existing ranking and tells you what changed.

---

## Architecture

```
  Next.js app (apps/)                         Lamatic flows
  ─────────────────                           ─────────────
  paste alert + repo ─┐
                      │  investigate(alert, incidentId, repo)
                      ▼
  actions/orchestrate.ts ───────────────▶  flow: investigate
                      ▲                     ┌──────────────────────────────┐
                      │                     │ trigger (alertText,          │
                      │                     │   incidentId, repoUrl?)      │
                      │              ┌──────┼──▶ Runbook_RAG (RAG) ────┐    │
                      │              │      │   Parse_Repo (code)       │   │
                      │   ranked     │      │     └▶ Fetch_Commits (API)│   │
                      │   hypotheses │      │         └▶ Shape_Changes ─┤   │
                      │   + evidence │      │   Retrieve_Prior (memory)─┤   │
                      │              │      │                  (fan-in) ▼   │
                      │              │      │        Diagnose (Instructor   │
                      │              │      │          LLM, JSON schema)    │
                      │              │      │                    ▼          │
                      │              │      │        Remember (memory add)  │
                      │              │      └──────────────────────────────┘
                      │
                      │  draftComms(topHypothesis, evidence, …)
                      ▼
  actions/orchestrate.ts ───────────────▶  flow: draft-comms
                                            ┌──────────────────────────────┐
   Slack update  ◀───────────────────────  │ Draft_Slack (LLM, hedged)     │
   Postmortem    ◀───────────────────────  │ Draft_Postmortem (LLM)        │
                                            └──────────────────────────────┘
```

**AgentKit capabilities used — each doing real work, none decorative:**

| Capability | Where | Why it earns its place |
|---|---|---|
| **RAG** | `Runbook_RAG` | Grounds hypotheses in your runbooks instead of the model's memory |
| **Tool calling** | `Fetch_Commits` (`apiNode` → GitHub) | "Check recent deploys" becomes a real check, not a claim |
| **Memory** | `Retrieve_Prior` / `Remember`, keyed by incident ID | The one thing that makes re-investigation *revise* rather than repeat |
| **Structured output** | `Diagnose` (`InstructorLLMNode` + JSON schema) | Ranked hypotheses the UI can render, with guaranteed shape |
| **Multiple flows** | `investigate` + `draft-comms` | Separates "figure out what's true" from "write it up" |
| **Prompts / model-configs / constitution** | throughout | Diagnose runs at temp 0 (repeatable triage); drafts run warmer; the constitution enforces evidence + hedging |

---

## Flows

| Flow | Input | Output |
|---|---|---|
| `investigate` | `{ alertText, incidentId, repoUrl?, githubToken? }` | `{ hypotheses[], summary, insufficientInfo }` |
| `draft-comms` | `{ hypothesis, evidence, rankedHypotheses, incidentId }` | `{ slackUpdate, postmortem }` |

Each `hypothesis` is `{ rank, title, confidence, reasoning, supportingEvidence[], contradictingEvidence[], nextStep }`.

---

## Setup

### 1. Build the flows in Lamatic Studio

The two flows live in [`flows/`](./flows). Import them into [Lamatic Studio](https://studio.lamatic.ai), then:

- **`investigate`** — set the model on the `Diagnose` node (temperature **0**), the embedding + generative models and vector DB on `Runbook_RAG`, and a memory collection on `Retrieve_Prior` / `Remember`.
- **`draft-comms`** — set the models on `Draft_Slack` (~0.5) and `Draft_Postmortem` (~0.3).
- **Index the runbooks:** load [`assets/demo/runbooks.md`](./assets/demo/runbooks.md) (or your own) into the vector DB that `Runbook_RAG` queries. Each `##` section is one runbook entry.
- **Deploy** both flows and copy each **Flow ID**.

### 2. Run the app

```bash
cd kits/incident-copilot/apps
cp .env.example .env.local     # fill in the values below
npm install
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Where to find it |
|---|---|
| `INVESTIGATE_FLOW_ID` | Studio → deploy `investigate` → copy Flow ID |
| `DRAFT_COMMS_FLOW_ID` | Studio → deploy `draft-comms` → copy Flow ID |
| `LAMATIC_API_URL` | Studio → Settings → API |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → API Keys |
| `GITHUB_TOKEN` | *(optional)* raises GitHub rate limits / enables private repos. Read server-side only — never sent to the browser. |

---

## Try it

1. Click **Load example** — a realistically ambiguous checkout-latency incident (`INC-2043`).
2. Click **Investigate** — watch it retrieve runbooks, check changes, and return 2–4 ranked hypotheses with evidence.
3. In **New information**, the example pre-fills *“DB connections pegged at max, payment provider is green.”* Click **Add info & re-investigate** — the DB-pool hypothesis climbs, payment degradation drops, and each card explains what changed.
4. Click **Draft Slack + postmortem** — get a hedged status update and a blameless postmortem skeleton.

The example alert is deliberately ambiguous (latency + 5xx could be a bad deploy, DB pool exhaustion, a cache stampede, or payment degradation) so the ranking — and the revision — are meaningful rather than a keyword match.

---

## Design notes & tradeoffs

- **Drafts, never posts (v1).** No real Slack/PagerDuty write. The draft-vs-post line is a deliberate safety boundary for an agent that reasons under uncertainty, not a missing feature.
- **Graceful degradation.** No repo, a private repo without a token, or a GitHub rate-limit all resolve to “recent-changes unavailable” — the investigation continues on runbooks alone rather than failing.
- **Deterministic triage.** `Diagnose` runs at temperature 0 so the same alert + evidence yields the same ranking.
- **Defensive parsing.** Structured output is normalized app-side ([`lib/format.ts`](./apps/lib/format.ts)); a malformed field degrades to a safe default instead of crashing the page.
- **The runbook corpus is yours.** Swap [`assets/demo/runbooks.md`](./assets/demo/runbooks.md) for your team's runbooks — no code changes.

## Future work

Webhook-triggered auto-investigation from a real alert source; optional real Slack posting via an `apiNode`; multi-repo correlation; a feedback loop that tunes confidence based on which next step actually resolved the incident.

Built on [Lamatic](https://lamatic.ai).
