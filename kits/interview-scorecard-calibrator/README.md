# Interview Scorecard Calibrator

Reconcile multi-interviewer panel feedback into a calibrated hiring scorecard.

## Problem

After a panel interview, hiring managers receive fragmented notes — different formats, uneven scoring rigor, and conflicting opinions. Reconciling them into a fair hire/no-hire decision is slow and inconsistent.

## Solution

Paste a role rubric and interviewer notes. The Lamatic flow returns:

- Per-competency calibrated scores with evidence
- Interviewer disagreement map
- Hire / lean-hire / lean-no / no-hire recommendation + confidence
- Follow-up questions for missing evidence
- Internal decision-summary email draft
- A markdown hiring-committee brief

## Why this kit is unique

Unlike resume screeners (`hiring`, `hiring-copilot-agent`, `candidate-screener`) or candidate self-reflection coaches (`interview-reflection-coach`), this kit focuses on **post-panel calibration** for hiring managers.

## Providers & Prerequisites

- Lamatic account + deployed flow (import or rebuild from this kit)
- LLM provider configured in Lamatic Studio (Gemini / OpenAI / etc.)
- Node.js 20.9+

## Setup in Lamatic Studio

1. Create a project in [studio.lamatic.ai](https://studio.lamatic.ai)
2. Recreate the flow from `flows/calibrate-scorecard.ts` (or import if your Studio supports kit import)
3. Attach prompts from `prompts/`, model configs from `model-configs/`, and the normalize script from `scripts/`
4. Bind a text generation model on both LLM nodes
5. Deploy the flow and copy the **Flow ID**

## Run locally

```bash
cd kits/interview-scorecard-calibrator/apps
cp .env.example .env.local
# fill in LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY, CALIBRATE_SCORECARD_FLOW_ID
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy either kit-root `.env.example` or `apps/.env.example` into `apps/.env.local`.

| Variable | Description |
|---|---|
| `LAMATIC_API_URL` | Lamatic API endpoint |
| `LAMATIC_PROJECT_ID` | Project ID |
| `LAMATIC_API_KEY` | API key |
| `CALIBRATE_SCORECARD_FLOW_ID` | Deployed flow ID for `calibrate-scorecard` |

## Interviewer notes format

Provide **at least two** interviewer entries, separated by:

- a line containing only `---`, and/or
- headings like `Interviewer 1:` / `Interviewer 2 (Bob, Eng Manager):`

Requests with fewer than two interviewer blocks are rejected before the model runs.

## Sample input

**Job title:** Senior Backend Engineer  
**Level:** L5  

**Rubric:**
```
System Design (High): scalable services, tradeoffs, reliability
Coding (High): correctness, clarity, edge cases
Ownership (Medium): end-to-end delivery, communication
```

**Interviewer notes:**
```
Interviewer 1 (Alice, Staff Eng):
Strong system design around caching and failover. Coding solid but a bit slow. Ownership examples were concrete. Score: Design 4, Coding 3, Ownership 4.

---

Interviewer 2 (Bob, Eng Manager):
Design felt hand-wavy on consistency. Coding was clean. Concerned about stakeholder communication. Score: Design 2, Coding 4, Ownership 2.
```

## Deploy

Use the Vercel deploy link in `lamatic.config.ts` (`links.deploy`) with `root-directory=kits/interview-scorecard-calibrator/apps`.

## Project structure

```
kits/interview-scorecard-calibrator/
├── lamatic.config.ts
├── agent.md
├── README.md
├── constitutions/default.md
├── flows/calibrate-scorecard.ts
├── prompts/
├── model-configs/
├── scripts/
└── apps/                  # Next.js UI
```
