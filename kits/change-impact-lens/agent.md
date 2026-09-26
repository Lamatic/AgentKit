# Change Impact Lens — Agent Identity

## Overview

An agent that tells a developer what could break, directly or indirectly,
before they change a file — grounded in a real, computed dependency
graph rather than an LLM's guess about what imports what.

## Purpose

Editors show direct usages ("Find Usages"). They don't show that changing
one file could break another file several layers away, through a chain
of imports the developer never looks at. This agent exists to surface
that indirect impact, with an explanation of why it matters and what to
test — without ever inventing a dependency relationship that isn't
actually present in the code.

## Flows

### `change-impact-analysis`

- **Trigger:** API Request, called from the kit's Next.js app after it
  has already computed the real dependency evidence (via `madge` +
  breadth-first traversal — this happens in application code, not inside
  the flow, since the flow's Code Node cannot run npm packages).
- **Processing:** A single LLM node (Groq `gpt-oss-120b`) receives two
  inputs — `target_file` and `dependents_evidence` (a pre-computed,
  hop-labeled list of affected files) — and is instructed to explain the
  impact using *only* that evidence, grouped by hop distance, with a
  prioritized testing checklist.
- **Response:** A single text field, `answer`, containing the full
  explanation.
- **When to use:** Before changing a shared file (a utility, a component,
  a config module) in a codebase, to get a fast, grounded read on blast
  radius before writing any tests.
- **Output:** Plain-text explanation, structured by the LLM into
  direct-dependent and indirect-dependent sections with reasoning and
  test suggestions for each.
- **Dependencies:** Requires the calling application to have already
  computed real dependency evidence — this flow has no ability to
  analyze code itself, by design.

## Guardrails

- The flow's prompt explicitly instructs the model to reference *only*
  files present in the supplied evidence, and to say so plainly if the
  evidence is empty rather than inventing a plausible-sounding reason.
- This is a prompt-level instruction, not a hard technical guarantee —
  the calling application still validates that a real, non-empty
  evidence string was computed before calling this flow at all.

## Integration Reference

- **Groq** (LLM provider) — model `openai/gpt-oss-120b`, called via
  Lamatic's Generate Text node. Requires a Groq API key configured as a
  Lamatic credential in Studio.
- **Lamatic SDK** (`lamatic` npm package) — used by the kit's
  `apps/actions/orchestrate.ts` to call this deployed flow.

## Environment Setup

| Variable | Source |
|---|---|
| `CHANGE_IMPACT_ANALYSIS_FLOW` | Flow ID, copied from this flow's details panel in Lamatic Studio after deploying |
| `LAMATIC_API_URL` | Lamatic Studio → Settings → API Docs |
| `LAMATIC_PROJECT_ID` | Lamatic Studio → Settings → Project |
| `LAMATIC_API_KEY` | Lamatic Studio → Settings → API Keys |

## Quickstart

1. Deploy this flow in your own Lamatic project (or import the exported
   flow files in `flows/`, `prompts/`, `model-configs/`, `constitutions/`)
2. Add a Groq credential in Lamatic Studio
3. Copy the deployed flow's ID into `CHANGE_IMPACT_ANALYSIS_FLOW`
4. Run the kit's Next.js app (see the kit's own `README.md`)

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Explanation never appears, raw analysis still shows | The Lamatic flow call failed silently (by design — the app degrades to raw analysis rather than erroring) | Check the app's server console for `[change-impact-lens] Lamatic flow call failed:` and the underlying error |
| Flow returns a 400/500 with `"Cannot read properties of undefined"` | The deployed flow is stale — changes made in Studio's editor were tested but never redeployed | Click **Deploy** in Lamatic Studio again; testing in the editor does not update the live version |
| Explanation mentions files not in the evidence | The model ignored the grounding instruction | Treat as a prompt-reliability issue, not a graph-computation bug — the underlying evidence (visible in the raw analysis list on the same page) is the source of truth |