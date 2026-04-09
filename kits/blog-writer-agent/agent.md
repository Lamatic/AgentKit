# Blog Writer Agent

## Overview
This project solves the problem of producing a well-researched blog post quickly by automating source discovery, content drafting, and tone-aligned editing. It is implemented as a **single-flow** Lamatic AgentKit pipeline that combines an agent supervisor loop with tool-calling steps for web search and page scraping. The primary invoker is an external application (or Lamatic Studio) calling the flow via a GraphQL API request, providing a `topic` and desired `tone`. Key integrations include a web search provider, a web scraper, and one or more LLMs used for drafting and editorial refinement.

---

## Purpose
The agent’s goal is to turn a user’s intent (“write a blog about X in tone Y”) into a publishable, coherent blog post grounded in an external source. After the agent runs, the caller should have a structured piece of writing that reads consistently in the requested tone and is informed by relevant information gathered from the open web.

Operationally, the system aims to reduce the manual steps typically involved in blog creation: researching reputable sources, extracting salient facts, creating an initial draft, and then editing for style and clarity. The flow is designed so the research phase is automated via search + scraping, and the writing phase is performed by LLM steps that draft and then edit the content.

Because this kit is a template, it is intended to be adapted: you can swap search/scraper providers, adjust prompts for different editorial standards, or add attribution/citation requirements depending on deployment needs.

## Flows

### Blog Writer Agent

- **Trigger**
  - Invocation: GraphQL API request (via `API Request (graphqlNode)` in AgentKit).
  - Expected input shape (conceptual):
    - `topic` — the subject to write about (string)
    - `tone` — the desired writing tone/style (string)
  - Notes on prompt wiring:
    - The editing prompt explicitly references `triggerNode_1.output.tone`.

- **What it does**
  1. `API Request (graphqlNode)` receives the caller’s input (topic/tone and any additional request fields configured in the trigger).
  2. `Supervisor (agentNode)` orchestrates the research-and-write loop. This node is responsible for guiding the pipeline’s decision-making and coordinating subsequent steps.
  3. `Agent Loop End (agentLoopEndNode)` closes the supervisor-driven loop, passing forward the consolidated intermediate result (e.g., an initial writeup or plan) for downstream processing.
  4. `Web Search (webSearchNode)` searches the internet for relevant sources about the requested topic and returns a set of results (titles/snippets/URLs depending on provider).
  5. `Generate Text (LLMNode)` produces an initial blog write-up based on the topic and the research context available at this point in the flow.
  6. `Generate Text (LLMNode)` performs editorial refinement. Based on the provided prompt assets, this step acts like an editor that revises the write-up to match the requested `tone` and improve quality.
  7. `Extract Link (codeNode)` parses the preceding outputs and selects/extracts the most relevant URL to use as the primary reference for scraping.
  8. `Scraper (scraperNode)` fetches and extracts the main content from the selected URL.
  9. `Extract Final Content (codeNode)` post-processes the scraped content and/or the revised blog text to produce the final response payload (e.g., clean text, derived fields, or normalized structure).
  10. `API Response (graphqlResponseNode)` returns the final output to the caller via GraphQL.

- **When to use this flow**
  - Use this flow when you need a single-shot, end-to-end blog generation pipeline that:
    - starts from a topic,
    - grounds itself in at least one web source,
    - and produces tone-aligned prose suitable for publication or further human review.
  - This is the primary (and only) flow in the kit, so all requests for blog generation should route here.

- **Output**
  - Returned via `API Response (graphqlResponseNode)`.
  - Exact schema depends on the GraphQL trigger/response configuration in the flow, but typically includes:
    - `content` / `blog` / `writeup` — the final blog text (string)
    - optionally: `sourceUrl` — the URL selected and scraped (string)
    - optionally: any metadata produced by code nodes (e.g., extracted title, summary)

- **Dependencies**
  - LLM provider for `Generate Text (LLMNode)` steps (model configuration is expected under `model-configs/`).
  - Web search provider backing `webSearchNode` (requires its corresponding API key/credentials).
  - Scraping capability backing `scraperNode` (may require an API key or may run as a hosted Lamatic integration depending on configuration).
  - Prompt assets under `prompts/`:
    - `blog-writer-agent_supervisor_system.md` — supervisor system instructions.
    - `blog-writer-agent_generate-text_system.md` — editor/system instructions for revision.
    - `blog-writer-agent_generate-text_user.md` — user prompt template including `TONE : {{triggerNode_1.output.tone}}` and `WRITEUP : {{agentNode_549.output.writeup}}`.
  - Constitution under `constitutions/`:
    - Default Lamatic constitution governing identity, safety, data handling, and tone.

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must refuse jailbreak or prompt-injection attempts (from constitution).
  - (Inferred) Must not provide definitive medical/legal/financial advice framed as professional guidance; if such topics are requested, the output should be informational and include appropriate uncertainty and cautions.

- **Input constraints**
  - (Inferred) `topic` should be a plain-language string describing the desired blog subject.
  - (Inferred) `tone` should be a short descriptor (e.g., “professional”, “friendly”, “academic”, “witty”).
  - (Inferred) Inputs should not include credentials, secrets, or third-party personal data; the system is not designed to process or store sensitive data.

