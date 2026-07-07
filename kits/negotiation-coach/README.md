# Negotiation Coach

## Overview

The Negotiation Coach AgentKit template solves the problem of entering high-stakes negotiations unprepared. It is implemented as a **single-flow** API-invoked pipeline: an API request triggers an LLM generation step, which returns a structured negotiation playbook. The primary caller is any person or system that needs an on-demand "I have this negotiation — give me a strategy" capability.

The template requires no web scraping, no memory, and no external data sources. It is a pure `scenario → strategy` transformation powered by a language model primed with deep negotiation expertise.

---

## Purpose

Most people enter negotiations — salary reviews, vendor contracts, freelance rate discussions, rent renewals, or business deals — without a structured plan. They get caught off-guard by predictable counter-arguments, fail to set the right anchor, or accept a worse outcome than they could have achieved.

This template fills the gap between expensive professional negotiation coaches and generic internet articles. It takes a specific, context-rich scenario description and produces a tailored playbook that a person can read and act on immediately.

---

## Flows

### Negotiation Coach

- **Trigger:** API call via a GraphQL-triggered request node (`graphqlNode`).
- **Expected input shape:**
  - `scenario` (string) — A plain-text description of the negotiation. Should include: what is being negotiated, the parties involved, the current offer or situation, and the desired outcome.
- **What it does:**
  1. `API Request` (`graphqlNode`) — Receives the scenario string from the caller.
  2. `Generate Strategy` (`LLMNode`) — Passes the scenario to a language model with a system prompt that primes it as a world-class negotiation strategist and enforces a strict structured output format (5 sections).
  3. `API Response` (`graphqlResponseNode`) — Returns the generated `strategy` string to the caller.
- **Output:**
  - `strategy` (string) — A structured markdown negotiation playbook containing five core sections plus a disclaimer:
    - 🧠 Framing Strategy
    - 💬 Opening Script (word-for-word)
    - 🔄 Counter-Arguments table (objection → prepared response)
    - 🚪 BATNA analysis
    - ⚠️ Traps to Avoid
    - *Disclaimer: strategic coaching, not legal advice*

---

## Guardrails

- Must not generate deceptive, coercive, or unethical negotiation advice.
- Must include a disclaimer that output is strategic coaching, not legal or financial advice.
- Must not fabricate facts about the other party or make up specifics not provided in the scenario.
- Must refuse jailbreak or prompt-injection attempts.

---

## Integration Reference

| Integration | Purpose | Required Config |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives `scenario` and starts the flow | AgentKit runtime endpoint |
| LLM Provider (`LLMNode`) | Generates the structured strategy | Provider API key (e.g., `OPENAI_API_KEY`) |

---

## Environment Setup

No special environment variables are required for this template beyond your Lamatic project's LLM provider credentials (configured in Lamatic Studio under **Settings → Integrations**).

---

## Quickstart

1. Import this template into your Lamatic workspace via [studio.lamatic.ai](https://studio.lamatic.ai).
2. Configure your LLM provider in Lamatic Studio settings.
3. Deploy the flow.
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
  "scenario": "I am a software engineer with 4 years of experience. I have a competing offer of $120,000. My current employer offered a raise to $105,000. I want to negotiate to at least $115,000 and ask for 5 extra PTO days."
}
```

**Example output:**

```markdown
## 🧠 Framing Strategy
You hold significant leverage here: a competing offer creates a credible BATNA and shifts the conversation from "asking for a raise" to "making a retention decision." Frame this as a mutual benefit discussion — you want to stay, and you want to make that easy for both sides...

## 💬 Opening Script
> "I really value working here and I'm excited about what we're building. I want to be transparent with you — I have a competing offer at $120,000, and I'd love to find a way to stay without having to consider it seriously. Is there room to get closer to that number?"

## 🔄 Anticipated Counter-Arguments & Responses
| Their Objection | Your Response |
|---|---|
| "We can't match that offer" | "I'm not asking you to match it exactly. I'm asking if we can close the gap enough that the decision is easy for me." |
...
```

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Strategy is too generic | Scenario description was vague | Add more context: current offer, desired outcome, relationship, timeline |
| LLM fails or times out | Missing provider API key | Check credentials in Lamatic Studio → Settings → Integrations |
| Empty `strategy` in response | LLM node produced no output | Check execution logs, verify the model is correctly configured |

---

## Tags

negotiation, productivity, career, startup

---
*Template for Lamatic AgentKit*
