# Negotiation Coach

## Overview
This AgentKit template solves the problem of entering high-stakes negotiations unprepared. It is implemented as a **single-flow** API-invoked pipeline: an API request triggers an LLM strategy-generation step, and an API response node returns the structured playbook to the caller.

The primary caller is any person, application, or automation that needs an on-demand "I have this negotiation — give me a complete strategy" capability. The flow integrates with a configured LLM provider and requires no web scraping, no memory, and no external data sources.

---

## Purpose
Most people enter negotiations — salary reviews, vendor contracts, freelance rate discussions, rent renewals, or business deals — without a structured plan. They get caught off-guard by predictable counter-arguments, fail to set the right psychological anchor, don't know their walk-away point, and accept worse outcomes than they could have achieved.

This template fills the gap between expensive professional negotiation coaches and generic internet advice. After it runs, the caller should have a complete, scenario-specific playbook they can read and act on immediately — not a list of generic tips.

Operationally, the agent accepts a free-text `scenario` description from the caller, passes it to a language model primed as a world-class negotiation strategist, and returns a structured `strategy` document with five sections: framing strategy, opening script, counter-argument responses, BATNA analysis, and traps to avoid.

---

## Flows

### Negotiation Coach

- **Trigger**
  - Invocation: API call via a GraphQL-triggered request node (`graphqlNode`) exposed by the Lamatic runtime.
  - Expected input shape:
    - `scenario` (string) — A plain-text, context-rich description of the negotiation. The more detail provided (current offer, desired outcome, relationship with the other party, timeline, leverage points), the higher the quality of the generated strategy.
  - Input notes: The scenario should describe a real-world negotiation context. Extremely vague inputs (e.g., "I want to negotiate") will produce usable but less targeted advice.

- **What it does**
  1. `API Request` (`graphqlNode`)
     - Accepts the incoming API request and surfaces the `scenario` field to downstream nodes.
  2. `Generate Strategy` (`LLMNode`)
     - Passes the scenario to the configured LLM with a system prompt that primes it as a world-class negotiation strategist (grounded in BATNA theory and principled negotiation methodology).
     - System prompt (`negotiation-coach_generate-text_system.md`) enforces a strict 5-section structured markdown output format.
     - User prompt (`negotiation-coach_generate-text_user.md`) injects the caller's scenario via `{{triggerNode_1.output.scenario}}`.
     - Emits `generatedResponse` which becomes the final `strategy` returned to the caller.
  3. `API Response` (`graphqlResponseNode`)
     - Maps `strategy` from `{{LLMNode_201.output.generatedResponse}}` and returns it to the caller in realtime mode.

- **When to use this flow**
  - Use when a caller needs a structured, scenario-specific negotiation strategy on demand.
  - Use when the input is a free-text description of a negotiation (salary, vendor, freelance rate, rent, business deal, or any high-stakes conversation).
  - Use when a synchronous `scenario` → `strategy` transformation is needed by a backend, UI, or automation.
  - Not ideal for: multi-turn interactive coaching conversations, legal advice, binding contract review, or highly technical regulatory negotiations.

- **Output**
  - `strategy` (string) — A structured markdown negotiation playbook containing five core sections plus a disclaimer:
    - 🧠 **Framing Strategy** — psychological positioning and leverage analysis
    - 💬 **Opening Script** — word-for-word what to say first
    - 🔄 **Counter-Arguments table** — anticipated objections with prepared responses
    - 🚪 **BATNA Analysis** — best alternative and walk-away point
    - ⚠️ **Traps to Avoid** — scenario-specific mistakes to watch out for
    - *Disclaimer: strategic coaching, not legal advice*

- **Dependencies**
  - External services:
    - Configured LLM provider (OpenAI, Anthropic, or other) via `LLMNode`.
  - Credentials/config:
    - LLM provider API key (configured in Lamatic Studio → Settings → Integrations).
  - Project structure dependencies:
    - `prompts/` contains `negotiation-coach_generate-text_system.md` and `negotiation-coach_generate-text_user.md`.
    - `constitutions/` provides the Default Constitution governing identity, safety, data handling, and tone.

