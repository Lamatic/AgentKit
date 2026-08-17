# Repo Interview Prep

## Overview

**Repo Interview Prep** is a single-flow Lamatic template that turns any public GitHub repository into a complete, code-specific interview preparation brief. It scrapes the repository's README, file listing, and project description, then uses an LLM to generate a structured JSON brief containing a 2-minute verbal pitch, 15 tailored follow-up questions with suggested answers, concepts to review, red flags in the code, and strengths to highlight.

The output is grounded in what is actually in the repository — not generic interview advice. The LLM is instructed to identify real architectural decisions, specific technologies, quantifiable claims, and potential weaknesses that a senior interviewer would push on.

---

## Purpose

Candidates routinely struggle to articulate their own projects in interviews. They built the thing, but under pressure they give vague answers or miss the deeper engineering signals an interviewer is probing for. This kit solves that by:

1. **Reading the actual code context** via Firecrawl's GitHub page scraper
2. **Generating tailored questions** based on the real tech stack, architecture, and trade-offs present in the repo
3. **Writing suggested answers** that the candidate can personalize and rehearse
4. **Surfacing red flags honestly** — what an interviewer will push back on, and how to address it

---

## Flows

### `repo-interview-prep`

| Property | Value |
|---|---|
| Trigger | API Request (GraphQL) |
| Inputs | `github_repo_url` (required), `target_role` (optional), `jd_text` (optional), `github_token` (optional) |
| Output | `prep_brief` (JSON string) |

**Node pipeline:**

```
API Trigger → Code Node → Firecrawl Node → Generate Text (LLM) → API Response
```

1. **API Trigger** — receives the GitHub repo URL and optional context (target role, job description)
2. **Code Node** — parses the URL to extract `owner`, `repo`, and constructs the full GitHub page URL
3. **Firecrawl Node** (`syncSingleScrape`) — scrapes the GitHub repository page and returns cleaned markdown content including README, file listing, and repo description
4. **Generate Text (LLM)** — receives the scraped content and generates the full prep brief as a raw JSON object
5. **API Response** — returns `prep_brief` to the caller

---

## Guardrails

- The LLM is instructed to **base everything strictly on the scraped content** — no invented technologies or fabricated features
- The system prompt explicitly instructs the model to return **raw JSON only** — no markdown fences, no preamble, no explanation outside the JSON
- Red flags are always surfaced honestly, and suggested answers frame them constructively rather than defensively
- The constitution (`@constitutions/default.md`) applies standard safety, PII, and tone guardrails

---

## Integration Reference

| Service | Purpose | Required |
|---|---|---|
| Firecrawl | Scrapes GitHub repository page for README and file listing | Yes — configure Firecrawl credentials in Lamatic |
| LLM Provider | Generates the interview prep brief | Yes — configure model in `LLMNode_936` |
| GitHub Token | Increases GitHub API rate limits for private-context metadata | No — optional, passed as `github_token` in request payload |

---

## Environment Setup

1. **Firecrawl API Key** — sign up at [firecrawl.dev](https://firecrawl.dev) (free tier: 500 pages/month), add credential in Lamatic Studio
2. **LLM Model** — any capable chat model works; recommended: `gemini-2.0-flash` or `gpt-4o-mini`

---

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `github_repo_url` | `string` | Yes | Full GitHub URL, e.g. `https://github.com/username/repo` |
| `target_role` | `string` | No | Role the candidate is interviewing for, e.g. `SWE Intern` |
| `jd_text` | `string` | No | Job description text to tailor questions to a specific role |
| `github_token` | `string` | No | Personal access token for GitHub (increases rate limits) |

---

## Output Schema

The `prep_brief` field is a JSON string with the following structure:

```json
{
  "project_summary": "string",
  "tech_stack": ["string"],
  "complexity_level": "junior | mid | senior",
  "pitch": "string",
  "follow_up_questions": [
    {
      "question": "string",
      "why_they_ask": "string",
      "suggested_answer": "string"
    }
  ],
  "concepts_to_review": [
    {
      "concept": "string",
      "why_relevant": "string",
      "depth_needed": "surface | moderate | deep"
    }
  ],
  "red_flags": [
    {
      "observation": "string",
      "how_to_address": "string"
    }
  ],
  "strengths_to_highlight": ["string"]
}
```

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `prep_brief` contains generic empty-repo advice | Firecrawl failed to scrape the GitHub page | Verify the Firecrawl credential is valid and the repo URL is public |
| Parse error on code node | Malformed GitHub URL passed in `github_repo_url` | Ensure URL follows `https://github.com/owner/repo` format |
| Output is not valid JSON | LLM prefixed the JSON with explanation text | Add stricter phrasing to the user prompt or switch to a stronger model |
| Firecrawl returns empty markdown | GitHub rate-limited or repo is private | Use a `github_token` in the request or make the repo public |
