# Insurance Jargon Translator

A Lamatic AgentKit template that translates confusing insurance policy clauses into plain English.

## The Problem

Insurance policies are full of dense, legalistic language — exclusions, conditions, and definitions that are hard for the average policyholder to understand. This creates confusion at exactly the moments people need clarity most: when filing a claim or reviewing coverage.

## What It Does

Paste in a single sentence or clause from an insurance policy, and the flow returns a structured response with:

- **`plain_english`** — a 1-2 sentence explanation in everyday language, no legal jargon
- **`category`** — classifies the clause as one of: `exclusion`, `condition`, `definition`, `limit`, or `other`. If the input isn't a valid insurance clause, this field (along with the other fields) is returned as an empty string instead.
- **`example_scenario`** — a concrete, realistic situation showing when the clause applies
- **`why_it_exists`** — a brief note on why insurers typically include this type of clause

### Example

**Input:**
> "This policy excludes losses arising from wear and tear, gradual deterioration, or inherent vice."

**Output:**

```json
{
  "plain_english": "This policy does not pay for damage caused by things getting old, wearing out from normal use, or an item having a natural defect.",
  "category": "exclusion",
  "example_scenario": "If your roof leaks because the shingles wore out after 15 years, that's not covered. If a storm rips the roof off, that is.",
  "why_it_exists": "Insurers exclude gradual wear because it's an expected maintenance cost, not a sudden, insurable event."
}
```

## How It Works

A single-node flow: an **API Request** trigger accepts one input field (`policy_clause`), passes it to a **Generate Text** (LLM) node running a carefully constrained system prompt, and returns the structured JSON via **API Response**.

## Guardrails

The flow is explicitly instructed to never give legal advice or predict claim outcomes — it only explains what language means, not what will happen to a specific claim. See [`constitutions/default.md`](./constitutions/default.md) for the full guardrail definition.

## Tradeoffs & Assumptions

- Handles one clause at a time — no support for uploading a full policy document or comparing multiple clauses
- Categorization (exclusion/condition/definition/limit) is a best-effort classification by the LLM, not a guaranteed legal categorization
- Designed for general property/casualty-style policy language; may be less accurate on highly specialized policy types (e.g. reinsurance treaties)

## Setup

1. Deploy this flow in your own [Lamatic Studio](https://studio.lamatic.ai) project (or use the exported flow as-is)
2. No additional environment variables are required — this is a single-flow template with no app layer
3. Call the deployed flow's API endpoint with a JSON body: `{ "policy_clause": "<your clause text>" }`
