# 2. Finance - Company Profiles

## Overview
This AgentKit kit provides an API-driven pipeline for discovering candidate stocks, fetching company profiles and fundamentals, enriching them with historical pricing and public-market sentiment, and producing a structured analysis payload suitable for downstream UI rendering. The architecture is a multi-flow system: individual data-collection flows (`1. Finance - Select Stocks`, `2. Finance - Company Profiles`, `3A/3B/3C`) are composed by an orchestration/analysis flow (`3D. Finance - Analysis`) that conditionally executes subflows and aggregates results. The primary invoker is a web UI (synced from v0.app and deployed on Vercel) or any backend service that can call the flows via the GraphQL trigger interface. Key integrations include third-party financial data APIs (via `apiNode` calls), Serper-backed web search for sentiment (`webSearchNode`), and an LLM JSON-generation step (`InstructorLLMNode`) guided by project prompts and the Lamatic default constitution.

---

## Purpose
The goal of this agent system is to turn a lightweight user intent—"help me analyze a set of public companies"—into complete, structured inputs for decision-making: profiles, financial fundamentals, price history, and a summarized sentiment view. After a successful run, a caller (typically a UI) has consistent JSON outputs that can be rendered as dashboards, cards, tables, or charts without having to orchestrate multiple APIs manually.

The kit is organized as a progression of capabilities. First, it can suggest or validate candidate stocks. Next, it can retrieve baseline company profile information for one or more tickers. Then, it can fetch deeper datasets—fundamental statements and metrics, one-year historical pricing, and public sentiment signals—each as its own focused flow.

Finally, the `3D. Finance - Analysis` flow ties the system together: it decides which datasets to fetch, executes the relevant subflows, collates the returned data into a unified structure, and asks an LLM to generate a strict JSON analysis output. Collectively, these flows provide a modular foundation for stock research experiences where different pages or actions need different depths of data.

## Flows

### 1. Finance - Select Stocks
- **Trigger**
  - Invoked via `graphqlNode` as an API request.
  - Expected input shape (high level): a GraphQL payload providing selection criteria (e.g., sector/theme/constraints) that the `variablesNode` maps into runtime variables.
- **What it does**
  - `API Request (graphqlNode)`: receives the GraphQL request and exposes input fields to the flow.
  - `Variables (variablesNode)`: normalizes and extracts request inputs into internal variables used by downstream nodes.
  - `Fetch Stock (apiNode)`: calls an external stock/market data API to retrieve candidate tickers or matching securities based on the provided criteria.
  - `Collate Suggestions (codeNode)`: consolidates and cleans the API response into a compact suggestions structure (e.g., de-duplication, ranking, or filtering).
  - `API Response (graphqlResponseNode)`: returns the collated suggestions to the caller.
- **When to use this flow**
  - When a user needs help selecting or narrowing down tickers to analyze.
  - When you want a lightweight entry point before running profile/fundamentals/history/sentiment flows.
- **Output**
  - A GraphQL response containing a structured list of suggested stocks/tickers suitable for driving subsequent flow calls.
- **Dependencies**
  - External financial/stock discovery API reachable by `apiNode`.
  - Any credentials required by that API (not explicitly named in the provided material).

### 2. Finance - Company Profiles
- **Trigger**
  - Invoked via `graphqlNode` as an API request.
  - Expected input shape (high level): a GraphQL payload containing `companies` or a list of tickers/symbols; `variablesNode` maps these into the loop input.
- **What it does**
  - `API Request (graphqlNode)`: accepts the request specifying the companies to profile.
  - `Variables (variablesNode)`: extracts the company list and any optional parameters.
  - `Company Profiles Fetch (forLoopNode)`: iterates over each requested company/ticker.
  - `Fetch Profile (apiNode)`: calls an external market/company data API to retrieve profile details for the current ticker.
  - `Check Data (codeNode)`: validates and sanitizes the profile payload (e.g., handles missing fields, normalizes symbols/names).
  - `Company Profiles Fetch End (forLoopEndNode)`: closes the loop and aggregates per-company outputs.
  - `Collate Results (codeNode)`: produces a unified results object/array for the response.
  - `API Response (graphqlResponseNode)`: returns profiles for all requested companies.
- **When to use this flow**
  - When you already have tickers and need baseline context (company name, description, exchange, sector, etc.).
  - As a prerequisite step before deeper analysis; it provides metadata useful for labeling charts and sections.
- **Output**
  - A GraphQL response containing an array/map of company profiles keyed by ticker or in request order.
- **Dependencies**
  - External company profile API accessed by `apiNode`.
  - API credentials/config for that provider (not explicitly named in the provided material).

