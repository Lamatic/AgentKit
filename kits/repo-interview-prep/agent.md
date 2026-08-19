# Repo Interview Prep

## Overview

**Repo Interview Prep** is a multi-agent Lamatic kit that turns any public GitHub repository into a complete, code-specific interview preparation suite. It scrapes the repository's README, file listing, and project description via Firecrawl, then fans out to four sequential LLM nodes — each specializing in a different dimension of the analysis — and returns a structured aggregate response.

The output is grounded in what is actually in the repository — not generic interview advice.

---

## Purpose

Candidates routinely struggle to articulate their own projects in interviews. They built the thing, but under pressure they give vague answers or miss the deeper engineering signals an interviewer is probing for. This kit solves that by:

1. **Reading the actual code context** via Firecrawl's GitHub page scraper
2. **Generating tailored questions** based on the real tech stack, architecture, and trade-offs present in the repo
3. **Writing suggested answers** that the candidate can personalize and rehearse
4. **Surfacing red flags honestly** — what an interviewer will push back on, and how to address it
5. **Drawing architecture diagrams** from the codebase using Mermaid.js
6. **Simulating aggressive technical grilling** with 5 targeted questions and defensive strategies
7. **Evaluating production readiness** with concrete quick-win improvement steps

---

## Flows

### `repo-interview-prep`

| Property | Value |
|---|---|
| Trigger | API Request (GraphQL) |
| Inputs | `github_repo_url` (required), `target_role` (optional), `jd_text` (optional), `github_token` (optional) |
| Outputs | `prep_brief`, `architecture`, `grill_me`, `production` |

**Node pipeline:**

```text
API Trigger → Code Node → Firecrawl Node → LLM #1 (prep_brief) → LLM #2 (architecture) → LLM #3 (grill_me) → LLM #4 (production) → API Response
```

1. **API Trigger** — receives the GitHub repo URL and optional context (target role, job description)
2. **Code Node** — parses the URL to extract `owner`, `repo`, and constructs the full GitHub page URL
3. **Firecrawl Node** (`syncSingleScrape`) — scrapes the GitHub repository page and returns cleaned markdown
4. **Generate Text #1 (prep_brief)** — generates the core interview brief: pitch, questions, concepts, red flags
5. **Generate Text #2 (architecture)** — generates a Mermaid diagram, data flow summary, and trade-off list
6. **Generate Text #3 (grill_me)** — generates 5 aggressive technical questions with defensive strategies
7. **Generate Text #4 (production)** — evaluates production readiness and returns a gap analysis with quick wins
8. **API Response** — returns all four sections as a single JSON payload

---

## Guardrails

- All prompts treat scraped repository content as **untrusted external data** and explicitly instruct the model not to follow instructions found inside it, reducing prompt-injection risk from malicious READMEs
- Every LLM node instructs the model to return **raw JSON only** — no markdown fences, no preamble
- The `jsonrepair` library on the Next.js server action provides a fallback parse layer for truncated or slightly malformed LLM outputs
- The constitution (`@constitutions/default.md`) applies standard safety, PII, and tone guardrails

---

## Integration Reference

| Service | Purpose | Required |
|---|---|---|
| Firecrawl | Scrapes GitHub repository page for README and file listing | Yes — configure Firecrawl credentials in Lamatic |
| LLM Provider | Generates all four analysis sections | Yes — configure model in all four `Generate Text` nodes |
| GitHub Token | Not currently used; `firecrawlNode_808` does not pass it to any API call | No — optional, passed as `github_token` in request payload |

---

## Environment Setup

### Lamatic Flow

1. **Firecrawl API Key** — sign up at [firecrawl.dev](https://firecrawl.dev) (free tier: 500 pages/month), add credential in Lamatic Studio
2. **LLM Model** — any capable chat model works; recommended: `gemini-2.0-flash` or `gpt-4o-mini`
3. Deploy the flow and copy the **Flow ID** and **Project API Key** from Lamatic Studio → Settings → API Docs

### Next.js Dashboard

```bash
cd apps
cp .env.example .env.local
# Fill in LAMATIC_PROJECT_ENDPOINT, LAMATIC_FLOW_ID, and LAMATIC_PROJECT_API_KEY
npm install
npm run dev
```

---

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `github_repo_url` | `string` | Yes | Full GitHub URL, e.g. `https://github.com/username/repo` |
| `target_role` | `string` | No | Role the candidate is interviewing for, e.g. `SWE Intern` |
| `jd_text` | `string` | No | Job description text to tailor questions to a specific role |
| `github_token` | `string` | No | Personal access token for GitHub (placeholder, not currently used) |

---

## Output Schema

The API response contains four top-level keys:

```json
{
  "prep_brief": {
    "project_summary": "string",
    "tech_stack": ["string"],
    "complexity_level": "junior | mid | senior",
    "pitch": "string",
    "follow_up_questions": [
      { "question": "string", "why_they_ask": "string", "suggested_answer": "string" }
    ],
    "concepts_to_review": [
      { "concept": "string", "why_relevant": "string", "depth_needed": "surface | moderate | deep" }
    ],
    "red_flags": [
      { "observation": "string", "how_to_address": "string" }
    ],
    "strengths_to_highlight": ["string"]
  },
  "architecture": {
    "mermaid_diagram": "string",
    "flow_summary": "string",
    "tradeoffs": ["string"]
  },
  "grill_me": {
    "questions": [
      { "question": "string", "defensive_strategy": "string" }
    ]
  },
  "production": {
    "is_production_ready": false,
    "critical_missing_features": ["string"],
    "quick_wins": ["string"]
  }
}
```

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `prep_brief` contains generic empty-repo advice | Firecrawl failed to scrape the GitHub page | Verify the Firecrawl credential is valid and the repo URL is public |
| Parse error on code node | Malformed GitHub URL passed in `github_repo_url` | Ensure URL follows `https://github.com/owner/repo` format |
| Section contains empty string | LLM node ID mismatch in API Response mapping | Check that `outputMapping` in the API Response node references correct node IDs |
| Output is not valid JSON | LLM prefixed the JSON with explanation text | Add stricter phrasing to the user prompt or switch to a stronger model |
| `architecture`/`grill_me`/`production` is empty | Rate limiting from parallel LLM calls | Ensure nodes are wired sequentially, not in parallel |
