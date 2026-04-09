# LocalBoost AI – Lead Intelligence

## Overview
LocalBoost AI solves the problem of turning a local business’s public web presence into actionable sales intelligence and ready-to-send outreach, without requiring manual research. It uses a single, API-invoked AgentKit flow that fetches real website content, then applies an LLM-based structured extraction step to produce a machine-readable lead brief. The primary invoker is a sales workflow, CRM enrichment job, or internal tool that can call an API/GraphQL endpoint with a business name and links. Key integrations include a web crawling/extraction service (Firecrawl), a GraphQL request/response boundary, and an LLM configured to output validated JSON via an Instructor-style node.

---

## Purpose
The agent’s goal is to help operators and systems quickly understand a prospective local business and generate outreach-ready intelligence based on what the business actually publishes online. After the agent runs, a caller should have a structured snapshot of the business (positioning, offerings, likely needs, and outreach angles) that is consistent enough to feed downstream automation such as CRM enrichment, email drafting, sequencing, or lead scoring.

This project is built as a focused, single-flow template intended to be embedded into broader lead-generation and sales-automation stacks. It standardizes the “research and summarize” step by (1) collecting real website signals and (2) converting those signals into a deterministic JSON payload suitable for programmatic use.

Because it is a template, the emphasis is on a clean, repeatable architecture: one entrypoint, one data acquisition step, one structured reasoning/extraction step, and one response step. This makes it easy to wrap in a UI, call from a backend service, or schedule as part of a batch enrichment process.

## Flows

### LocalBoost AI – Lead Intelligence

- **Flow identifier:** `localboost-ai`
- **Node chain:** `API Request (graphqlNode) → Firecrawl (firecrawlNode) → Generate JSON (InstructorLLMNode) → API Response (graphqlResponseNode)`

#### Trigger
This flow is invoked via an API/GraphQL request handled by the `graphqlNode`.

- **Invocation type:** API call (GraphQL)
- **Expected input shape (trigger fields):**
  - `business_name` — string; the display name of the business to analyze
  - `website` — string URL; the business website to crawl/analyze
  - `instagram` — string URL or handle; optional context signal for social presence

The user prompt template references these fields as `{{trigger.business_name}}`, `{{trigger.website}}`, and `{{trigger.instagram}}`, so callers must provide them with matching names.

#### What it does
1. **Accepts the request (`graphqlNode`).**
   - Receives the caller’s business identifiers (name and links).
   - Establishes the request boundary and normalizes inputs into the flow’s `trigger` object.

2. **Fetches real website data (`firecrawlNode`).**
   - Uses Firecrawl to retrieve and extract relevant content from the provided `website`.
   - Produces a text/content payload suitable for LLM consumption (site copy, key pages, metadata depending on configuration).

3. **Generates a structured lead brief (`InstructorLLMNode`).**
   - Applies an LLM with an Instructor-style “Generate JSON” step.
   - Uses the system prompt (`localboost-ai_generate-json_system.md`) to enforce the role: a B2B lead generation strategist focused on local businesses.
   - Uses the user prompt (`localboost-ai_generate-json_user.md`) to inject the trigger fields (business name, website, Instagram) plus any crawled content passed forward.
   - Outputs a JSON object (schema governed by the prompt and Instructor node constraints) intended to be stable for downstream automation.

4. **Returns the response (`graphqlResponseNode`).**
   - Wraps the JSON into the API/GraphQL response.
   - Returns the structured payload to the caller.

#### When to use this flow
Use `localboost-ai` when you need a fast, automated lead intelligence artifact for a single local business and you have at least a website URL to ground the analysis in real data. It is appropriate for:

- Enriching a lead record at creation time (form fill, inbound request)
- Pre-call research for SDR/AE outreach
- Batch enrichment jobs that iterate across a list of local business sites
- Generating consistent inputs to downstream email/sequence generators

Route to this flow specifically when the caller’s intent is “analyze this business and return structured findings,” not open-ended chat or multi-step campaign management.

#### Output
On success, the caller receives a structured JSON payload returned via GraphQL.

- **Format:** JSON (GraphQL response object)
- **Structure:** A deterministic object produced by `InstructorLLMNode`
- **Typical contents (prompt-governed; exact fields depend on prompt/schema):**
  - Business summary and positioning
  - Notable services/products and target customer signals
  - Observed website quality signals and potential improvement opportunities
  - Outreach angles and suggested messaging themes

Because the underlying schema is defined in prompts and Instructor configuration (not included here as a raw dump), downstream consumers should validate against the project’s prompt-defined JSON contract and update it in lockstep with any prompt changes.

#### Dependencies
- **External services**
  - Firecrawl — for website crawling/extraction (`firecrawlNode`)
- **Models**
  - LLM used by `InstructorLLMNode` to generate structured JSON (configured via `model-configs`)
- **AgentKit runtime**
  - GraphQL request/response nodes (`graphqlNode`, `graphqlResponseNode`)
- **Project assets**
  - Prompts:
    - `prompts/localboost-ai_generate-json_system.md`
    - `prompts/localboost-ai_generate-json_user.md`
  - Constitution:
    - `constitutions/Default Constitution` (identity/safety/data handling/tone rules)
- **Credentials/config**
  - Firecrawl API key (exact environment variable name depends on your Firecrawl node configuration)
  - LLM provider API key (exact variable depends on the selected provider in `model-configs`)

