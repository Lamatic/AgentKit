# Research Decision Brief Agent

## Problem Statement

Teams often read multiple papers but still struggle to make concrete implementation decisions.
This template solves the "evidence-to-action" gap by converting research evidence into a practical decision brief.

## What Makes It Unique

- Goes beyond summarization by producing actionable options.
- Requires explicit tradeoff analysis and confidence scoring.
- Returns a decision-ready output format for product and engineering planning.

## Flow Summary

This template contains one flow:

1. API Request receives decision context and research evidence.
2. LLM node synthesizes options, recommendation, risks, and experiments.
3. API Response returns a formatted decision brief.

## Input Contract

Pass a JSON payload with fields like:

```json
{
  "objective": "Choose an on-device OCR strategy for mobile receipts",
  "constraints": "Low latency, offline support, <150MB model size",
  "timeline": "Ship MVP in 6 weeks",
  "audience": "Product and mobile engineering leads",
  "evidence": "Paper A: ...; Paper B: ...; Benchmark notes: ..."
}
```

## Output

The flow returns:
- `decision_brief` (markdown string)

The brief includes:
- options table,
- top recommendation,
- confidence level,
- key risks and mitigations,
- next validation steps.

## Setup

1. Import this template into Lamatic Studio.
2. Verify model provider credentials configured in your Lamatic environment.
3. Deploy the flow.
4. Invoke the API endpoint with your decision context and evidence payload.

## Suggested Extension

- Add a retrieval step that queries ArXiv or an internal paper index automatically.
- Add memory for cross-session decision tracking.
- Add a second flow that generates stakeholder-specific versions of the brief.
