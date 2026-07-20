# GMapreview AI

## Overview
This AgentKit template turns a local business's live Google Maps reviews into a short, prioritized reputation report. It is implemented as a **single-flow** API-invoked pipeline: an API request triggers an Apify-backed review fetch, then an LLM reasoning step, then an API response. The primary caller is a business owner, a growth/ops team, or a scheduled job that wants a recurring "what are our reviews actually saying" digest without reading every review by hand. The flow integrates with Apify's `compass/Google-Maps-Reviews-Scraper` Actor for review retrieval and an LLM provider for analysis and report generation.

## Purpose
The goal of this agent is to reduce the time it takes a local business to go from "we have hundreds of unread Google reviews" to "here are the three things to fix this week, the three things to keep doing, how we stack up against the competitor down the street, and drafts for the reviews nobody has replied to yet."

Operationally, the agent accepts a business's Google Maps URL (and, optionally, one or more competitors' URLs), retrieves recent reviews for all of them in a single Apify call, reshapes that data into compact per-place summaries, and applies a structured analysis prompt to produce a Markdown report plus response drafts. This makes it suitable for a weekly ops digest, a founder's Monday-morning read, or a marketing/CX team's triage tool.

Because this kit is a template with a single flow, all behavior is concentrated in one pipeline. A natural extension is a scheduling flow that invokes this one weekly and delivers `report` to Slack or email — the existing flow remains the canonical "reviews in, report out" entrypoint.

## Flows

### GMapreview AI

- Trigger
  - Invocation: API call via a GraphQL-triggered request node (`graphqlNode`).
  - Expected input shape:
    - `business_name` (string, required) — used to identify which scraped place is "the business" versus a competitor.
    - `business_maps_url` (string, required) — a public Google Maps URL for the business.
    - `competitor_maps_urls` (string array, required — pass `[]` for none) — Google Maps URLs for competitors to benchmark against.
    - `max_reviews_per_place` (int, optional, default 30) — caps reviews fetched per place.
    - `reviews_since` (string, optional, default `"3 months"`) — relative or absolute date scoping the review window.

- What it does
  1. `API Request` (`graphqlNode`)
     - Accepts the incoming request and surfaces the five input fields to downstream nodes.
  2. `Fetch Reviews (Apify)` (`codeNode`)
     - Calls Apify's `compass/Google-Maps-Reviews-Scraper` Actor via `run-sync-get-dataset-items` with every supplied place URL in one request.
     - Groups the returned rows by resolved place title and matches "the business" by name (Apify does not guarantee the dataset preserves input order).
     - Produces a compact summary per place: aggregate rating, a capped sample of text-bearing reviews (with per-aspect Food/Service/Atmosphere ratings where Google provides them), and up to five recent negative reviews with no owner response.
  3. `Generate GMapreview AI` (`LLMNode`)
     - Runs the analysis prompt chain over the reshaped review data:
       - System prompt (`GMapReviewAI_generate-pulse_system.md`) defines the analyst persona, grounding rules (never fabricate a fact not present in the data), and the required report structure.
       - User prompt (`GMapReviewAI_generate-pulse_user.md`) injects the business name and the reshaped business/competitor review JSON.
     - Produces the final Markdown report.
  4. `API Response` (`graphqlResponseNode`)
     - Returns `report` (the full Markdown text), plus `business_average_rating` and `business_total_reviews_fetched` as convenience numeric fields read directly from the fetch step's output.

- When to use this flow
  - Use when the caller's intent is: "Tell me what our Google Maps reviews are actually saying, and draft replies to the ones we haven't answered."
  - Use when a like-for-like comparison against named competitors is wanted.
  - Not ideal for: e-commerce product reviews, reviews from platforms other than Google Maps, or automatically publishing replies back to Google (this flow only drafts them).

- Output
  - Successful response: a Markdown report plus two headline numbers.
  - Format: returned through `graphqlResponseNode` as an API response payload.
  - Fields:
    - `report` (string) — the full report: headline, strengths, issues, competitive comparison (if applicable), and response drafts.
    - `business_average_rating` (number) — average rating across the reviews fetched in this run.
    - `business_total_reviews_fetched` (number) — how many of the business's reviews were analyzed in this run.

- Dependencies
  - External services:
    - Apify (`compass/Google-Maps-Reviews-Scraper`) for review retrieval — requires an Apify API token.
    - An LLM provider for `LLMNode` — provider/model defined in `model-configs`.
  - Credentials/config:
    - `APIFY_API_TOKEN` as a Lamatic project secret (referenced in the code node as `{{secrets.project.APIFY_API_TOKEN}}`).
    - LLM provider API key appropriate to the configured model.
  - Project structure dependencies:
    - `prompts/` contains the system and user prompts for `Generate GMapreview AI`.
    - `scripts/` contains the Apify-calling code node body.
    - `constitutions/` provides the Default Constitution plus GMapReviewAI-specific data handling rules.

