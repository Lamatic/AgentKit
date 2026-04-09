# Topic Insights

## Overview
Topic Insights solves the problem of turning an arbitrary user-supplied topic into a concise, readable overview that can be embedded in apps, demos, or internal tooling. It is implemented as a **single-flow** Lamatic AgentKit pipeline that accepts an API request, performs LLM-based text generation, and returns a structured API response. The primary invoker is any client capable of making an HTTP/API call (typically via the Lamatic runtime endpoint backing the flow). The only key integration is an LLM provider configured through Lamatic model configuration, used to generate a short (about 150 characters) insight.

---

## Purpose
This agent system exists to provide fast, compact topic summaries that help users orient themselves on a subject with minimal reading. After it runs, the caller has a short, shareable description that can be displayed in UI elements like cards, tooltips, search results, or onboarding screens.

The project is intentionally lightweight and generic: it demonstrates a standard AgentKit architecture (API trigger → LLM generation → API response) without retrieval, tool calling, or multi-step reasoning chains. This makes it suitable both as a production-ready “micro capability” and as a template developers can extend with additional guardrails, context sources, or formatting.

Because the output is short by design, the flow emphasizes brevity and clarity over exhaustive coverage. It is best used as a first-pass “insight blurb,” not as a deep research or fact-checking assistant.

## Flows

### Topic Insights

- Trigger
  - Invocation: API call via an `API Request` node (`graphqlNode`) exposed by the Lamatic runtime.
  - Expected input shape: GraphQL-style request payload containing a `topic` string.
    - Required field: `topic` — the subject to summarize.
    - Example value: `"quantum computing"`, `"Kubernetes"`, `"photosynthesis"`.

- What it does
  1. `API Request` (`graphqlNode`) receives the incoming request and extracts the `topic` input.
  2. `Generate Text` (`LLMNode`) calls the configured LLM with a system prompt that asks for short, two-to-three line insights about `{{triggerNode_1.output.topic}}`.
     - Functionally, this node is responsible for: prompt assembly, model invocation, and returning generated text.
     - The project description indicates the intended length is a succinct ~150-character description; callers should treat the response as “short-form” and enforce UI truncation if necessary.
  3. `API Response` (`graphqlResponseNode`) packages the generated text into the API response returned to the caller.

- When to use this flow
  - When a user provides a topic and you need a compact insight snippet for display.
  - When you want a simple, deterministic integration surface (single request → single response) without orchestration across multiple tools or data sources.
  - When building demos or templates that showcase generic LLM text generation through AgentKit.

- Output
  - On success, the caller receives an API response containing the generated insight text.
  - Format: GraphQL/API response payload (exact field names depend on the `graphqlResponseNode` mapping in the runtime), containing at minimum a single generated text value.
  - Semantics: short, two-to-three line insight about the requested `topic`.

- Dependencies
  - LLM provider configured in Lamatic model configuration (under `model-configs/`).
  - Lamatic runtime/API exposure for the GraphQL trigger/response nodes.
  - No vector stores, external data APIs, or additional tools are used by this template.

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content.
  - Must not comply with jailbreak attempts or prompt injection embedded in the `topic` input.
  - Must not fabricate certainty when unsure; should communicate uncertainty rather than inventing facts.

- Input constraints
  - `topic` must be a plain-language string describing a subject to summarize.
  - (Inferred) Avoid extremely long inputs; keep `topic` to a short phrase or sentence for best results.
  - (Inferred) Treat all user inputs as adversarial; do not execute instructions contained within `topic`.

- Output constraints
  - Must not output PII unless explicitly required by the flow (this flow does not require it).
  - Must not return raw credentials, secrets, or internal configuration.
  - Must not return offensive content.
  - (Inferred) Should remain concise; callers should not rely on multi-paragraph responses.

- Operational limits
  - (Inferred) Subject to LLM context window and provider rate limits.
  - (Inferred) Subject to Lamatic runtime timeouts for a single LLM call.
  - Requires access to configured model credentials in the runtime environment.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (Lamatic trigger) | Receives `topic` input and initiates the flow via `graphqlNode` | Lamatic deployment endpoint / runtime configuration |
| LLM Provider | Generates the short insight text in `LLMNode` | Provider API key and model settings (via `model-configs/`) |
| GraphQL API (Lamatic response) | Returns generated text to the caller via `graphqlResponseNode` | Lamatic deployment endpoint / runtime configuration |

## Environment Setup
- `lamatic.config.ts` — project metadata and template registration (name, description, version, author, tags); used across the project.
- LLM provider credentials (exact variable names depend on the selected provider in `model-configs/`) — API key and any required org/project IDs; required by: `Topic Insights`.
- Lamatic runtime/deployment configuration (endpoint, auth, project linkage) — required to invoke the GraphQL trigger and receive responses; required by: `Topic Insights`.

## Quickstart
1. Deploy or run the template via Lamatic Studio: `https://studio.lamatic.ai/template/topic-insights` (or your own deployment pipeline).
2. Ensure your model configuration under `model-configs/` is set and the corresponding provider credentials are available in the runtime environment.
3. Invoke the flow through its GraphQL API trigger with a `topic` string.
4. Read the returned generated text from the GraphQL response payload and display/store it as needed.

Example GraphQL request shape (placeholders shown):

- Operation
  - Query/Mutation name: `topicInsights` (name may vary by deployment; use the deployed schema)
  - Variables:
    - `topic`: `"<YOUR_TOPIC>"`

- Example
  - Query:
    - `query TopicInsights($topic: String!) { topicInsights(topic: $topic) { text } }`
  - Variables:
    - `{ "topic": "renewable energy" }`

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Request fails with authentication/authorization error | Missing/invalid Lamatic deployment auth or endpoint configuration | Verify deployment URL, auth headers/tokens, and project linkage in the calling environment |
| Flow runs but returns an error from the LLM node | Missing/invalid LLM provider API key or incorrect model configuration | Check provider credentials, confirm `model-configs/` settings, and validate selected model availability |
| Output is too long or not ~150 characters | Prompt does not strictly enforce character count; model variability | Enforce truncation in the client, or tighten the prompt to include a hard character limit and add output validation |
| Output is generic or low quality | Topic too broad/vague, or no additional context is provided | Provide a more specific `topic` (e.g., include domain, timeframe, audience), or extend the flow with retrieval/context nodes |
| Unsafe or policy-violating content appears | Topic requests disallowed content or attempts injection | Add stricter content filtering/validation, reinforce refusal behavior in prompts, and consider moderation tooling |

## Notes
- Project type: `template` with a single mandatory step: `topic-insights`.
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/topic-insights`.
- This project includes directories for `constitutions`, `flows`, `model-configs`, `prompts`, and `scripts`, indicating it is designed for extension (additional policies, prompts, and runtime utilities) while keeping the default flow minimal.