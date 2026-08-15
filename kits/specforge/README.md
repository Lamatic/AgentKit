# SpecForge

Turn a one-line feature idea into a structured, self-reviewed technical spec.

## Problem
A first-draft technical spec is usually missing something — edge cases, a non-goals section, a rollout plan. SpecForge automates the first draft *and* a review pass, so what you get back has already been checked against a quality rubric.

## How it works
1. Submit a `feature_description`.
2. An LLM drafts a structured spec (Problem, Goals, Non-Goals, Design, API Surface, Edge Cases, Rollout Plan).
3. A second LLM critiques the draft (completeness, clarity, edge-case coverage, feasibility) and returns a score + specific issues as structured JSON.
4. A third LLM revises the spec, addressing every issue raised.
5. The revised spec is critiqued again; the spec and its final quality score are returned together.

See [`agent.md`](./agent.md) for full architecture and design rationale.

## Example
**Input:** `{ "feature_description": "Add rate limiting to our public API" }`
**Output:**
```json
{
  "spec": "## Rate Limiting — Technical Spec\n\n**Problem:** Uncontrolled API usage risks service degradation and abuse.\n\n**Goals:** Enforce per-client request quotas; return 429 with Retry-After on breach; support burst allowance.\n\n**Non-Goals:** Per-endpoint granularity (phase 2); billing integration.\n\n**Design:** Token-bucket algorithm keyed on API key, stored in Redis with TTL equal to the window. Middleware layer intercepts before routing.\n\n**API Surface:** No new endpoints. All existing endpoints gain X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers.\n\n**Edge Cases:** Clock skew across instances; Redis unavailability (fail-open with logging); key rotation mid-window.\n\n**Rollout Plan:** Shadow mode for 1 week (log but don't enforce), then enforce at 1000 req/min per key.",
  "quality_score": 0.91
}
```

## Setup
1. Deploy this flow in [Lamatic Studio](https://studio.lamatic.ai).
2. Connect a text-generation model credential (built and tested with Groq's `llama-3.3-70b-versatile`).
3. Call the deployed API endpoint with a `feature_description` string.