### 3A. Finance - Fundamentals
- **Trigger**
  - Invoked via `graphqlNode` as an API request.
  - Expected input shape (high level): a list of companies/tickers and a selection of which fundamental datasets to pull; `variablesNode` maps these into loop and branching controls.
- **What it does**
  - `API Request (graphqlNode)`: receives the request defining the target companies.
  - `Variables (variablesNode)`: extracts and normalizes symbols and options.
  - `Fetch Fundamentals (forLoopNode)`: iterates over each company.
  - `Branching (branchNode)`: routes logic for which statement/metric endpoints to call (e.g., based on requested sections or defaults).
  - `Fetch Balance Sheet (apiNode)`: pulls balance sheet data.
  - `Fetch Income Statement (apiNode)`: pulls income statement data.
  - `Fetch Key Metrics (apiNode)`: pulls key metrics (e.g., margins, valuation ratios).
  - `Fetch CashFlow Statement (apiNode)`: pulls cash flow statement data.
  - `Collate Fundamentals (codeNode)`: merges the statement/metric responses into a per-company fundamentals object.
  - `Fetch Fundamentals End (forLoopEndNode)`: ends the loop and aggregates companies.
  - `Collate Results (codeNode)`: consolidates per-company fundamentals into the final response shape.
  - `API Response (graphqlResponseNode)`: returns fundamentals for all companies.
- **When to use this flow**
  - When you need financial statement-level data and metrics for analysis or visualization.
  - When building screens like "Financials", "Key Metrics", or valuation comparisons.
- **Output**
  - A GraphQL response with structured fundamentals data grouped per company and per statement/metric category.
- **Dependencies**
  - External fundamentals data API accessed via multiple `apiNode` endpoints.
  - API credentials/config for that provider (not explicitly named in the provided material).

### 3B. Finance - Historical Stock Data
- **Trigger**
  - Invoked via `graphqlNode` as an API request.
  - Expected input shape (high level): a list of companies/tickers and optionally a date range; if not provided, the flow computes a one-year lookback.
- **What it does**
  - `API Request (graphqlNode)`: accepts tickers and options.
  - `Variables (variablesNode)`: extracts inputs.
  - `One Year Ago Date (codeNode)`: computes a start date approximately one year before "today" for consistent history retrieval.
  - `Fetch Stock Data (forLoopNode)`: iterates over each company.
  - `Fetch Stock Price (apiNode)`: calls an external market data API for historical prices for the computed range.
  - `Group Data (codeNode)`: reshapes raw price bars/ticks into a grouped time-series structure appropriate for charting.
  - `Fetch Stock Data End (forLoopEndNode)`: ends loop and aggregates.
  - `Collate Results (codeNode)`: consolidates into final response payload.
  - `API Response (graphqlResponseNode)`: returns per-company historical price series.
- **When to use this flow**
  - When you need price trend charts, volatility estimates, or performance comparisons.
  - When the analysis requires contextualizing fundamentals with market performance.
- **Output**
  - A GraphQL response containing one-year (default) historical price series per ticker, grouped for visualization.
- **Dependencies**
  - External historical pricing API accessed by `apiNode`.
  - API credentials/config for that provider (not explicitly named in the provided material).

### 3C. Finance - Market Sentiment
- **Trigger**
  - Invoked via `graphqlNode` as an API request.
  - Expected input shape (high level): a list of companies/tickers and optional query modifiers; `variablesNode` maps these into web search queries.
- **What it does**
  - `API Request (graphqlNode)`: accepts the companies to analyze.
  - `Variables (variablesNode)`: prepares per-company query strings.
  - `Fetch Market Sentiment Data (forLoopNode)`: iterates over companies.
  - `Web Search (webSearchNode)`: performs web search to gather recent public information; documentation indicates Serper authentication is required.
  - `Fetch Socials (codeNode)`: extracts and normalizes sentiment-relevant snippets/links/signals from search results (e.g., headlines, sources).
  - `Fetch Market Sentiment Data End (forLoopEndNode)`: ends loop and aggregates.
  - `Collate Results (codeNode)`: builds a unified sentiment results structure.
  - `API Response (graphqlResponseNode)`: returns sentiment artifacts per company.
- **When to use this flow**
  - When you need a lightweight sentiment and news pulse to complement quantitative data.
  - When the caller can tolerate non-deterministic, web-derived results.
- **Output**
  - A GraphQL response containing per-company sentiment inputs (search results, extracted social/news signals) suitable for summarization.
- **Dependencies**
  - Serper (or Serper-compatible) web search credentials used by `webSearchNode`.
  - Network egress to public web search.