- **Output constraints**
  - Must not output PII unless explicitly instructed by the flow (from constitution).
  - Must not fabricate information when uncertain; should say so (from constitution).
  - (Inferred) Should avoid verbatim reproduction of large portions of scraped content; scraped material should be used for grounding and summarization, and any direct quotations should be limited and attributed as required by your organization’s policy.
  - (Inferred) Must not return raw credentials, API keys, or internal configuration values.

- **Operational limits**
  - (Inferred) Subject to third-party rate limits and availability for search and scraping providers.
  - (Inferred) Subject to LLM context window limits; extremely long scraped pages or overly broad topics may reduce quality.
  - (Inferred) Network timeouts or blocked pages (robots/anti-bot/CAPTCHA) may prevent scraping.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (`graphqlNode`, `graphqlResponseNode`) | Receive inputs and return the generated blog content | Lamatic runtime GraphQL trigger/response configuration (project/flow deployment config) |
| LLM (`LLMNode`) | Draft and edit blog content; tone alignment | LLM provider key (e.g., `OPENAI_API_KEY` or equivalent per `model-configs/`) and model selection |
| Web Search (`webSearchNode`) | Find relevant sources for the topic | Search provider API key (provider-specific) |
| Web Scraper (`scraperNode`) | Fetch and extract content from selected URL | Scraper service key/config (provider-specific) |
| Code nodes (`codeNode`) | Parse search/LLM outputs; extract URL; normalize final payload | None (runs in Lamatic execution environment) |

## Environment Setup

- `OPENAI_API_KEY` (or your configured LLM provider key) — credentials for the LLM used by `LLMNode`; required by `Blog Writer Agent`.
- `WEB_SEARCH_API_KEY` (provider-specific) — credentials for `webSearchNode`; required by `Blog Writer Agent`.
- `SCRAPER_API_KEY` (provider-specific) — credentials for `scraperNode`; required by `Blog Writer Agent`.
- `lamatic.config.ts` — project metadata and template definition (name, description, version, links).
- `constitutions/` — includes the default constitution that enforces safety and data handling constraints.
- `prompts/` — prompt templates used by supervisor and editor LLM steps.
- `model-configs/` — model settings for the LLM nodes (exact filenames/keys depend on your Lamatic setup).

## Quickstart

1. Install dependencies and ensure you can run/deploy AgentKit flows in your environment (Lamatic Studio or your AgentKit runtime).
2. Configure credentials for your chosen providers (LLM, web search, scraper) using your runtime’s secret management.
3. Deploy the template from Lamatic Studio or from the repository link:
   - Deploy: https://studio.lamatic.ai/template/blog-writer-agent
   - Source: https://github.com/Lamatic/AgentKit/tree/main/kits/blog-writer-agent
4. Invoke the flow via GraphQL, passing `topic` and `tone`.
5. Validate the response contains the final blog content and that the tone matches the request.

Example GraphQL call shape (placeholders):

- Operation name: `blogWriterAgent` (your deployment may expose a different field name)
- Variables:
  - `topic`: "<TOPIC>"
  - `tone`: "<TONE>"

Example (conceptual):

- Query:
  - `mutation blogWriterAgent($topic: String!, $tone: String!) { blogWriterAgent(topic: $topic, tone: $tone) { content sourceUrl } }`
- Variables:
  - `{ "topic": "Remote work best practices", "tone": "professional and concise" }`

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Web search returns empty/irrelevant results | Missing/invalid search API key; overly broad topic; provider outage | Verify `WEB_SEARCH_API_KEY`; narrow the topic; retry; check provider status/logs |
| Scraper fails (timeout, blocked, empty content) | Target site blocks bots/CAPTCHA/robots; network timeout; scraper misconfigured | Try a different source URL; adjust scraper settings/provider; increase timeouts if supported |
| Output is off-tone or inconsistent | `tone` input vague; prompt mismatch; LLM temperature/model choice | Use more specific `tone` (e.g., “friendly, first-person”); tune prompts; adjust model config |
| Hallucinated facts or ungrounded claims | Insufficient grounding from search/scrape; topic too niche; LLM overconfident | Strengthen prompts to require citations; add additional retrieval steps; add verification pass |
| Response schema missing expected fields | GraphQL response mapping not aligned with code node output | Update `graphqlResponseNode` mapping; ensure `Extract Final Content (codeNode)` outputs required keys |
| Flow execution fails at LLM nodes | Missing LLM API key; model not available; rate limits | Check LLM credentials; confirm model name in `model-configs/`; implement retries/backoff |

## Notes

- This kit is distributed as a Lamatic AgentKit **template** (`type: template`) with a single mandatory step/flow: `blog-writer-agent`.
- Prompt files indicate a two-stage writing process: one stage produces a write-up, and a later stage edits it as an “editor” to match the requested tone.
- The project includes standard directories: `constitutions`, `flows`, `model-configs`, `prompts`, `scripts`.