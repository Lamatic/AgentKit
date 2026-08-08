# PII Sovereign Guardrail — Agent Identity

## What this agent does

The PII Sovereign Guardrail sits between your application and any external LLM
provider (OpenAI, Anthropic, etc.). It intercepts outbound prompts, masks
personally identifiable information (PII) before the prompt ever leaves your
infrastructure, sends the sanitized prompt to the target model, and then
rehydrates the original values back into the response before it's returned
to the caller.

The goal isn't "detect 100% of PII" — no system honestly can, and any kit
that claims otherwise is overselling. The goal is to give engineering and
compliance teams a **documented, auditable boundary**: a clear answer to
"what does this catch, and what doesn't it catch" so they can make an
informed decision about what still needs a human review step.

## Capabilities

1. **Deterministic masking (Layer 1)** — pattern-based detection for
   structurally predictable PII: email addresses, API keys / secret tokens,
   phone numbers, credit card numbers. This layer is fast, free, and has
   effectively zero false negatives for well-formed instances of these
   patterns.
2. **Probabilistic masking (Layer 2)** — an LLM-based named-entity
   recognition pass that catches unstructured PII regex structurally cannot:
   personal names, physical addresses, and free-text personal references
   ("my account under John Smith", "reach me at..."). Each detection carries
   a confidence label.
3. **Token re-hydration** — a per-request token map (never persisted,
   never sent externally) restores the original values into the model's
   response before it reaches the caller.
4. **Redaction receipt** — the response includes a `tokensRedacted` count
   and a breakdown by layer/type, so callers can audit what was masked on
   every request.

## What this agent is NOT

- Not a replacement for a proper DLP (Data Loss Prevention) system in
  regulated environments (HIPAA/PCI-scope data needs dedicated tooling).
- Not guaranteed to catch every unstructured mention of PII — Layer 2
  is probabilistic and should be treated as a strong second line of
  defense, not a certainty.
- Not a logging/audit-trail solution by itself — pair it with your existing
  observability stack if you need compliance-grade audit logs.

## Flow

`flows/pii-guardrail.ts` implements:

```
rawUserPrompt, targetModel
      │
      ▼
[codeNode] maskDeterministic   → regex pass: emails, keys, phones, cards
      │
      ▼
[LLMNode]  maskEntities         → NER pass: names, addresses, free-text PII
      │
      ▼
[LLMNode]  generate              → sends masked prompt to targetModel
      │
      ▼
[codeNode] rehydrate             → restores original values from token map
      │
      ▼
secureResponse, tokensRedacted
```