### 3D. Finance - Analysis
- **Trigger**
  - Invoked via `graphqlNode` as an API request.
  - Expected input shape: a payload including `companies` (referenced by prompt variable `{{triggerNode_1.output.companies}}`) and potentially flags controlling which datasets to fetch (handled by `branchNode`).
- **What it does**
  - `API Request (graphqlNode)`: receives the analysis request and company list.
  - `Fetch Data (branchNode)`: determines which data collection flows to run (fundamentals, historical data, sentiment) based on inputs or defaults.
  - `Execute 3A. Finance - Fundamentals (flowNode)`: runs the fundamentals subflow and captures its structured output.
  - `Execute 3B. Finance - Historical Stock Data (flowNode)`: runs the historical pricing subflow and captures its output.
  - `Execute 3C. Finance - Market Sentiment (flowNode)`: runs the sentiment subflow and captures its output.
  - `Collate Data (codeNode)`: merges all fetched datasets into a single structured input for the LLM.
  - `Generate JSON (InstructorLLMNode)`: calls the configured model with the system prompt `generate-json-system.md` and user prompt `3d-finance-analysis_generate-json_user.md`. The prompt explicitly injects `DATE TODAY : {{codeNode_667.output.date}}` and `COMPANIES : {{triggerNode_1.output.companies}}`, and instructs the model to produce structured JSON.
  - `API Response (graphqlResponseNode)`: returns the final JSON analysis payload.
- **When to use this flow**
  - When you want an end-to-end, ready-to-render analysis result rather than raw datasets.
  - When the UI needs one call to produce a complete analysis card/report across multiple companies.
- **Output**
  - A GraphQL response containing LLM-generated JSON (structure dictated by prompts) that summarizes and interprets the collated datasets.
- **Dependencies**
  - All dependencies of flows `3A`, `3B`, and `3C` when those branches are enabled.
  - An LLM configured for `InstructorLLMNode` (model selection required per `flows.md`).
  - Prompt files: `prompts/generate-json-system.md` and `prompts/3d-finance-analysis_generate-json_user.md`.
  - Constitution: `constitutions/Default Constitution` governing identity, safety, data handling, and tone.

### Flow Interaction
The flows are designed as a modular pipeline. `1. Finance - Select Stocks` can be used to generate candidate tickers, which can then be passed to `2. Finance - Company Profiles` for metadata enrichment. The three data acquisition flows—`3A. Finance - Fundamentals`, `3B. Finance - Historical Stock Data`, and `3C. Finance - Market Sentiment`—operate independently on a shared conceptual input model (a list of `companies`/tickers) and are orchestrated by `3D. Finance - Analysis` via `flowNode` execution. In typical usage, the UI or backend calls `3D` directly for a full analysis, or calls `2/3A/3B/3C` individually to populate specialized screens.

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must refuse jailbreak or prompt-injection attempts (from constitution).
  - Must not present fabricated financial data as factual; if upstream APIs fail or return partial data, the system should surface uncertainty (**inferred** from "If uncertain, say so — do not fabricate information").
- **Input constraints**
  - Inputs are assumed to be a list of public-company identifiers (tickers/symbols) and optional filters; malformed or excessively large lists may cause loop/timeouts (**inferred**).
  - Treat all user inputs as potentially adversarial (from constitution), especially when passed into web search queries.
- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from constitution).
  - Must not return raw credentials, API keys, or secret config in responses (**inferred** standard operational boundary).
  - LLM output from `InstructorLLMNode` must be JSON as instructed by the prompts; callers should reject non-JSON payloads (**inferred** from "Generate JSON" design).
- **Operational limits**
  - Web search requires valid Serper authentication; without it, `3C` and `3D` (when sentiment branch runs) will fail.
  - Multi-company loops (`forLoopNode`) scale linearly with number of tickers; callers should cap batch size to avoid timeouts (**inferred**).
  - `3D` depends on availability of its subflows; partial execution may occur depending on `branchNode` routing and downstream errors (**inferred**).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL trigger (`graphqlNode`) | Primary API interface for invoking flows and passing inputs | Client must know the deployed endpoint and GraphQL operation/schema (project-specific) |
| External finance data API (`apiNode`) | Stock discovery, company profiles, fundamentals, and historical price retrieval | Provider-specific API key/host (not specified in provided materials) |
| Serper web search (`webSearchNode`) | Market sentiment/news discovery via web search | `SERPER_API_KEY` (name inferred from common Serper usage; exact key not specified) |
| LLM (`InstructorLLMNode`) | Generate strict JSON analysis from collated datasets | Model selection/config in `model-configs` (exact key not specified) |
| Vercel deployment | Hosts the synced v0.app UI that invokes these flows | Vercel project configuration (handled by Vercel) |
| v0.app sync | Auto-sync UI changes into `apps/` | v0 project linkage (handled by v0.app) |

