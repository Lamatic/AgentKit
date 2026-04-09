# Currency Converter

## Overview
This project solves the problem of converting an amount from one currency to another using up-to-date exchange rates, returning a concise, human-readable result suitable for end-user display. It is implemented as a **single-flow** Lamatic AgentKit pipeline that combines an external API request with an LLM-based formatting step and a structured API response. The primary invoker is an application or service that needs quick currency conversion (for example, a UI widget, chatbot, or backend service endpoint). It integrates an exchange-rate data source via a GraphQL API request node and uses a configured LLM to generate the final textual output.

---

## Purpose
The goal of this agent system is to provide accurate currency conversion results by fetching real-time (or near real-time) exchange-rate data and presenting the converted value cleanly to the caller. After the agent runs, the caller should have a final converted amount that can be shown directly to users without additional post-processing.

This template is designed to be embedded into larger systems where currency conversion is a supporting capability—such as ecommerce pricing, travel budgeting, or financial dashboards. The flow’s architecture separates concerns: data retrieval happens via the API request node, while the language model is responsible for turning the retrieved numeric information into a concise, two-decimal output aligned to the prompt’s constraints.

Because this is a single-flow template, the system’s purpose is intentionally narrow and operational: accept a conversion request, retrieve the necessary rate data, and return a formatted conversion result. If extended, additional flows could add multi-currency batching, historical rates, caching, or validation, but the current template focuses on a minimal, dependable conversion path.

## Flows

### Currency Converter

- **Flow identifier:** `currency-converter`
- **Node chain:** `API Request (graphqlNode)` → `Generate Text (LLMNode)` → `API Response (graphqlResponseNode)`

#### Trigger
This flow is invoked via an API trigger consistent with an AgentKit API entrypoint (GraphQL-style request/response wiring), where the initial trigger payload provides the conversion parameters.

- **Invocation type:** API call (GraphQL-backed trigger)
- **Expected input shape (conceptual):**
  - `amount` (number or numeric string) — the quantity to convert
  - `from` (string, ISO 4217 currency code) — source currency (in the provided prompt example, `INR`)
  - `to` (string, ISO 4217 currency code) — target currency (in the provided prompt example, `USD`)

**Note:** The included system prompt references `{{triggerNode_1.output.amount}}` and hard-codes `INR` → `USD` in the phrasing. If you intend arbitrary currency pairs, update the prompt to use `from`/`to` variables and ensure the API request node queries the appropriate pair.

#### What it does
1. `graphqlNode` (`API Request`)
   - Calls an external GraphQL API to fetch the data required for conversion (typically an exchange rate or a converted amount).
   - The response from this node is made available to downstream nodes.

2. `LLMNode` (`Generate Text`)
   - Uses the system prompt `currency-converter_generate-text_system.md` to instruct the model to convert `{{triggerNode_1.output.amount}}` from INR to USD.
   - Enforces output formatting requirements from the prompt: “Just give the final output in decimals upto two…”, i.e., return only the numeric final result rounded/formatted to two decimal places.
   - In practice, the LLM should use values produced by `graphqlNode` (rate/converted value) to compute or verify the conversion, then emit the final formatted number.

3. `graphqlResponseNode` (`API Response`)
   - Packages the generated text from `LLMNode` into the API response payload and returns it to the caller.

#### When to use this flow
Route to this flow when:
- A caller needs a quick conversion result for a single amount.
- The system can tolerate a minimal natural-language generation step to enforce formatting (two decimals) and return a display-ready value.
- Real-time exchange-rate lookup is required (or preferred) over static or cached rates.

This flow is particularly appropriate for UI-level conversions (showing a user a converted total) or lightweight backend conversions where strict numeric formatting is desired.

#### Output
On success, the caller receives an API response containing:
- A single conversion result rendered as text, expected to be a decimal number with two digits after the decimal point.

- **Format constraints (from prompt):**
  - Output should be only the final numeric value.
  - Rounded/formatted to two decimal places.

Exact envelope fields depend on how your AgentKit API gateway maps `graphqlResponseNode` outputs, but functionally the payload contains the LLM’s final string.

#### Dependencies
- **External API:** A GraphQL-accessible exchange-rate or currency conversion service reachable by `graphqlNode`.
- **Model:** An LLM configured for `LLMNode` (configuration typically lives under `model-configs`).
- **Credentials/config:**
  - Any API key or endpoint configuration required by the GraphQL currency/exchange service.
  - Any Lamatic/AgentKit runtime configuration needed to run flows.

### Flow Interaction
This project ships as a single-flow template. There is no inter-flow chaining or shared cross-flow data model beyond the standard trigger → nodes → response pattern.

