# Weekly Routine Coach — Agent Identity

## Overview

Weekly Routine Coach turns a free-text brain-dump of goals and commitments into a balanced weekly routine on a 30-minute grid. It conducts a short conversation to extract structured information, generates a populated 7-day schedule, and re-plans when something slips. The agent is bilingual (PT-BR / EN), follows the user's language consistently within a session, and operates under a non-negotiable constitution that enforces realism (sleep, meals, fixed-commitment integrity).

## Purpose

People who try to plan their week usually fail because:

1. They brain-dump tasks but don't actually **place** them on a time grid.
2. Life is recurring (gym, study) + one-off (meeting, errand) and most tools force one or the other.
3. When something slips on Tuesday, no tool replans the rest of the week.
4. At week's end, there's no honest comparison of planned vs. done.

This agent addresses all four. It is a **coach**, not a calendar — it places intentions in time and adapts when reality intervenes.

## Flows

### 1. `intake` (conversational)

- **Trigger**: API Request. Input: `message`, `today`, `session_state` (accumulating state, may be `{}` on first call).
- **Processing**: a Generate JSON node (Gemini 2.5 Flash) reads the message + state, extracts structured information (categories, fixed commitments, recurring goals, one-off events, preferences), and decides whether to ask a clarifying question or confirm.
- **Response**: `{ language, assistant_message, is_complete, session_state, missing_info }`.
- **When to use**: every user turn during onboarding. The app calls intake repeatedly, passing the latest `session_state` back, until `is_complete: true`.
- **Output**: full updated `session_state` (never drops prior data) + next assistant message.
- **Dependencies**: `prompts/intake_system.md`, `prompts/intake_user.md`, `constitutions/default.md`.

### 2. `generate-week` (placement)

- **Trigger**: API Request. Input: the full session state + a Monday date.
- **Processing**: Generate JSON node with a longer placement-focused system prompt. The agent positions sleep first, then fixed commitments, then meals/breaks, then recurring goals into remaining slots, respecting preferences and per-goal time windows.
- **Response**: `{ week_start_date, blocks, unmet_goals, summary }`. `blocks` is the full 7-day grid; `unmet_goals` honestly declares any target hours the model couldn't fit.
- **When to use**: once the user confirms the captured state and clicks "Generate".
- **Latency note**: this is the heaviest call — ~60–90s on Gemini 2.5 Flash. The app uses a 180s timeout.
- **Dependencies**: `prompts/generate-week_system.md`, `prompts/generate-week_user.md`, `constitutions/default.md`.

### 3. `replan` (reactive)

- **Trigger**: API Request. Input: current blocks + a single `change` event (`slip`, `new_event`, or `completed`).
- **Processing**: Generate JSON node reads the change and reshuffles only goal-blocks (never touches fixed, sleep, or meal blocks). Returns the new state plus a diff (added / removed / moved) explaining exactly what changed.
- **Response**: `{ updated_blocks, diff, unmet_goals, summary }`.
- **When to use**: user marks a block as skipped, or wants to add a one-off event.
- **Dependencies**: `prompts/replan_system.md`, `prompts/replan_user.md`, `constitutions/default.md`.

## Guardrails

The constitution (`constitutions/default.md`) is inviolable and enforced via the system prompt of every flow:

- **Sleep**: every day has ≥7 hours of `kind: "sleep"`.
- **Meals & breaks**: ≥1.5 hours/day combined.
- **Fixed commitments**: never overwritten. Goals yield to fixed blocks, not the other way around.
- **Active hours**: ≤14 per day.
- **Granularity**: 30-minute blocks. Never off-grid (no `18:15`).
- **Honesty**: when a goal's target cannot fit, the agent declares the gap in `unmet_goals` with a one-sentence reason — it does **not** silently shrink blocks or drop goals.
- **Replan churn minimization**: the model is instructed to move as few blocks as possible.
- **Out of scope**: the agent does not do task management, project breakdowns, or give medical/legal/financial advice.

