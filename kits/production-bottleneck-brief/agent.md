# Production Bottleneck Brief

## Overview

An AI-powered assistant for production/manufacturing operations teams that turns raw order-tracking data into a prioritized, plain-English brief on what's at risk of missing its deadline — and holds an ongoing, memory-aware conversation about any specific order.

## Purpose

Spotting at-risk orders across a large order book normally means manually scanning every row, computing days remaining vs. stages left, and guessing what's urgent. This agent automates that triage: deterministic code computes the risk signals, an LLM synthesizes them into a short, prioritized, action-oriented narrative, and a second LLM call turns that narrative into a ready-to-send alert email. A companion Q&A flow lets a manager dig into any specific order and keeps context across multiple questions.

## Flows

1. **production-bottleneck-brief** — Code Node computes per-order risk stats → Generate Text synthesizes a prioritized brief with a concrete recovery action → a second Generate Text turns the brief into an email draft (subject + body).
2. **follow-up-qa** — Code Node isolates one order's stats → Memory Retrieve pulls prior facts discussed about that order → Generate Text answers the question, using both the stats and any retrieved memory → Memory Add extracts and stores new facts from the exchange for future questions.

## Design principles

- **Code computes, LLM synthesizes.** Risk detection (days until due, days in stage, % complete, overdue status) is deterministic and reproducible — never left to model judgment. The LLM only turns already-correct numbers into readable, actionable text.
- **Recommendations are concrete, not vague.** Both flows are instructed to name an actual recovery action (reassign resources, escalate, deprioritize) grounded only in the stats given — not generic "look into this" advice, and never an invented operational detail (like specific staff or supplier names) the data doesn't support.
- **Memory is scoped per order, not per user.** Using the order ID as the memory's unique identifier means anyone asking about the same order sees the same accumulated context — matching how a team actually works together on the same order.
- **No raw field names ever reach the user.** Every prompt explicitly translates `daysUntilDue: -2` into "2 days overdue," etc.

## Guardrails

- The LLM never invents data not present in the input or memory
- Malformed order data (invalid dates, non-numeric quantities, an unrecognized current stage) is explicitly caught by the Code Node and flagged rather than silently producing incorrect risk stats
- The email draft is generated but never sent — no automated send action is wired into this kit

## Integration

Consumed by a Next.js app (`apps/`) via the Lamatic SDK's `executeFlow`, with both flow IDs read from environment variables (`BRIEF_FLOW_ID`, `QA_FLOW_ID`). The UI threads Q&A conversations per order ID, mirroring the flow's own per-order memory scoping.