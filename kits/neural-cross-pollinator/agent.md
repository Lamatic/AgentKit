# Neural Cross-Pollinator — Agent Identity

## Overview
Neural Cross-Pollinator takes two unrelated domains (e.g. "bee colony
behavior" and "stock market crashes") and finds genuine structural
parallels between them, then proposes and critically evaluates a
mechanism transferred from one domain into the other as a candidate
innovation.

## Purpose
Most AI agents reason within a single domain. This agent instead
looks for structural isomorphisms — shared patterns of entities,
mechanisms, constraints, and feedback loops — across two domains that
have no surface-level connection. It exists to surface non-obvious
analogies that a domain expert working alone might miss, while
honestly evaluating whether the resulting idea is actually novel.

## Flows

### `neural-cross-pollinator`
- **Trigger:** API request with `{ domainA: string, domainB: string }`
- **Processing:**
  1. Analyze Domain A — structural breakdown (entities, mechanisms,
     constraints, feedback loops, adaptation patterns)
  2. Analyze Domain B — same breakdown
  3. Find Structural Parallels — cross-references both breakdowns
  4. Transfer Mechanism — selects the strongest parallel, proposes a
     concrete mechanism transfer
  5. Evaluate Innovation — critically scores novelty and feasibility,
     returns a `strong`/`weak` verdict
  6. Branches on verdict — a confident presentation for `strong`, an
     honest caveat-led presentation for `weak`
- **Response:** structured JSON with both domain analyses, the
  parallels found, the proposed innovation, the evaluation, and a
  human-readable final summary.
- **When to use:** ideation, cross-disciplinary research, or teaching
  contexts where you want a rigorously-checked analogy rather than an
  uncritical one.
- **Dependencies:** an LLM provider (Groq in the reference deployment)
  configured in Lamatic Studio.

## Guardrails
See [`constitutions/default.md`](./constitutions/default.md). Key
rule: the evaluation stage must not default to positive verdicts —
"weak" is a legitimate and expected outcome.

## Integration Reference
- **Lamatic API** — executes the deployed flow via GraphQL
  (`executeWorkflow`). Requires `LAMATIC_API_KEY`, `LAMATIC_API_URL`,
  `LAMATIC_PROJECT_ID`.
- **LLM provider** — configured inside Lamatic Studio, not directly
  by this app (no LLM API key is held by the Next.js app itself).

## Environment Setup
| Variable | Purpose | Source |
|---|---|---|
| `NEURAL_CROSS_POLLINATOR_FLOW_ID` | Deployed flow ID to call | Lamatic Studio → your project |
| `LAMATIC_API_KEY` | Auth for Lamatic API | Lamatic account settings |
| `LAMATIC_API_URL` | Your project's API base URL | Lamatic Studio → API Docs |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID | Lamatic Studio → API Docs |

## Quickstart
1. `cd kits/neural-cross-pollinator/apps`
2. `npm install`
3. `cp .env.example .env.local` and fill in the values above
4. `npm run dev`
5. Open `http://localhost:3000`, enter two domains, submit

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| Empty/error response | Wrong `NEURAL_CROSS_POLLINATOR_FLOW_ID` | Confirm the flow ID from Lamatic Studio's API Docs page |
| 401/403 from Lamatic API | Invalid or missing `LAMATIC_API_KEY` | Regenerate the key in Lamatic account settings |
| Verdict always "strong" | Evaluation prompt drifted from constitution | Re-check the Evaluate Innovation node's system prompt against `constitutions/default.md` |