## Integration Reference

- **LLM provider**: Google Gemini via Lamatic's connection. All three flows use **gemini-2.5-flash** (free tier of Google AI Studio; ~15 req/min limit).
- **Lamatic Studio**: project hosts the three flows behind a single GraphQL endpoint. Each flow has its own workflow ID (see `lamatic.config.ts` step `envKey`s).
- **No external services**: no calendar sync, no database, no third-party APIs beyond Lamatic + Gemini.

## Environment Setup

The Next.js app in `apps/` requires these environment variables (see `apps/.env.example`):

| Variable | Source |
|---|---|
| `LAMATIC_API_URL` | Studio → Settings → API Keys → "Connect to your project" dialog → API URL |
| `LAMATIC_PROJECT_ID` | Same dialog → Project ID |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys → existing or new key |
| `INTAKE_FLOW_ID` | Studio → `intake` flow → Details → Flow ID |
| `GENERATE_WEEK_FLOW_ID` | Studio → `generate-week` flow → Details → Flow ID |
| `REPLAN_FLOW_ID` | Studio → `replan` flow → Details → Flow ID |

## Quickstart

1. Clone the repo and `cd kits/weekly-routine-coach/apps`.
2. `cp .env.example .env.local` and fill in the values above.
3. `npm install --legacy-peer-deps` (vaul depends on React 16-18 peer; we use React 19).
4. `npm run dev` → open `http://localhost:3000`.
5. In the chat, type something like `"Trabalho seg-sex 9-18, queria treinar 4x na semana e estudar inglês 1h por dia"` and press Enter.
6. Continue answering the agent's clarifying questions until it offers to generate the week.
7. Click **"Gerar minha semana"** (or "Generate my week") and wait ~1 min.
8. Click any `goal` block on the grid to mark it as skipped — the agent will replan.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| `Lamatic credentials missing` on startup | `.env.local` not loaded | Make sure file is at `apps/.env.local`, not `apps/.env`. Restart `npm run dev`. |
| All output fields prefixed with `$` (e.g. `$pt-BR`) in raw API response | Quirk of Lamatic's `${{...}}` template syntax leaving `$` literal. | Handled by `unwrap()` in `apps/lib/lamatic-client.ts`. If a new field is added, route it through `unwrap()` too. |
| `session_state` returned as a string instead of object | Lamatic's outputMapping serializes obj/arr as JSON strings. | `unwrap()` JSON-parses any string starting with `{` or `[`. |
| `generate-week` times out at 180s | Placement is hard for smaller models. | Increase `timeoutMs` in `executeFlow()` or simplify input (fewer goals/categories). |
| `day` field returned as `"Monday"` instead of `"mon"` | Gemini occasionally ignores the 3-letter convention in the prompt. | App's `normalizeDay()` normalizes any case ending with the 3-letter prefix. |
| `is_complete` arrives as `"true"`/`"false"` (string) | Lamatic's response schema doesn't support `bool` — only `str`. | `unwrap()` converts `"true"`/`"false"` strings to booleans. |
| Build error `Module not found: '@/actions/orchestrate'` | `tsconfig.json` missing `paths` mapping. | Already configured. If you regenerate the tsconfig, re-add `"paths": { "@/*": ["./*"] }`. |

## Files of Note

- `flows/intake.ts`, `flows/generate-week.ts`, `flows/replan.ts` — exported flow definitions from Lamatic Studio.
- `prompts/*.md` — system & user prompts for each flow, externalized via `@references`.
- `constitutions/default.md` — the inviolable rules every flow inherits.
- `apps/actions/orchestrate.ts` — server actions wrapping the three flows with typed inputs/outputs and result-parsing helpers.
- `apps/lib/lamatic-client.ts` — minimal fetch-based GraphQL client + `unwrap()` quirk-undoer.
- `apps/app/page.tsx` — the single-page UI: chat → grid → slip dialog state machine.
