# Opportunity Legitimacy Screener

## Overview
This AgentKit bundle screens job postings, recruiter emails, and freelance briefs for legitimacy. It uses a two-flow pipeline: `gather-signals` extracts structured red-flag signals from raw text and enriches them with live web research, and `score-and-explain` scores those signals into a risk tier (`low` / `medium` / `high`) and generates a plain-English explanation and recommended action. It is intended to be invoked by a job seeker or freelancer (directly, or via a thin front-end) who pastes in a suspicious posting or message and wants a fast, evidence-based read on whether it's worth pursuing.

---

## Purpose
Job seekers and freelancers, especially those early in their careers or applying to many roles at once, are frequent targets of fraudulent postings: fake recruiters, advance-fee scams, and "too good to be true" remote offers. Manually verifying a posting (checking the company's web presence, cross-referencing contact details, searching for scam reports) takes time and is easy to skip under pressure to respond quickly. This agent automates that verification step.

After it runs, the "state of the world" is improved in one concrete way: the person has a structured risk assessment — not just a gut feeling — backed by extracted signals (does the contact use a generic email domain? does the company have a verifiable web presence? do search results surface scam/fraud/complaint reports?) and a live web search rather than the model's static training knowledge.

## Flows

### gather-signals
- **Trigger**
  - Invoked via an API request handled by `API Request (graphqlNode)`.
  - Expected input: `{ "raw_text": "string", "source_type": "string" }` — the raw job posting, recruiter email, or freelance brief, plus a label for where it came from (e.g. `"recruiter_email"`, `"job_posting"`).
- **What it does**
  - `Generate Text (LLMNode)` uses Gemini 2.5 Flash to extract structured fields from the raw text: `company_name`, `claimed_domain`, `sender_email`, `stated_compensation`, `role_title`, `contact_method`.
  - `Code` parses the model's JSON output and normalizes missing fields to empty strings (rather than `null`) so downstream consumers always receive well-typed strings.
  - `Web Search (webSearchNode)` queries Serper for `"{company_name} official website reviews"` to find independent, real-time information about the company.
  - `Code` flattens the search results, filters out results that don't actually mention the company name (guarding against false matches on generically-named companies), and joins the top 3 relevant snippets into a single `search_results` string.
  - `API Response (graphqlResponseNode)` returns all extracted signals plus `search_results`.
- **When to use this flow**
  - Use as the first step for any raw, unstructured posting or message that needs to be screened.
- **Output**
  - `{ company_name, claimed_domain, sender_email, stated_compensation, role_title, contact_method, search_results }` — all strings.
- **Dependencies**
  - Gemini model access (credential configured on the `Generate Text` node).
  - Serper API access (credential: `Serper - AgentKit`, configured on the `Web Search` node).
  - Lamatic API connectivity (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`).

### score-and-explain
- **Trigger**
  - Invoked via an API request handled by `API Request (graphqlNode)`.
  - Expected input: the signal object produced by `gather-signals` — `{ company_name, claimed_domain, sender_email, stated_compensation, role_title, contact_method, search_results }` (all strings).
- **What it does**
  - `Code` counts red flags: whether the contact method/email uses a generic domain (gmail, yahoo, outlook, hotmail), whether the company has a verifiable web presence (its name appears in the search results), and whether the search results mention scam/fraud/complaint reports — with a negation-aware check so phrases like "not a scam" or "no complaints" don't get misread as red flags. Flag count maps to a `risk_tier`: 0 flags → `low`, 1 → `medium`, 2+ → `high`.
  - `Condition` branches on `risk_tier` into one of three tier-specific `Generate Text` nodes (each with its own prompt tuned to that risk level), or an `Else` fallback `Code` node for any unexpected value.
  - A final `Code` node reconverges whichever branch actually ran, strips markdown code-fences and HTML-entity artifacts from the model's raw JSON output, and normalizes the result into a single clean object. The tier itself is taken from which branch fired (not re-parsed from the model's output), since the branch that ran is a more reliable source of truth than asking the model to repeat back a value it was never asked to compute independently.
  - `API Response (graphqlResponseNode)` returns the final verdict.
- **When to use this flow**
  - Use as the second step, immediately after `gather-signals`, passing its output directly as this flow's input.
- **Output**
  - `{ risk_tier: "low" | "medium" | "high", explanation: string, recommended_action: string }`.
- **Dependencies**
  - Gemini model access (credential configured on each `Generate Text` node).
  - Lamatic API connectivity (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`).

## Guardrails
See `constitutions/default.md` for baseline safety, data-handling, and tone rules applied across both flows.

## Known Limitations
See the "Tradeoffs & Limitations" section of `README.md` for a full, honest accounting of scoring heuristic limits, LLM extraction non-determinism, and the sequential (rather than internally-chained) relationship between the two flows.
