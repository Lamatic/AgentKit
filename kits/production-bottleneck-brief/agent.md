# Production Bottleneck Brief

## Overview

An AI-powered assistant for production/manufacturing operations teams that turns raw order-tracking data into a prioritized, plain-English brief on what's at risk of missing its deadline — and answers follow-up questions about any specific order.

## Purpose

Spotting at-risk orders across a large order book normally means manually scanning every row, computing days remaining vs. stages left, and guessing what's urgent. This agent automates that triage: deterministic code computes the risk signals (days in stage, days until due, % complete, overdue status), and an LLM synthesizes those signals into a short, prioritized narrative a human can act on immediately.

## Flows

1. **production-bottleneck-brief** — takes the full order list, computes per-order risk stats, and generates a brief that leads with overdue orders, then orders running out of time, naming the likely bottleneck stage.
2. **follow-up-qa** — takes one order ID and a free-text question, fetches that order's stats, and answers directly in plain language.

## Design principle

Risk detection is deterministic (code node), narrative synthesis is the LLM's job. The LLM never invents a risk status the data doesn't support, and never surfaces raw field/variable names in its output — everything is translated into plain English before it reaches the user.

## Guardrails

- The LLM is instructed to synthesize only from the precomputed stats it's given, not to invent data not present in the input
- Responses stay scoped to what's asked — the Q&A flow doesn't repeat the full brief, just answers the specific question

## Integration

Consumed by a Next.js app (`apps/`) via the Lamatic SDK's `executeFlow`, with both flow IDs read from environment variables (`BRIEF_FLOW_ID`, `QA_FLOW_ID`).