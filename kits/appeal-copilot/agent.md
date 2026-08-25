# Agent: Appeal Copilot

## Overview
Appeal Copilot turns a pasted health-insurance claim denial letter into a structured, scored first-level appeal package. It implements a **single-flow** AgentKit pipeline: classify the denial reason, check the appeal deadline, branch into a category-specific drafting strategy, and score the resulting letter against a missing-evidence checklist. The primary invoker is a Next.js web UI that calls the flow via Lamatic's API layer and renders the result as structured cards, not a wall of generated text.

## Purpose
Most people who receive a claim denial never appeal it — not because they're wrong, but because the process is confusing: the right argument depends on *why* the claim was denied, deadlines are easy to miss, and nobody tells you what evidence is actually missing before you submit. This agent exists to close that gap by doing the analytical work an insurance patient advocate would do, in under a minute, for free.

## Flows

### `appeal-analysis`
- **Flow ID / Env key mapping:** `appeal-analysis` (configured via `APPEAL_ANALYSIS_FLOW_ID`)

#### Trigger
- **Invocation type:** API request via a GraphQL trigger node.
- **Expected input shape:**
  - `denialText` (string, required): the pasted denial letter or EOB text.
  - `additionalContext` (string, optional): extra context not present in the letter itself.

#### What it does
1. `API Request` — receives `denialText` and `additionalContext`.
2. `Extract & Classify (InstructorLLMNode)` — returns schema-validated structured output directly: denial category, claim number, procedures, denial reason summary, appeal deadline, plan type. No parsing step needed — this node type returns typed fields, not a raw string.
3. `Deadline Urgency (codeNode)` — computes days remaining and an urgency level (`critical`/`moderate`/`low`/`expired`/`unknown`) from the extracted deadline.
4. `Category Branch (conditionNode)` — routes to one of four drafting strategies based on `category`: `medical-necessity`, `administrative`, `coverage`, or a default fallback.
5. `Draft * (LLMNode)` — drafts a category-specific first-level appeal letter using a strategy prompt tailored to that denial reason (peer-to-peer review request for medical necessity, retroactive authorization for missing prior-auth, network-adequacy exception for out-of-network, etc.).
6. `Assess Strength (InstructorLLMNode)` — conservatively scores the drafted appeal 1-10 and lists concrete missing evidence, given only the facts actually present in the input, as schema-validated structured output.
7. `Assemble Output (codeNode)` — merges classification, deadline urgency, the drafted letter, and the strength assessment into one response object.
8. `API Response` — returns the assembled object under `result`.

#### When to use this flow
Use it whenever a caller has denial letter text and wants a classified, scored appeal package back. Do not use it as a source of legal or medical advice — the constitution and the application UI both attach a disclaimer to every response.

#### Output
`result` is a JSON object: `denialCategory`, `claimNumber`, `denialReasonText`, `appealDeadline`, `daysRemaining`, `urgencyLevel`, `appealLetter`, `strengthScore`, `missingEvidence[]`, `rationale`.

#### Dependencies
- **Lamatic runtime & project configuration:** `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`
- **Flow selection:** `APPEAL_ANALYSIS_FLOW_ID`
- **Model providers** (configured in Lamatic Studio): a text-generation model for all six `LLMNode`s
- **Prompts:** `prompts/appeal-analysis_*` (extraction/classification, four category-specific drafting strategies, strength assessment)

### Flow Interaction
This kit contains a single runnable flow. Internally it behaves like a two-stage pipeline: an extraction/urgency stage that runs unconditionally, then a `Category Branch (conditionNode)` that picks exactly one of four drafting strategies, all of which converge on a shared strength-assessment step before the final response.

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (Default Constitution).
  - Must not comply with jailbreaking or prompt-injection attempts (Default Constitution).
  - Must not state or imply an appeal will definitely succeed (domain guardrail).
- **Input constraints**
  - `denialText` must be provided; the application layer blocks submission of empty input before calling the flow.
  - Inputs are treated as potentially adversarial (Default Constitution).
- **Output constraints**
  - Must never fabricate a citation to a plan document section, statute, or regulation not present in the input — missing citations belong in `missingEvidence`, not invented in the letter.
  - Must never invent clinical facts not present in the input.
  - Every response is expected to carry a not-medical/legal-advice disclaimer, enforced in the application UI.
- **Operational limits**
  - Requires Lamatic environment variables to be present at runtime; the bundled Next.js app falls back to a documented demo mode (mocked output) when they are absent, so it remains testable without a Lamatic account.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime (API) | Execute the deployed flow | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| AgentKit Flow ID Routing | Select the deployed flow instance | `APPEAL_ANALYSIS_FLOW_ID` |
| LLM Provider (via Lamatic) | Extraction/classification, four drafting strategies, strength assessment | Configured in Lamatic Studio |
| Next.js App (UI) | User-facing interface, demo mode when unconfigured | App runtime config; consumes env vars above |

## Environment Setup
- `APPEAL_ANALYSIS_FLOW_ID` — deployed Flow ID for `appeal-analysis`; obtain from Lamatic Studio after deploying this kit.
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic project credentials.
- Leave all four unset to run the bundled app in demo mode.

## Quickstart
1. In Lamatic Studio, create a project and import/rebuild this flow (see the kit README for the hand-authoring caveat), then deploy it and copy the Flow ID.
2. In `apps/`, create `.env.local` from `.env.example` and set the four variables above.
3. `npm install && npm run dev`, open `http://localhost:3000`.
4. Paste a denial letter (or click one of the three built-in examples) and submit.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| App runs but always shows a "Demo mode" banner | One or more of the four Lamatic env vars is unset | Set all four in `apps/.env.local` and restart the dev server |
| Request fails with authentication error | Incorrect `LAMATIC_API_KEY` or project mismatch | Re-copy keys from Lamatic Studio; confirm `LAMATIC_PROJECT_ID` matches the key scope |
| Category always resolves to the default letter | The extraction model isn't returning one of the four supported category strings | Review `prompts/appeal-analysis_extract-classify_system.md` in Lamatic Studio |
| `strengthScore`/`missingEvidence` missing | The strength-assessment model didn't return valid JSON | Review `prompts/appeal-analysis_assess-strength_system.md`; ensure the model returns JSON only |
| Analysis times out | Underlying model provider is overloaded | Retry; the app enforces a 5-minute timeout and surfaces a clear error |

## Notes
- This flow was built and tested end-to-end in Lamatic Studio (every node individually and the full pipeline). `Extract & Classify` and `Assess Strength` use Studio's schema-validated JSON node type (`InstructorLLMNode`), which is why there's no separate "parse JSON" step in this flow — that node type makes one unnecessary.