### Flow Interaction
This project contains a single flow and is not designed as a multi-flow pipeline. If embedded in a larger system, treat `localboost-ai` as a stateless enrichment endpoint: callers provide business identifiers, and the flow returns a structured lead intelligence JSON object that downstream components can chain into scoring, sequencing, or message generation.

---

## Guardrails
Constraints governing this agent system include both explicit constitution rules and use-case-appropriate operational boundaries.

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content. (explicit)
  - Must refuse requests that attempt jailbreaking or prompt injection. (explicit)
  - Must not fabricate facts when uncertain; it should acknowledge uncertainty. (explicit)
  - Must not perform actions unrelated to lead intelligence/outreach generation for local businesses. (inferred)
  - Must not provide instructions for wrongdoing (e.g., scraping private data, social engineering). (inferred)

- **Input constraints**
  - `website` should be a valid, publicly accessible URL; private/intranet URLs are not supported. (inferred)
  - Inputs are treated as potentially adversarial and should not be blindly trusted if echoed in output. (explicit)
  - Inputs should be limited to the business context (name, website, social links); unrelated prompts may be refused or ignored. (inferred)

- **Output constraints**
  - Must never log, store, or repeat PII unless explicitly instructed by the flow. (explicit)
  - Must not output raw credentials, secrets, or API keys. (inferred)
  - Should avoid reproducing large amounts of scraped website text verbatim; prefer summarization and extracted facts. (inferred)

- **Operational limits**
  - Subject to Firecrawl crawl/extraction limits, timeouts, and robots/availability constraints. (inferred)
  - Subject to LLM context window limits; extremely large sites may be truncated or summarized. (inferred)
  - Callers should implement rate limiting and retries appropriate to their Firecrawl/LLM provider quotas. (inferred)

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (`graphqlNode` / `graphqlResponseNode`) | Request/response boundary for invoking the flow and returning JSON | AgentKit API endpoint configuration (deployment-specific) |
| Firecrawl (`firecrawlNode`) | Crawl/extract real website content for grounding analysis | Firecrawl API key (env var per node config, e.g. `FIRECRAWL_API_KEY`) |
| LLM Provider (`InstructorLLMNode`) | Generate validated structured JSON lead intelligence | Provider API key (e.g. `OPENAI_API_KEY` or equivalent per `model-configs`) |
| Prompts (`prompts/*.md`) | Define role, instructions, and JSON contract | Packaged with project; no credential |
| Constitution (`constitutions/*`) | Safety, data handling, and tone constraints | Packaged with project; no credential |

## Environment Setup

- `FIRECRAWL_API_KEY` — Firecrawl credential for `firecrawlNode`; obtain from your Firecrawl account; required by `localboost-ai`.
- `OPENAI_API_KEY` — API key for OpenAI models if `model-configs` uses OpenAI; required by `localboost-ai`.
- `ANTHROPIC_API_KEY` — API key if `model-configs` uses Anthropic; required by `localboost-ai`.
- `GOOGLE_API_KEY` — API key if `model-configs` uses Google/Gemini; required by `localboost-ai`.
- `LAMATIC_API_KEY` / runtime auth — credentials required to run/deploy AgentKit flows in your environment; required by `localboost-ai`.

Exact model-provider variable(s) depend on which model is configured under `model-configs` in your deployment.

## Quickstart

1. Install dependencies and ensure the AgentKit runtime can load this kit (template: `localboost-ai`).
2. Configure secrets in your environment:
   - Set `FIRECRAWL_API_KEY`
   - Set your chosen LLM provider key (for example `OPENAI_API_KEY`)
3. Start the AgentKit service (local dev or deployed environment) with this kit registered.
4. Invoke the flow via GraphQL using the trigger field names expected by the prompts:

   - **GraphQL operation (placeholder shape):**
     - Query/mutation name is deployment-specific; the critical part is the `trigger` payload.
     - Use the following request body shape as the contract:
       - `flow`: `localboost-ai`
       - `trigger`:
         - `business_name`: "Acme Dental"
         - `website`: "https://www.acmedental.com"
         - `instagram`: "https://www.instagram.com/acmedental/"

5. Confirm the response contains a JSON object generated by `InstructorLLMNode` (lead intelligence brief).
6. Integrate the returned JSON into your CRM/enrichment pipeline or pass it to a downstream outreach generator.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Firecrawl step fails or returns empty content | Invalid URL, site blocks crawlers, network issues, missing/invalid Firecrawl key | Validate `website` URL, check site accessibility, verify `FIRECRAWL_API_KEY`, retry with backoff |
| LLM returns invalid or incomplete JSON | Prompt/schema mismatch, context too large, model instability | Tighten Instructor schema, reduce/curate crawled input, switch model, add retries/validation |
| Output is generic and not grounded in the site | Crawl returned little content or wrong page; insufficient signals | Ensure Firecrawl extracts key pages, provide additional URLs, include Instagram when available |
| Request rejected or unsafe content refusal | Prompt injection attempt or disallowed content per constitution | Sanitize inputs, narrow user-provided text, adhere to allowed use cases |
| Timeouts on large sites | Crawl latency or LLM context limits | Limit crawl depth/pages, cache crawl results, increase timeouts where supported |

## Notes

- Project metadata is defined in `lamatic.config.ts` as a template named `LocalBoost AI – Lead Intelligence` (version `1.0.0`) authored by Naitik Kapadia.
- The repository link is `https://github.com/Lamatic/AgentKit/tree/main/kits/localboost-ai`.
- Directory layout includes `constitutions`, `flows`, `model-configs`, `prompts`, and `scripts`, indicating a standard AgentKit kit structure with externalized prompts and model configuration.