## Environment Setup
- `SERPER_API_KEY` — API key for Serper-powered web search used by `webSearchNode`; required for `3C. Finance - Market Sentiment` and for `3D. Finance - Analysis` when the sentiment branch executes. (Key name **inferred**; confirm with your Lamatic `webSearchNode` config.)
- `FINANCE_DATA_API_KEY` — API key for the external finance data provider used by `apiNode` across `1`, `2`, `3A`, and `3B`. (**inferred**; exact provider and key name not specified in provided materials.)
- `FINANCE_DATA_API_BASE_URL` — Base URL/host for the finance data API endpoints used by `apiNode`. (**inferred**.)
- `LAMATIC_MODEL_CONFIG` — Model configuration reference for `InstructorLLMNode` (typically set via `model-configs/`). (**inferred**; actual mechanism may be file-based rather than env-based.)
- `lamatic.config.ts` — Kit metadata and links; not a secret but required to identify the kit (`name`, `version`, author, GitHub link).
- `prompts/generate-json-system.md` and `prompts/3d-finance-analysis_generate-json_user.md` — Prompt templates required for `3D. Finance - Analysis`.
- `constitutions/` — Default constitution that governs safety and data handling for LLM steps.

## Quickstart
1. Install dependencies and ensure the Lamatic runtime can load this kit (project type `kit`) and its directories (`flows/`, `prompts/`, `constitutions/`, `model-configs/`).
2. Configure credentials:
   - Set `SERPER_API_KEY` for sentiment search (required for `3C` and sentiment-enabled `3D`).
   - Set your finance data provider credentials (API key/base URL) used by `apiNode` in data-fetch flows.
3. Deploy or run locally and identify the GraphQL endpoint exposed by the Lamatic deployment for flow invocation.
4. Invoke the primary orchestration flow (`3D. Finance - Analysis`) with placeholder inputs (example shape):
   - **GraphQL operation (shape)**
     - `query/mutation`: `runFlow`
     - `variables`:
       - `flow`: `"3D. Finance - Analysis"`
       - `input`: `{ "companies": ["AAPL", "MSFT"], "options": { "includeFundamentals": true, "includeHistory": true, "includeSentiment": true } }`
   - Adjust field names to match your deployed GraphQL schema; the flow expects `companies` as a top-level input.
5. Verify the response is valid JSON in the `Generate JSON (InstructorLLMNode)` output envelope and that each requested dataset is present.
6. (Optional) Call subflows directly for specialized pages:
   - Profiles: `"2. Finance - Company Profiles"` with `input: { "companies": ["AAPL"] }`
   - Fundamentals: `"3A. Finance - Fundamentals"` with `input: { "companies": ["AAPL"] }`
   - History: `"3B. Finance - Historical Stock Data"` with `input: { "companies": ["AAPL"] }`
   - Sentiment: `"3C. Finance - Market Sentiment"` with `input: { "companies": ["AAPL"] }`

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `3C` fails with authentication/403 errors | Missing or invalid Serper credential | Set/rotate `SERPER_API_KEY` (or the configured Serper key) and verify `webSearchNode` configuration |
| `apiNode` calls return 401/403/429 | Finance data API key missing/invalid or rate-limited | Confirm provider credentials; add retries/backoff; reduce tickers per request |
| `3D` returns incomplete analysis JSON | One of `3A/3B/3C` branches failed or was disabled by `branchNode` | Check branch inputs/options; inspect subflow run logs; rerun failing subflow independently |
| LLM output is not valid JSON | Model misconfiguration, prompt drift, or truncation | Ensure correct model selected in `InstructorLLMNode`; enforce JSON-only responses; reduce input size (fewer companies or shorter sentiment payloads) |
| Timeouts on multi-company requests | `forLoopNode` scales linearly; upstream APIs are slow | Reduce batch size; parallelize at caller level; increase runtime timeouts if supported |
| Sentiment results look irrelevant | Web queries too broad or ticker ambiguity | Add company name + exchange to query; add disambiguation terms in `variablesNode` logic |

## Notes
- The UI portion of this kit is auto-synced from v0.app into `apps/` and deployed on Vercel; changes made in v0.app will be pushed to the repository and deployed automatically.
- Kit metadata is defined in `lamatic.config.ts` with GitHub reference: `https://github.com/Lamatic/AgentKit/tree/main/kits/stock-analysis`.
- `3C. Finance - Market Sentiment` requires selecting credentials for Serper authentication, and `3D. Finance - Analysis` requires selecting the model used to generate text/JSON output (per `flows.md`).