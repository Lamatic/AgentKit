# Appeal Copilot

Paste an insurance claim denial letter. Get back a classified, deadline-aware, evidence-scored first-level appeal package — a category-specific draft letter, a strength score, and a concrete checklist of what would make it stronger.

<p align="center">
  <a href="#quickstart">
    <img src="https://img.shields.io/badge/Quickstart-black?style=for-the-badge" alt="Quickstart" />
  </a>
</p>

## Problem

Roughly 1 in 5 health-insurance claims gets denied, and most people who receive a denial never appeal — not because they're wrong, but because the process is confusing: the right argument depends on *why* the claim was denied, deadlines are easy to miss, and nobody tells you what evidence actually moves the needle. Generic template letters ignore the specific denial reason; a patient advocate costs real money; giving up is the most common outcome.

## Solution

A single Lamatic flow that:
1. **Classifies** the denial reason into `medical-necessity`, `administrative`, or `coverage` (or a general fallback).
2. **Extracts** the claim number, procedures, denial reason, and appeal deadline.
3. **Computes deadline urgency** so you know if you have 5 days or 50.
4. **Drafts a category-specific appeal letter** — a medical-necessity denial gets a peer-to-peer-review request; a missing-prior-authorization denial gets a retroactive-authorization request; an out-of-network denial gets a network-adequacy exception request. These are genuinely different arguments, not one template with find-and-replace.
5. **Scores the appeal's strength (1-10)** and lists exactly what evidence is missing, conservatively — the assessor never inflates a score based on assertions alone.

The result is a structured decision artifact, not a wall of generated text.

## Features
- Category-specific appeal strategies (medical necessity / administrative / coverage / general fallback), not a single generic template.
- Deadline urgency computed from the letter's own text.
- Conservative strength scoring with a concrete missing-evidence checklist.
- Runs in **demo mode** with no Lamatic account: three realistic example scenarios produce full mocked output so a reviewer can try the whole UX in under a minute.
- Copy-to-clipboard and download-as-`.txt` for the drafted letter.
- A visible "not medical or legal advice" disclaimer on every result — this tool prepares a first-level appeal, it does not replace professional review.

## Architecture

```
Next.js UI (apps/)
  → Server Action (actions/orchestrate.ts)
    → demo mode (no Lamatic credentials): mocked output from lib/demo-data.ts
    → live mode: Lamatic SDK executeFlow(APPEAL_ANALYSIS_FLOW_ID, { denialText, additionalContext })
      → Lamatic flow: appeal-analysis (flows/appeal-analysis.ts)
```

## Agent Workflow

```
API Trigger (denialText, additionalContext)
  → AI (schema-validated JSON): Extract & Classify → category, claim #, deadline, ...
  → Code: Deadline Urgency                         → daysRemaining, urgencyLevel
  → Condition: Category Branch                     → routes on denialCategory
      → AI: Draft (medical-necessity | administrative | coverage | default)
  → AI (schema-validated JSON): Assess Strength     → strengthScore, missingEvidence[], rationale
  → Code: Assemble Output
  → API Response { result: { ...structured fields } }
```

See [`agent.md`](./agent.md) for the full node-by-node breakdown, guardrails, and failure modes.

## A note on how this flow was built

This flow was built and tested end-to-end directly in Lamatic Studio — every node individually and the full pipeline, all passing. `Extract & Classify` and `Assess Strength` use Studio's schema-validated JSON node type (`InstructorLLMNode`), which returns typed fields directly rather than a raw string that needs re-parsing, so there's no separate "parse JSON" step in the graph. The four draft nodes and the two JSON nodes were tested with OpenAI `gpt-4o-mini` — swap the model/provider per node in Studio to use your own.

To run it live: build the flow in Lamatic Studio following the node-by-node spec in [`agent.md`](./agent.md) (or import `flows/appeal-analysis.ts` if your Studio setup supports it), deploy, and copy the resulting Flow ID into `apps/.env.local`.

## Setup Instructions

### Prerequisites
- Node.js 22.6+ and npm — the app itself runs on Node 20.9+, but `npm test` uses
  `--experimental-strip-types` to run the TypeScript tests directly, which needs 22.6+
- A Lamatic account (only required for live mode — demo mode needs neither)

### 1. Build the flow in Lamatic Studio (for live mode)
1. Sign in at https://lamatic.ai and create a project.
2. Import the flow definition in `flows/appeal-analysis.ts` (or rebuild it using the node walkthrough in `agent.md`), wiring the externalized prompts, scripts, and model configs from `prompts/`, `scripts/`, and `model-configs/`.
3. Select a text-generation model for each `LLMNode`.
4. Deploy and copy the Flow ID and your project's API URL/ID/key.

### 2. Configure environment variables
```bash
cd apps
cp .env.example .env.local
```
```bash
LAMATIC_API_URL=your_lamatic_api_url
LAMATIC_PROJECT_ID=your_lamatic_project_id
LAMATIC_API_KEY=your_lamatic_api_key
APPEAL_ANALYSIS_FLOW_ID=your_deployed_flow_id
```
Leave all four unset to run in demo mode.

### 3. Install and run
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Example usage
Click any of the three "Try an example" buttons (medical necessity, missing prior authorization, out-of-network) to load a realistic denial letter and see the full pipeline output immediately, in demo mode or live.

## Repo Structure
```
lamatic.config.ts          # Kit metadata
agent.md                   # Agent identity + capability doc
flows/appeal-analysis.ts   # The Lamatic flow (nodes/edges/meta)
prompts/                   # Extraction, 4 drafting strategies, strength assessment
scripts/                   # codeNode bodies (parse, deadline math, assemble)
model-configs/             # Per-node model selection (placeholders — fill in via Studio)
constitutions/default.md   # Guardrails, including healthcare-specific ones
apps/                      # The Next.js app
  actions/orchestrate.ts   # Server action: live Lamatic call or demo-mode fallback
  lib/demo-data.ts         # 3 example scenarios + mocked pipeline output
  lib/deadline-urgency.ts  # Pure date-math function (unit-tested)
  app/page.tsx             # UI: input form, loading pipeline, structured results
```

## Limitations
- Denial-category strategies cover the three most common reason types plus a general fallback; highly unusual denial reasons will get the general strategy.
- Deadline extraction only works when the letter states or implies an absolute date; relative deadlines without a stated notice date return `null` rather than a guess.
- Not a substitute for legal or medical advice — always reviewed before submission.

## Future Improvements
- Track appeal outcomes over time to refine the strategy prompts.
- Multi-language support.
- Second-level/external-review letter generation once a first-level appeal is denied.

## Contributing
Part of the [Lamatic AgentKit Challenge](https://github.com/Lamatic/AgentKit). See the repository's [CONTRIBUTING.md](../../CONTRIBUTING.md) for conventions.

## License
MIT License – see [LICENSE](../../LICENSE).
