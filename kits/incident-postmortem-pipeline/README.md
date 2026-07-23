# Incident Postmortem Pipeline

Turns raw, unstructured incident logs into a ranked, evidence-graded root-cause analysis, an immediate mitigation checklist, a plain-English stakeholder update, and an assembled postmortem draft — no runbooks, incident ID, or repo access required. Just paste the raw log dump.

## Why this is different from a triage chatbot

Most incident tools assume the noisy part is already done — you already have an alert, an incident ID, maybe a repo to check commits against. This kit works one step earlier: it takes the raw, messy log stream itself and does the structuring work first.

Every root-cause hypothesis is graded — **Evidence-based**, **Inferred**, or **Unknown** — with reasoning tied to specific log lines, so the output is calibrated rather than a single overconfident guess.

## Architecture
API Request (logs, serviceName, recentDeployTime)
→ Log Extractor (structures raw logs, no root-cause speculation)
→ Root Cause Ranker (ranked hypotheses, tagged Evidence-based / Inferred / Unknown)
├→ Mitigation Checklist
└→ Stakeholder Summary
→ Postmortem Assembler (combines all of the above, preserves evidence tags)
→ API Response (postmortem markdown)

## Setup

### 1. Build the flow in Lamatic Studio

The flow lives in [`flows/incident-postmortem-pipeline.ts`](./flows/incident-postmortem-pipeline.ts). Import it into [Lamatic Studio](https://studio.lamatic.ai), set a model on each of the 5 LLM nodes, and **Deploy** the flow. Copy the deployed **Flow ID**.

### 2. Run the app

```bash
cd kits/incident-postmortem-pipeline/apps
cp .env.example .env.local     # fill in the values below
npm install
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Where to find it |
|---|---|
| `LAMATIC_FLOW_ID` | Studio → deploy the flow → copy Flow ID |
| `LAMATIC_API_URL` | Studio → Settings → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |

## Try it

1. Paste a raw log dump (multiple services, mixed errors/warnings, a deploy timestamp).
2. Get back ranked root causes with evidence tags, a mitigation checklist, a stakeholder summary, and a full postmortem draft.

## Design notes

- **Evidence discipline is the core design choice.** The extractor is barred from speculating on root cause; the ranker must tag every hypothesis by evidence strength and justify it with specific log signals; the assembler preserves those tags rather than smoothing them into uniform confident prose.
- **No structured input assumed.** Unlike tools that start from an alert + incident ID + runbook corpus, this kit's only required input is the raw log text itself.

Built on [Lamatic](https://lamatic.ai).