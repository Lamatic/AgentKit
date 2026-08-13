# PII Sovereign Guardrail — Agent Identity

## What this agent does

The PII Sovereign Guardrail sits between your application and the target LLM
you're protecting against (OpenAI, Anthropic, etc.). It masks personally
identifiable information (PII) using two layers before that target model
ever sees the prompt, then rehydrates the original values back into the
response. Layer 2 (LLM-based NER) is itself an external LLM call used to
detect unstructured PII — it does see residual names/addresses that Layer 1
didn't catch, in order to find and mask them. The guarantee this kit makes
is specifically about the target model call, not every intermediate
processing step — see "What this agent is NOT" below for the full boundary.

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
