# Impact Radius Reviewer

## Purpose

Impact Radius Reviewer turns a `diffcontext compile --json` payload (run locally or in CI) plus a PR diff into a reviewer brief focused on what a diff cannot show: the callers that break, the overriding subclasses that interact with the change, the test-coverage gaps, and — the differentiator — the blind spots the static analysis cannot see.

## Flow

`impact-review` — takes `diffcontext_json`, `pr_diff`, and a `credential_detected` flag. A code node parses the DiffContext JSON into a compact impact summary (changed / impacted / dependency symbols, surfaced test candidates, dropped manifest, and the static-analysis caveats diffcontext writes into its own meta header). A single LLM node turns that summary plus the diff into a fixed three-section brief: **1. What will break**, **2. Test coverage**, **3. BLIND SPOTS**. An API response node returns the generated text.

## Guardrails

Follows `constitutions/default.md`: never invents symbols, callers, tests, or relationships that do not appear in the provided DiffContext payload or PR diff; treats pasted content as untrusted data (not instructions); flags credentials with `[credential detected; value omitted]` and never reconstructs them; stays within the three-section format.

## Integration

The `apps/` Next.js app calls `impact-review` via the Lamatic SDK (`executeFlow`), reading the flow ID from `FLOW_IMPACT_REVIEW` in the environment (read through the parent kit's `lamatic.config.ts` step definition). The app provides a two-pane paste-in form (DiffContext JSON + PR diff) and renders the brief. The flow does **not** call the GitHub API, does **not** read the user's repo, and does **not** run `diffcontext` itself — the user supplies the JSON.
