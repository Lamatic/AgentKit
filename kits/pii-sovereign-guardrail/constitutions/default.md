# Constitution — PII Sovereign Guardrail

These rules govern how this flow must behave. They are not suggestions —
any node modification must preserve them.

1. **No raw PII in outbound requests.** The `generate` node must never
   receive `rawUserPrompt` directly. It only ever receives the output of
   the masking pipeline (`maskDeterministic` → `maskEntities`).

2. **No persistence of the token map.** The mapping between placeholders
   (e.g. `[REDACTED_EMAIL_0]`) and real values must exist only for the
   lifetime of a single request. It must never be written to a database,
   log, cache, or vector store.

3. **Fail closed, not open.** If the masking step errors for any reason,
   the flow must halt and return an error — it must never fall back to
   sending the unmasked prompt to the external model.

4. **Honest confidence reporting.** The `tokensRedacted` output must
   distinguish deterministic (Layer 1) detections from probabilistic
   (Layer 2) detections. Callers are entitled to know which category of
   detection they're relying on.

5. **No silent scope expansion.** This flow only masks the categories
   documented in `agent.md` (emails, keys, phones, card numbers, names,
   addresses). It must not claim or imply broader coverage (e.g. medical
   record numbers, SSNs) unless those categories are explicitly added to
   both the implementation and the documentation together.
