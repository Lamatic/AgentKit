# Debrief — Interview Feedback Summarizer

## Overview
Debrief is a single-purpose, stateless agent kit that turns messy interview feedback into a structured, shareable summary. Paste raw notes from one or many rounds (Slack pastes, prose, bullet fragments, tagged blobs) and receive a one-line summary plus three lists: strengths, gaps, and action items.

## Purpose
Candidates and interviewers accumulate unstructured feedback across rounds with no quick way to distill it. Debrief solves this with one textarea, an optional "+ Add another round" control, and a single LLM extraction call whose output is validated server-side against a strict JSON schema.

## Flows

### `summarize-feedback` (env: `SUMMARIZE_FEEDBACK`)
- **Trigger:** API Request (`graphqlNode`) with `feedback: string` (optionally multi-round tagged input like `Round 1: ...\n\nRound 2: ...`)
- **Processing:** Single LLM node `Extract` using `@prompts/summarize-feedback_extract_system.md` + `@prompts/summarize-feedback_extract_user.md` and model config `@model-configs/summarize-feedback_extract.ts`. Temperature 0.2 for deterministic extraction.
- **Response:** `API Response` maps `result` to `{{LLMNode_1.output.generatedResponse}}`. The Next.js server action parses the raw string as JSON, extracts fenced JSON if present, and validates with Zod against `{summary: string, strengths: string[], gaps: string[], action_items: string[]}`. Malformed output fails loudly (ZodError) instead of silently returning partial data.
- **When to use:** Any free-form interview notes needing post-round synthesis. Handles single blob or multiple tagged rounds; frontend tags rounds before submission so the model sees round boundaries in one call.
- **Output:** Validated `DebriefOutput` rendered as summary + three lists. Empty arrays are allowed (sparse notes) — no fabricated scores.
- **Dependencies:** Lamatic runtime + LLM provider (configured in Studio for the LLM node). Env: `SUMMARIZE_FEEDBACK`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`. Local fallback exists for dev without creds but still enforces schema.

## Guardrails
- **Prohibited:** OCR/photo input, voice transcription, auth/accounts, persistence/history, multi-language optimization targets (per PRD Non-goals). Stateless only.
- **Input constraints:** `feedback` must be non-empty string. No file upload, no audio.
- **Output constraints:** Must match exact schema with four keys; no confidence scores or fabricated precision. Unparseable JSON triggers error, not silent fallback.
- **Operational limits:** Single model call. Concurrency/rate limits come from Lamatic plan + provider. No chained agents.

## Integration Reference
| Integration | Purpose | Credential |
|---|---|---|
| Lamatic Flow Runtime | Execute `summarize-feedback` flow | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Flow ID | Route to deployed extraction flow | `SUMMARIZE_FEEDBACK` |
| LLM Provider (via Lamatic) | Structured extraction | Configured in Lamatic Studio (model + keys) |
| Next.js App | Single-page UI + server action validation | Reads env above |

## Environment Setup
- `SUMMARIZE_FEEDBACK` — Flow ID for `summarize-feedback` from Lamatic Studio
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — from **Settings → API Keys** in Lamatic

## Quickstart
1. Deploy `summarize-feedback` flow in Lamatic Studio (import from `flows/summarize-feedback.ts`, set prompts + model, deploy).
2. Copy env values into `apps/.env.local` (see `apps/.env.example`).
3. Run:
   ```bash
   cd kits/debrief/apps
   npm install
   npm run dev # http://localhost:3000
   ```
4. Paste notes (or add rounds), submit, verify summary + 3 lists render. Test with mixed-round blobs, fragment notes, and prose paragraphs.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| `Schema validation failed` | LLM returned non-JSON or wrong keys | Tighten prompts, add fence-stripping in `actions/orchestrate.ts`, verify model supports JSON mode |
| No result / empty response | Missing `SUMMARIZE_FEEDBACK` or flow not deployed | Deploy flow and set env; check `lamaticClient.executeFlow` logs |
| Auth error | Wrong `LAMATIC_API_KEY` / project mismatch | Regenerate from Settings → API Keys |
| Timeout | Large feedback blob near model token limit | Trim input or chunk by round before tagging |
