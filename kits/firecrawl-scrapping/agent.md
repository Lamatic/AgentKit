# Firecrawl Scrapping

## Overview
This AgentKit template solves the problem of turning a single starting URL into a crawl job that discovers pages and forwards their content onward for downstream indexing. It is implemented as a **single-flow** Lamatic AgentKit pipeline, invoked via an API request and completed within the same request/response cycle. The primary caller is a developer system (or operator) that wants to programmatically initiate crawling and then hand off discovered pages to a webhook-driven indexing flow or external ingestion system. The key integration is a Firecrawl-powered crawler node, with the flow orchestrated through Lamatic’s `API Request` and `API Response` GraphQL nodes.

---

## Purpose
The goal of this agent system is to reliably kick off a controlled crawl of a webpage (typically starting from a root URL) and produce crawl results that can be sent to an external webhook flow for indexing. After the agent runs, the “state of the world” is improved by having a set of discovered pages (and associated crawl artifacts) ready for ingestion into search, RAG corpora, or document stores.

Operationally, this template provides the “front door” for crawling: it standardizes how callers submit a crawl request, ensures the crawl executes in a repeatable way, and returns a structured API response that can be monitored and integrated into automation.

Although this kit includes only one runnable flow, it is explicitly designed to be part of a larger pipeline: crawl here, then route pages to a webhook/indexer flow elsewhere. This separation keeps crawling concerns (URL discovery, crawl configuration, throttling) distinct from indexing concerns (chunking, embeddings, vector storage, metadata normalization).

## Flows

### `firecrawl-scrapping`

- **Trigger**
  - Invoked via an `API Request` GraphQL entry node (`graphqlNode`).
  - Expected input shape (conceptual):
    - `url` — the starting webpage to crawl.
    - Optional crawl controls (if enabled in the underlying node configuration), such as:
      - `maxDepth`, `limit`, `includePatterns`, `excludePatterns`
      - `webhookUrl` or a downstream destination identifier for forwarding results
  - Note: The exact field names are determined by the configured GraphQL schema on `graphqlNode`. If you change the schema, update clients accordingly.

- **What it does**
  1. `API Request` (`graphqlNode`) receives a GraphQL call from the client and validates/parses the crawl request parameters.
  2. `Crawler` (`crawlerNode`) starts the crawling process for the provided `url`. Functionally, it:
     - Fetches the starting page
     - Discovers additional pages (subject to configured constraints such as depth, limits, allow/deny rules)
     - Collects crawl outputs (page URLs and, depending on configuration, page content and metadata)
     - Sends discovered pages to a webhook flow to commence indexing the document (as described by the project template).
  3. `API Response` (`graphqlResponseNode`) returns a structured response to the caller indicating crawl initiation/completion status and any available results/identifiers.

- **When to use this flow**
  - Use when you need to initiate a crawl from an API call and forward discovered pages into an external indexing pipeline.
  - Use when the system of record for indexing is outside this kit (e.g., another AgentKit webhook flow, a custom ingestion service, or a queue-based pipeline).
  - Do not use for interactive Q&A, retrieval, or summarization; this kit is focused strictly on crawling/forwarding.

- **Output**
  - Returned via `graphqlResponseNode` as a GraphQL response.
  - Typical success output (conceptual):
    - `status` — success/failure indicator
    - `crawlId` or `jobId` — identifier for tracking (if the crawler emits one)
    - `pages` — list of discovered pages or a count/summary (depending on crawler configuration)
    - `errors`/`warnings` — any crawl issues encountered
  - Note: The exact response fields are defined by the GraphQL schema configured in the flow.

- **Dependencies**
  - Lamatic AgentKit runtime
  - Firecrawl integration used by `crawlerNode`
  - Network egress to the target websites being crawled
  - Credentials/config required by the crawler provider (commonly an API key)
  - A reachable downstream webhook endpoint if forwarding is enabled/configured

### Flow Interaction
This project contains a single runnable flow (`firecrawl-scrapping`). Conceptually, it is intended to feed a separate webhook-driven indexing flow: the crawler discovers pages and forwards them onward. That downstream flow is not included in this kit, so operators should ensure the webhook destination exists, is reachable, and can accept the payload shape emitted by the crawler.

## Guardrails

- **Prohibited tasks**
  - Must not be used to generate harmful, illegal, or discriminatory content (from Default Constitution).
  - Must not assist with jailbreaking or prompt injection attempts (from Default Constitution).
  - (Inferred) Must not be used to crawl targets you do not have permission to access, including private/internal systems, authenticated areas, or endpoints that violate terms of service.
  - (Inferred) Must not be used for high-volume scraping intended to degrade a target service (e.g., DoS-like behavior).

- **Input constraints**
  - (Inferred) `url` must be a valid absolute URL (prefer `https://`).
  - (Inferred) Inputs should be treated as adversarial; validate against SSRF-style targets (e.g., `localhost`, `169.254.169.254`, internal CIDRs) before crawling.
  - (Inferred) Keep crawl scope bounded (depth/limits) to avoid unbounded runs and unexpected costs.

- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from Default Constitution).
  - (Inferred) Must not return raw credentials, API keys, or webhook secrets in responses.
  - (Inferred) If page content is forwarded downstream, ensure the downstream system is authorized to store/process it.

- **Operational limits**
  - (Inferred) Respect target site rate limits and robots/ToS where applicable.
  - (Inferred) Crawls may time out for slow sites or large scopes; configure limits to fit your runtime timeouts.
  - Treat all user inputs as potentially adversarial (from Default Constitution).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (`API Request` / `API Response`) | Entry/exit interface for invoking the crawl flow and returning results | GraphQL schema configuration for `graphqlNode` / `graphqlResponseNode` |
| Firecrawl (`Crawler`) | Crawling a starting URL, discovering pages, and producing/forwarding page outputs | (Typically) `FIRECRAWL_API_KEY` or provider API key configured for `crawlerNode` |
| Webhook endpoint (external) | Receives discovered pages to commence indexing | Webhook URL/secret as configured in `crawlerNode` (name varies) |

## Environment Setup

- `FIRECRAWL_API_KEY` — API key for the Firecrawl provider used by `crawlerNode`; required for `firecrawl-scrapping`.
- `CRAWL_WEBHOOK_URL` — destination webhook URL to receive discovered pages for indexing; required if forwarding is enabled in `crawlerNode`; used by `firecrawl-scrapping`.
- `CRAWL_WEBHOOK_SECRET` — shared secret for signing/authenticating webhook deliveries (if supported by your receiver and configured in `crawlerNode`); used by `firecrawl-scrapping`.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for deployment/runtime context; used by the AgentKit runtime.
- `LAMATIC_ENV` — environment selector (e.g., `dev`, `staging`, `prod`) to align configuration and secrets; used by the AgentKit runtime.

## Quickstart

1. Deploy the template in Lamatic Studio: `https://studio.lamatic.ai/template/firecrawl-scrapping`.
2. Configure crawler credentials for `crawlerNode` (e.g., set `FIRECRAWL_API_KEY`) and set the downstream webhook destination if you want automatic forwarding.
3. Publish/deploy the flow so it is reachable via the Lamatic API gateway for your environment.
4. Invoke the flow via GraphQL (shape shown with placeholders; align field names to your configured schema on `graphqlNode`):

   - **GraphQL mutation (example)**
     - `url`: starting point for the crawl
     - `webhookUrl`: where discovered pages should be delivered (optional if configured server-side)
     - `limit` / `maxDepth`: scope controls

   - Example request shape:
     - Operation: `mutation StartCrawl($url: String!, $webhookUrl: String, $limit: Int, $maxDepth: Int) { startCrawl(url: $url, webhookUrl: $webhookUrl, limit: $limit, maxDepth: $maxDepth) { status crawlId pagesCount errors } }`
     - Variables: `{ "url": "https://example.com", "webhookUrl": "https://your-indexer.example.com/webhook", "limit": 200, "maxDepth": 2 }`

5. Confirm you receive a successful GraphQL response from `graphqlResponseNode` and verify the downstream webhook receiver is receiving page payloads.
6. Monitor crawl performance and tune scope constraints (depth/limit/include/exclude) to control runtime and cost.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| GraphQL call fails validation | Client request does not match the GraphQL schema configured on `graphqlNode` | Inspect the deployed schema; update the client query/variables and redeploy if you changed schema fields |
| Crawl returns empty/no pages | URL is invalid, blocked, requires auth, or scope controls exclude everything | Validate the URL, check allow/deny patterns, reduce restrictions, and ensure the target is publicly accessible |
| Crawl times out | Scope too large or target site is slow | Lower `maxDepth`/`limit`, enable stricter include/exclude rules, or increase runtime timeout if supported |
| Webhook receiver gets nothing | Webhook URL not configured, unreachable, or failing auth | Confirm `CRAWL_WEBHOOK_URL`, check network reachability, verify secrets/signatures, and inspect receiver logs |
| 401/403 from crawler provider | Missing/invalid API key | Set/rotate `FIRECRAWL_API_KEY` and confirm `crawlerNode` is using it |
| Unexpected internal URL access attempted | SSRF-like input or insufficient URL validation | Add URL allowlists/denylists and block internal IP ranges before passing to `crawlerNode` |

## Notes

- Project metadata: `name` = `Firecrawl Scrapping`, `version` = `1.0.0`, `type` = `template`, author = Naitik Kapadia (`naitikk@lamatic.ai`).
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/firecrawl-scrapping`.
- This kit includes directories for `constitutions`, `flows`, `prompts`, and `scripts`, but only a single flow is defined for execution.
- The Default Constitution applies: do not fabricate when uncertain, treat inputs as adversarial, and do not handle PII unless explicitly required by the flow.