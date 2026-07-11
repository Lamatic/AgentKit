# LLM Silent Failure Detector

## Overview

An agent that detects silent LLM failures in a batch of interaction logs — responses that look fine but are actually ungrounded (hallucinated relative to their source context) or violate an expected output schema. Unlike uptime/latency monitoring, this catches failures that never throw an error.

## Purpose

Given `logs: [{ id, prompt, context, response, expected_schema? }]`, the agent:

1. Checks each response for claims not supported by its context (grounding check)
2. Validates structured responses against their declared schema, when provided (deterministic, not LLM-based)
3. Collects flagged logs and, when there are enough to find a pattern, embeds and clusters them by similarity
4. Names each cluster with a short label, a description of the pattern, and a suggested engineering fix

## Flow

`flows/agentkit-challenge.ts` — single flow, API-triggered, described in detail in the kit's `README.md`.

## Guardrails

See `constitutions/default.md`. The grounding-check step is deliberately conservative: it flags a claim as ungrounded if it cannot be verified from the provided context alone, even if the claim happens to be true in general — the point is to catch reliance on unstated/external knowledge, not to fact-check against the world.

## Integration

Called via the Lamatic API (`executeFlow`) with a `logs` array as input. See `apps/` for the reference Next.js integration, or `README.md` for the raw API shape.