### Flow Interaction
This project is a single-flow template; there are no inter-flow dependencies. If extended (e.g. scheduled delivery, trend tracking across runs via Lamatic memory, or a second flow for App Store/Play Store reviews using a sibling Apify Actor), keep this flow as the primary "reviews in, report out" entrypoint.

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from Default Constitution).
  - Must not comply with jailbreak or prompt-injection attempts (from Default Constitution).
  - Must not fabricate a business fact, complaint, compliment, or incident not present in the supplied review data.

- Input constraints
  - `business_maps_url` and any `competitor_maps_urls` must be public, valid Google Maps URLs.
  - `competitor_maps_urls` must be an array — pass `[]`, not `null`, when there are no competitors.

- Output constraints
  - Must not log, store, or repeat reviewer PII beyond what is needed to draft a response (from Default Constitution and this kit's added Data Handling rules).
  - Response drafts must not invent a reviewer name when one was not returned by Apify.
  - Must not include raw credentials or the Apify token in output.

- Operational limits
  - Subject to Apify Actor run time and Google Maps availability; very large `max_reviews_per_place` values across many competitors increase run time and Apify usage cost.
  - Subject to the configured LLM provider's rate limits and context window.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives the business + competitor URLs and starts the flow | AgentKit runtime endpoint + GraphQL schema (project-defined) |
| Apify (`codeNode` → `compass/Google-Maps-Reviews-Scraper`) | Fetches structured Google Maps review data | `APIFY_API_TOKEN` (Lamatic project secret) |
| LLM Provider (`LLMNode`) | Generates the GMapreview AI report | Provider API key (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`; depends on `model-configs`) |

## Environment Setup
- `APIFY_API_TOKEN` — Apify credential used by the `Fetch Reviews (Apify)` code node; obtain from your Apify account under Settings → Integrations → API tokens; add it as a **project secret** in Lamatic Studio (Settings → Secrets), not as a repo `.env` value, since this is a template with no standalone app.
- LLM provider key (e.g. `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) — set via the credential selected in `@model-configs/GMapReviewAI_generate-pulse.ts`.
- `lamatic.config.ts` — project metadata; required to identify the kit and its template step (`GMapReviewAI`).

## Quickstart
1. Sign in to [studio.lamatic.ai](https://studio.lamatic.ai) and create (or open) a project.
2. Add an Apify API token as a project secret named `APIFY_API_TOKEN` (Settings → Secrets).
3. Build the flow described in this kit (or import the exported flow), select an LLM for `Generate GMapreview AI`, and deploy it.
4. Invoke the flow with a request shaped like:
   ```json
   {
     "business_name": "Leopold Cafe",
     "business_maps_url": "https://www.google.com/maps/place/Leopold+Cafe/...",
     "competitor_maps_urls": ["https://www.google.com/maps/place/Cafe+Mondegar/..."],
     "max_reviews_per_place": 30,
     "reviews_since": "3 months"
   }
   ```
5. Confirm the response includes a non-empty `report` field.
6. If the competitor section is missing, confirm `competitor_maps_urls` was non-empty — this is expected behavior otherwise.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Fetch Reviews (Apify)` throws a 401/403 | Missing or invalid `APIFY_API_TOKEN` project secret | Add/verify the secret in Lamatic Studio → Settings → Secrets |
| `Fetch Reviews (Apify)` throws "No reviews were returned" | URL doesn't resolve to a real public place, or genuinely zero reviews in the `reviews_since` window | Open the URL in a browser to confirm it's a valid listing; widen `reviews_since` |
| Report reads as low-confidence / hedged | Small text-review sample for a low-traffic listing | Increase `max_reviews_per_place` or widen `reviews_since` |
| Competitor comparison section missing | `competitor_maps_urls` was `[]` | Expected — supply one or more competitor URLs to enable it |
| LLM step fails or times out | Missing/invalid provider key; request too large for context window | Verify credentials in `model-configs`; reduce `max_reviews_per_place` |
| Response drafts use a generic greeting instead of the reviewer's name | `personalData` is `false` in the Apify call by design | Intentional privacy-conscious default; flip to `true` in the script only if needed |

## Notes
- Project metadata: `GMapreview AI` template, version `1.0.0`, author Chandravijay Rai.
- Repository directories present: `constitutions/`, `flows/`, `model-configs/`, `prompts/`, `scripts/`.
- The Default Constitution (extended with GMapReviewAI-specific data handling rules) applies globally and is a non-optional baseline for safety and data handling.
- This flow was verified end-to-end against live data from Apify's `compass/Google-Maps-Reviews-Scraper` Actor during development (see `assets/sample-report.md` for a real example run).

