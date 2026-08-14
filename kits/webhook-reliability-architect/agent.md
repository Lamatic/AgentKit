# Webhook Reliability Architect — Agent Guide

## Overview

Webhook Reliability Architect is a design-review agent for webhook systems that can trigger business side effects. It converts a sanitized delivery scenario into a structured reliability report covering idempotency, retries, dead-letter handling, observability, failure modes, failure injection, and staged rollout.

## Purpose

Distributed delivery is usually at least once: timeouts and lost acknowledgements make redelivery normal. The agent helps engineers replace informal retry logic with an explicit contract that prevents a duplicate request from becoming a duplicate business mutation.

The goal is not to claim exactly-once transport. The goal is to make duplicate delivery safe, bound recovery work, and define evidence that the system behaves as designed.

## Flow

### `webhook-reliability-architect`

- **Trigger:** Lamatic API Request node.
- **Inputs:** one JSON-encoded `scenario` string containing the system name, event type, business effect, delivery semantics, ordering requirement, retry bounds, current safeguards, sanitized payload, and failure context.
- **Processing:** A structured-output model evaluates duplicate-delivery risk and produces one report under a fixed schema.
- **Response:** Lamatic API Response node returns the report as `analysis`.
- **Use when:** Reviewing a new webhook, preparing a reliability hardening sprint, or converting an incident lesson into a testable design.
- **Do not use when:** The caller expects code deployment, queue mutation, production replay, security certification, or a guarantee of exactly-once delivery.

## Required output

The report must include:

1. Executive summary, risk score, and risk level.
2. Explicit assumptions.
3. Idempotency key strategy and conflict behavior.
4. Bounded retry policy and attempt schedule.
5. Dead-letter record and safe replay checklist.
6. Delivery SLO, metrics, alerts, and log fields.
7. Failure modes with impact, signals, and mitigations.
8. Failure-injection tests with expected evidence.
9. Staged rollout steps.

## Guardrails

- Never ask for or expose API keys, signing secrets, customer data, payment credentials, or unredacted production payloads.
- Never recommend retrying invalid signatures, authorization failures, schema violations, or deterministic business-rule failures.
- Never claim exactly-once delivery. Prefer idempotent effects, atomic state transitions, or an inbox/outbox pattern.
- Never invent provider behavior. State assumptions when sender guarantees are missing.
- Never recommend blind bulk replay. Reuse original event identities and start with a canary.
- Separate transport acceptance from business completion where asynchronous processing is proposed.
- Treat financial, inventory, and entitlement mutations as high consequence.

## Integration reference

| Component | Purpose | Configuration |
|---|---|---|
| Lamatic API Request | Receives the scenario | Deployed flow endpoint |
| Structured-output model | Creates the report | Model selected in Lamatic Studio |
| Lamatic API Response | Returns `analysis` | Output mapping in the flow |
| Next.js app | Collects input and renders the report | Server-side Lamatic SDK |

## Environment setup

| Variable | Purpose |
|---|---|
| `WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID` | Deployed Lamatic flow ID |
| `LAMATIC_API_URL` | Lamatic project endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic project identifier |
| `LAMATIC_API_KEY` | Server-side API key; never expose to the browser |
| `DEMO_MODE` | Uses the deterministic local report when `true` |

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| App says the flow ID is missing | Live mode is enabled without `WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID` | Add the deployed flow ID or enable demo mode |
| Lamatic returns an unexpected shape | Flow response mapping or structured schema drifted | Verify the response field is `analysis` and matches the documented object |
| Report proposes an unstable key | Payload has no provider event ID | Require a stable event ID or derive a signed canonical hash with an explicit namespace |
| Retry schedule exceeds business value | Delivery-age input is too large | Set a realistic age budget and move expired events to quarantine |
| Duplicate still repeats a side effect | Receipt and mutation are not atomic | Use the same transaction or a durable state machine before acknowledging |
| Replay creates new duplicates | Operator minted a new idempotency key | Replay using the original identity and inspect the existing receipt first |
