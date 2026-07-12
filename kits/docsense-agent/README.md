# DocSense — Adaptive Document-Intake Agent

**Reads each document a client sends and tells you what they still owe you — instead of relying on a checklist frozen on day one.**

## The problem

When an accountant collects documents from a client, the hard part isn't the paperwork. It's that you never really know the full list of what you need until you start reading what the client sends.

- A bank statement shows a **foreign payment** → now you need an extra tax form.
- There's a **large cash deposit** → now you need a source-of-funds note.
- A **new vendor** appears → now you need to verify their tax registration.

None of that is on the day-one list. It only appears once someone actually reads the documents — and today that depends entirely on one experienced person's memory. When they're busy, it gets missed and surfaces at the worst possible time: days before a filing deadline.

## What DocSense does

DocSense reads each document as it arrives and updates a living list of what's still outstanding.

- **New client** → it builds the requirement list up as documents come in, adding new needs the moment a document reveals them.
- **Returning client** → it stays quiet on the routine stuff it has handled for years, and only speaks up when something is *different this time* (a property sale, an unusually large deposit that wasn't there last year).

The one question it answers that a reminder bot, an OCR tool, or a file portal cannot: **"What does this document tell me I'm still missing?"**

## How it works

DocSense splits the work between the LLM and deterministic code — on purpose.

```
Document arrives
      │
      ▼
[ Lamatic flow: docsense-intake ]
  API Request → extraction (LLM) → reasoning (LLM) → API Response
      │
      ▼
[ App: deterministic state model ]
  • maintain the living requirement list
  • for returning clients, diff against the historical baseline
  • keep an explainable "why is this required?" trail
```

- The **flow** does the fuzzy work: reading a messy document into structured facts, then proposing what those facts imply.
- The **code** (`apps/lib/requirement-state.ts`) does the work that must be reproducible: tracking state, deduping, and diffing returning clients against their baseline. A requirement's justification is always traceable to the exact fact that triggered it — never a hallucinated verdict.

## Example

Input — a bank statement mentioning a USD 5,000 foreign remittance and a large cash deposit — produces:

```json
{
  "triggers": [
    {
      "requirementId": "form-15ca-cb",
      "label": "Form 15CA/CB for Foreign Remittance",
      "reason": "Foreign payment of USD 5000 on 2026-03-12."
    },
    {
      "requirementId": "source-of-funds-declaration",
      "label": "Source of Funds Declaration",
      "reason": "Large cash deposit of 800000 on 2026-03-18."
    }
  ]
}
```

Two documents the accountant still needs — surfaced automatically, each with its evidence cited.

## Run it locally

```bash
cd kits/docsense-agent/apps
cp .env.example .env.local     # fill in your Lamatic values
npm install
npm run dev
```

Required environment variables (see `.env.example`):

| Variable | What it is |
| --- | --- |
| `DOCSENSE_INTAKE` | Flow ID of the deployed `docsense-intake` flow |
| `LAMATIC_API_URL` | Your Lamatic project endpoint |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID |
| `LAMATIC_API_KEY` | Your Lamatic API key |

## Structure

```
docsense-agent/
├── flows/docsense-intake.ts        # the deployed flow (extraction → reasoning)
├── prompts/                        # externalized node prompts
├── model-configs/                  # LLM node configs
├── constitutions/default.md        # guardrails
├── lamatic.config.ts               # kit metadata
└── apps/                           # Next.js app
    ├── actions/orchestrate.ts      # calls the flow, runs the state model
    └── lib/requirement-state.ts    # the living requirement engine
```

## Design note

Novelty here isn't a new model or a bigger pipeline. It's a new *unit of work*: the outstanding-requirement list as a living object that documents mutate, rather than a static checklist a human maintains by memory. That shift — from "store and remind" to "read and infer" — is the whole product.