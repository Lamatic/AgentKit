# DocSense — Adaptive Document-Intake Agent

<p align="center">
  <a href="https://lamatic.ai" target="_blank">
    <img src="https://img.shields.io/badge/Built%20with-Lamatic.ai-black?style=for-the-badge" alt="Built with Lamatic.ai" />
  </a>
</p>

**DocSense** is an agentic document-intake kit for accountants, built with [Lamatic.ai](https://lamatic.ai). It reads each client document as it arrives and infers what's still missing — instead of relying on a static checklist. The LLM proposes; a deterministic state model records, dedupes, and diffs — so every requirement is explainable, never hallucinated.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/docsense-agent/apps&env=DOCSENSE_INTAKE,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20keys%20are%20required.&envLink=https://lamatic.ai)

## The Problem

You never know the full list of documents you need until you start reading what the client sends. A foreign payment means an extra tax form; a large cash deposit means a source-of-funds note; a property sale over ₹50 lakh means a TDS filing. Today that depends on one person's memory.

## What It Does

DocSense reads each document, extracts the facts, and proposes new requirements the document triggers — each with cited evidence. For returning clients it stays quiet on routine items and surfaces only what's different this year.

- **Newly required** — requirements this document just triggered, with the fact that triggered each one.
- **Still outstanding** — baseline requirements not yet satisfied.

## Architecture

DocSense splits fuzzy reasoning from deterministic bookkeeping:

- **Lamatic flow (`docsense-intake`)**: `API Request → extraction → reasoning → API Response`. The extraction node identifies document type and pulls structured facts; the reasoning node proposes satisfied and newly-triggered requirements as JSON.
- **Deterministic state model (`apps/lib/requirement-state.ts`)**: tracks the living requirement list, applies documents with an evidence trail, dedupes against what's already required, and diffs returning clients against their baseline.

The LLM proposes; the state model records and diffs. That split is what keeps every "why is this required?" answer explainable.

## Setup

1. **Deploy the flow** in [Lamatic Studio](https://studio.lamatic.ai) and note the flow ID.
2. **Configure environment variables** — copy `.env.example` to `.env.local` in `apps/` and fill in:

```
   DOCSENSE_INTAKE="<your docsense-intake flow ID>"
   LAMATIC_API_URL="<your Lamatic API URL>"
   LAMATIC_PROJECT_ID="<your Lamatic project ID>"
   LAMATIC_API_KEY="<your Lamatic API key>"
```
3. **Run the app**:

```bash
   cd kits/docsense-agent/apps
   npm install
   npm run dev
```

   Open [http://localhost:3000](http://localhost:3000), paste a client document, and click **Analyze document**.

## Structure

```
kits/docsense-agent/
├── flows/
│   └── docsense-intake.ts        # Lamatic flow definition
├── prompts/                      # extraction + reasoning prompts
├── model-configs/                # generative model configuration
├── constitutions/                # agent constitution
├── apps/
│   ├── actions/orchestrate.ts    # server-side flow orchestration + parsing
│   ├── lib/requirement-state.ts  # deterministic requirement-tracking logic
│   ├── lib/lamatic-client.ts     # Lamatic client + env validation
│   └── app/                      # Next.js UI
├── lamatic.config.ts
└── README.md
```

## Built With

A two-node Lamatic flow (extraction → reasoning) and a Next.js app. Tested end-to-end.