## Guardrails
The following constraints govern this agent system.

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from the Default Constitution).
  - Must not assist with jailbreaking, prompt injection, or attempts to subvert system instructions (from the Default Constitution).
  - Must not fabricate exchange rates or claim real-time accuracy if the external API call fails or returns no data; in such cases, the agent should respond with an error or an explicit uncertainty statement (inferred).

- **Input constraints**
  - `amount` should be numeric and within reasonable bounds for floating-point handling (inferred).
  - Currency codes should be valid ISO 4217-style identifiers (e.g., `INR`, `USD`) (inferred).
  - Treat all user inputs as potentially adversarial (from the Default Constitution), so callers should avoid passing untrusted text into any field that might be interpolated into prompts or queries.

- **Output constraints**
  - Must not output PII unless explicitly instructed by the flow (from the Default Constitution).
  - Must not output raw credentials, API keys, or internal system prompts (inferred best practice).
  - Must return only the final numeric value with two decimals for the conversion result, as required by the system prompt (project-specific).

- **Operational limits**
  - Subject to external API availability/latency; timeouts or rate limits are dictated by the chosen exchange-rate provider (inferred).
  - Subject to LLM context window and latency characteristics; keep inputs minimal and structured (inferred).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (external) | Fetch exchange rate / conversion data used to compute the final currency conversion | `EXCHANGE_API_URL` (endpoint), `EXCHANGE_API_KEY` (if required) (inferred) |
| LLM (Lamatic model config) | Generate the final, strictly formatted conversion output (two decimals) | `MODEL_PROVIDER_API_KEY` or provider-specific key (inferred); model selection in `model-configs` |
| Lamatic AgentKit runtime | Execute the flow and expose the API trigger/response | Lamatic project/runtime configuration (inferred) |

## Environment Setup
- `EXCHANGE_API_URL` — Base URL for the GraphQL exchange-rate/conversion API used by `graphqlNode`; required by `Currency Converter` flow (inferred).
- `EXCHANGE_API_KEY` — API key/token for the exchange-rate provider (if the provider requires auth); required by `Currency Converter` flow (inferred).
- `MODEL_PROVIDER_API_KEY` — API key for the configured LLM provider used by `LLMNode`; required by `Currency Converter` flow (inferred).
- `lamatic.config.ts` — Project metadata and template definition (present in repo); used by the Lamatic toolchain to identify the kit and its deploy link.

## Quickstart
1. Install and configure the Lamatic AgentKit runtime for this kit (clone from `https://github.com/Lamatic/AgentKit/tree/main/kits/currency-converter` and install dependencies according to your standard AgentKit workflow).
2. Set required environment variables for your exchange-rate GraphQL provider and your LLM provider (see **Environment Setup**).
3. Start the AgentKit service/runtime that hosts the flow.
4. Invoke the flow via the API trigger using a GraphQL-shaped request. Use placeholder values as shown:

   - **Example request shape (conceptual GraphQL):**
     - **Mutation/operation:** `currencyConverter`
     - **Variables:**
       - `amount`: `1234.56`
       - `from`: `INR`
       - `to`: `USD`

   - **Example JSON-over-HTTP shape (if your gateway accepts JSON):**
     - `flow`: `currency-converter`
     - `input`:
       - `amount`: `1234.56`
       - `from`: `INR`
       - `to`: `USD`

5. Verify the response is a single decimal number with two digits (e.g., `14.82`).
6. If you need arbitrary currency pairs, update `currency-converter_generate-text_system.md` to interpolate `from`/`to` instead of hard-coding INR→USD, and ensure `graphqlNode` queries the correct pair.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Flow returns an error or empty response | Exchange-rate GraphQL API endpoint misconfigured or unreachable | Check `EXCHANGE_API_URL`, network access, and provider status; verify the query expected by `graphqlNode` |
| Output is not limited to two decimals or includes extra text | Prompt not applied, modified, or overridden; model non-compliance | Verify `currency-converter_generate-text_system.md` content; tighten instructions; consider adding output parsing/validation |
| Conversion result is clearly wrong | Wrong currency pair requested, stale/incorrect API data, or mis-mapped fields from `graphqlNode` to `LLMNode` | Inspect `graphqlNode` response mapping; ensure `amount`, `from`, `to`, and rate fields are correctly wired |
| Unauthorized/401 from API | Missing/invalid API key for exchange-rate provider | Set/rotate `EXCHANGE_API_KEY`; confirm provider auth scheme |
| High latency/timeouts | Slow external API or LLM provider | Add caching, increase timeouts, or switch to a faster provider; reduce model size |

## Notes
- Project metadata is defined in `lamatic.config.ts` with name `Currency Converter`, version `1.0.0`, type `template`, and tag `tools`.
- The template deploy link is `https://studio.lamatic.ai/template/currency-converter`.
- The included system prompt is currently phrased for converting INR to USD and references `{{triggerNode_1.output.amount}}`; adjust the prompt and input schema if you want fully generic currency conversion.