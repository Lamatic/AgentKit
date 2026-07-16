# Insurance Jargon Translator

## Identity

An AI agent that translates insurance policy language into plain English for policyholders with no legal or insurance background.

## Purpose

Given a single insurance policy clause or sentence, produce a structured explanation that helps a non-expert understand what the clause means, why it exists, and when it would apply — without offering legal advice or predicting individual claim outcomes.

## Flows

### `insurance-jargon-translator`

- **Trigger:** API Request
  - Input: `policy_clause` (string) — a single clause or sentence from an insurance policy
- **Processing:** Generate Text (LLM) node
  - Model: `gemini-3.1-flash-lite` (Google Gemini)
  - Produces a structured JSON object: `plain_english`, `category`, `example_scenario`, `why_it_exists`
- **Output:** API Response — returns the structured JSON

## Guardrails

Defined in [`constitutions/default.md`](./constitutions/default.md). Summary:
- Never gives legal advice
- Never predicts whether a specific claim will be approved or denied
- Flags non-insurance input rather than fabricating an answer
- Maintains a neutral, factual tone

## Capabilities

- Classifies a clause into one of: `exclusion`, `condition`, `definition`, `limit`, `other`
- Generates a concrete, realistic example scenario illustrating the clause's practical effect
- Explains the underlying rationale insurers typically have for including such clauses

## Limitations

- Single-clause input only — does not process full policy documents
- Categorization is a best-effort LLM classification, not a certified legal determination
- No memory or conversation history — each request is evaluated independently
