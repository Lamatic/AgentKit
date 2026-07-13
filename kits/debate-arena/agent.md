# Debate Arena

## Overview

Debate Arena turns any tradeoff or decision into a structured, multi-agent debate: two persona agents argue opposing positions across several rounds, rebutting each other, and a third impartial judge agent synthesizes a pros/cons matrix and a final recommendation. It is a three-flow kit (with a small Next.js app in `apps/`).

## Flows

### 1. `debate-setup`

**Input:** `topic` (a raw decision or question in plain English).

**What it does:** Uses an LLM (`groq/llama-3.3-70b-versatile`) to neutrally reframe the topic and produce exactly two clearly opposed positions, without taking a side itself. If the user's input is already framed as a binary ("X vs Y"), it keeps that framing; if open-ended, it frames the affirmative and the alternative case. States assumptions explicitly rather than burying them.

**Output:** Structured JSON — `cleanTopic`, `positionA` (`label`, `stance`), `positionB` (`label`, `stance`), `context` — meant to seed every subsequent `debate-round` call.

### 2. `debate-round`

**Input:** `topic`, `position` (which side to argue), `opponentPosition`, `transcript` (all statements so far), `round`, `isRebuttal`.

**What it does:** Uses an LLM (`groq/llama-3.3-70b-versatile`) to generate one persona's next statement. On the opening round it produces a fresh argument for that position; on later rounds, with `isRebuttal: true`, it must directly address the opponent's most recent point before reinforcing its own case. The prompt explicitly forbids fabricated statistics — arguments should reason from principles and well-known tradeoffs, not invented facts. Statements are capped around 120 words to keep the debate readable. This flow is invoked repeatedly (once per side per round) by the calling app, alternating `position`/`opponentPosition`; it is not a chained pipeline step by itself.

**Output:** `statement`, `keyPoint` (a one-line summary of the point made, useful for the judge and for future rebuttals to target precisely).

### 3. `debate-judge`

**Input:** `topic`, `positionA`, `positionB`, `transcript` (every turn from both `debate-round` calls).

**What it does:** Uses an LLM (`groq/llama-3.3-70b-versatile`) to review the full transcript and extract only the pros/cons that were actually argued (never inventing new ones), identify the single strongest argument per side, and produce a final recommendation with an honestly-stated confidence level (`low`/`medium`/`high`) and explicit caveats. If the honest answer is "it depends", the flow says so and states exactly what it depends on rather than forcing a false-confidence pick.

**Output:** `prosA`, `consA`, `prosB`, `consB`, `strongestArgA`, `strongestArgB`, `recommendation`, `confidence`, `caveats`.

## Guardrails

All three flows follow `constitutions/default.md`: no fabricated facts or statistics (arguments must reason from stated principles/tradeoffs), the judge only reports pros/cons that were actually present in the transcript, confidence is stated honestly rather than defaulting to "high", and none of the flows log or retain the debate topic or transcript beyond the request/response cycle.

## Integration

Call `debate-setup` once with the raw topic, then call `debate-round` in a loop — once per side, per round, alternating `position`/`opponentPosition` and passing the growing `transcript` array each time — for as many rounds as desired (1-3 recommended). Finally call `debate-judge` once with the complete transcript. See `README.md` for the flow diagram, or run `apps/` locally for a ready-made UI that drives this exact sequence and renders it as a live back-and-forth debate.
