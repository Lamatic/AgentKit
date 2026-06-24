# LLM Eval Harness

## Overview
The LLM Eval Harness is a quality-gate agent for other LLM features. Given a system prompt and a golden set of test cases, it runs each case through the prompt-under-test and then grades the output with an LLM-as-judge across faithfulness, relevancy, and correctness, returning per-case scores and a single pass/fail gate. It is invoked by a Next.js web UI that calls two Lamatic flows and aggregates the verdicts. It depends on Lamatic's hosted runtime, project credentials, and a connected text-generation provider (Groq).

## Purpose
Prompt and model changes can silently regress output quality — a reworded instruction starts hallucinating, over-promising, or drifting off-task. This agent makes that measurable and repeatable: a fixed golden set plus an automated judge plus a quality threshold, so a regression is caught as a failed gate rather than by a user. It generalises the eval-harness pattern (golden sets + LLM-as-judge + CI gate) into a hosted, reusable tool.

## Flows

### `judge`
- **Trigger:** API request with `{ input, output, criteria, reference? }`.
- **Processing:** a single LLM node (Groq `llama-3.3-70b-versatile`, temperature 0) acts as a strict evaluation judge using the system prompt in `prompts/`. It scores the candidate `output` against the `criteria` and optional `reference`.
- **Response:** JSON `{ faithfulness, relevancy, correctness, overall, pass, reasoning }`, each dimension 0–5.
- **When to use:** to score one already-generated output against case criteria.
- **Dependencies:** Groq text model credential.

### `run-target`
- **Trigger:** API request with `{ systemPrompt, input }`.
- **Processing:** a single LLM node runs `systemPrompt` (system) + `input` (user) — this is the *system under test*.
- **Response:** `{ answer }`, the generated output.
- **When to use:** to produce the output that `judge` then scores.
- **Dependencies:** Groq text model credential.

## Guardrails
- The `judge` only scores; it never completes the user's task or rewrites the output.
- It does not reward length, confidence, formatting, or politeness — an eloquent but unsupported answer scores low on faithfulness.
- Faithfulness is a veto: a hallucinated or contradicting answer fails regardless of other scores.
- Scoring is deterministic (temperature 0); identical inputs yield identical scores.

## Integration Reference
- **Lamatic API runtime** — hosts and executes both flows. Requires `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` in the calling app.
- **Groq (text generation)** — backs both LLM nodes; configured as a model credential in Lamatic Studio.

## Environment Setup
- `JUDGE_FLOW` — deployed `judge` flow ID, called by the app.
- `RUN_TARGET_FLOW` — deployed `run-target` flow ID, called by the app.
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic project credentials used by the app to invoke the flows.

## Quickstart
1. Build and deploy the `judge` and `run-target` flows in Lamatic Studio; copy their Flow IDs.
2. In `apps/`, copy `.env.example` to `.env.local` and fill in the flow IDs + Lamatic credentials.
3. `npm install && npm run dev`, open `http://localhost:3000`.
4. Paste a system prompt + a golden set (or click **Load example**) and run.

## Common Failure Modes
| Symptom | Likely cause | Fix |
|---|---|---|
| Judge scores look random | Model too small or temperature not 0 | Use `llama-3.3-70b-versatile`, set temperature 0 |
| "No answer returned from flow" | Wrong flow ID or response mapping | Verify `JUDGE_FLOW`/`RUN_TARGET_FLOW` and that the response maps `answer` |
| Auth error on run | Missing/invalid Lamatic credentials | Check `LAMATIC_API_*` in `.env.local` |
| A case shows "error" | run-target or judge failed for that input | Expand the row; the run continues for other cases |