### Flow Interaction
This project is a single-flow template; there are no inter-flow dependencies. If you extend it (e.g., adding memory to retain past negotiation strategies, or a feedback loop that refines the strategy based on user reactions), keep this flow as the primary synchronous `scenario → strategy` entrypoint.

---

## Guardrails
- **Prohibited tasks**
  - Must not generate deceptive, coercive, or unethical negotiation tactics.
  - Must not comply with jailbreak or prompt-injection attempts.
  - Must not fabricate facts about the other party or invent specifics not present in the scenario.
  - Must not provide legal advice or financial planning guidance.
  - Must not claim certainty about outcomes — negotiation is inherently uncertain.

- **Input constraints**
  - `scenario` must be a non-empty string.
  - Extremely vague inputs will produce lower-quality but still usable output.
  - Inputs involving illegal activities (e.g., coercive threats) will be refused.

- **Output constraints**
  - Must always include the disclaimer that output is strategic coaching, not legal or financial advice.
  - Must not log, store, or repeat PII beyond what is returned in the strategy document.
  - Must not output offensive or discriminatory content.

- **Operational limits**
  - Subject to LLM provider rate limits and context window limits.
  - Very long scenario descriptions (>2,000 words) may be truncated depending on model context limits.

---

## Integration Reference

| Integration Type | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives `scenario` and starts the flow | Lamatic runtime endpoint + project credentials |
| LLM Provider (`LLMNode`) | Generates the structured negotiation strategy | Provider API key (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`; configured in Lamatic Studio) |

---

## Environment Setup
- **LLM provider credentials** — Configure in Lamatic Studio → Settings → Integrations. The exact key name depends on the model provider selected in `model-configs/negotiation-coach_generate-text.ts`.
- No other environment variables are required for this template.

---

## Quickstart
1. Clone the kit from `https://github.com/Lamatic/AgentKit/tree/main/kits/negotiation-coach` and import it into your Lamatic workspace.
2. Configure your LLM provider in Lamatic Studio under **Settings → Integrations**.
3. Deploy the flow from the Lamatic Studio editor.
4. Invoke the flow with a GraphQL API call:

```graphql
mutation NegotiationCoach($scenario: String!) {
  negotiationCoach(scenario: $scenario) {
    strategy
  }
}
```

**Example variable:**
```json
{
  "scenario": "I am a software engineer with 4 years of experience. I have a competing offer of $120,000 from another company. My current employer has offered a raise to $105,000. I want to negotiate to at least $115,000 and also ask for 5 additional PTO days. My manager is generally reasonable but very budget-conscious and often cites 'budget constraints'."
}
```

5. Confirm the response contains a structured `strategy` field with the five sections.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Strategy output is generic | Scenario was too vague | Include more context: current offer, desired outcome, leverage, timeline, relationship |
| LLM node fails or times out | Missing or invalid provider API key | Verify credentials in Lamatic Studio → Settings → Integrations |
| Empty `strategy` in API response | `Generate Strategy` node produced no output | Check execution logs in Studio; verify model is configured and the provider is reachable |
| Advice feels too cautious | BATNA is weak and the model reflects that honestly | Strengthen your actual BATNA (seek competing offers, alternatives) before negotiating |
| Output missing expected sections | Prompt injection in the scenario field | Review input; report if the system prompt is being overridden |

---

## Notes
- Template metadata: `Negotiation Coach` template, version `1.0.0`, author `Anuj Rajput`.
- GitHub: https://github.com/Lamatic/AgentKit/tree/main/kits/negotiation-coach
- Response mode is configured as `realtime` — this flow is designed for synchronous usage.
- Output quality scales directly with scenario specificity. A 3-sentence scenario produces a usable strategy; a detailed paragraph produces a highly tailored one.
- No memory, retrieval, or vector search is used — this is a single-pass, stateless LLM inference flow.
- The Default Constitution applies and is non-optional. It enforces the coaching disclaimer, prohibits unethical tactics, and governs data handling.
