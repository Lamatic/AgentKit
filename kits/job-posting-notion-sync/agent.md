# Job Posting Extractor & Notion Sync — Agent Overview

## Purpose

This agent automates the process of capturing and organising job postings. Given a URL, it scrapes the page, extracts structured metadata using an LLM, classifies the posting by relevance, and saves the result as a new page in a Notion database — with no manual copy-pasting.

The intended user is a developer or technical job-seeker who wants to track opportunities in Notion without manually filling in fields.

---

## Trigger

**Type:** GraphQL API (realtime response)

**Input schema:**
```json
{
  "job_url": "string",   // The full URL of the job posting to process
  "destination": "string" // Reserved for routing; currently always "notion"
}
```

The flow starts as soon as this payload is received.

---

## Flow Description

### Node 1 — Firecrawl (Scrape)

- **What it does:** Fetches the job posting at `job_url` and returns clean markdown, stripping navigation, footers, and boilerplate HTML.
- **Mode:** `syncSingleScrape` — a single-page scrape, not a crawl.
- **Key settings:** `onlyMainContent: true`, `waitFor: 8000ms` (allows JS-heavy pages to render), `timeout: 60s`.
- **Output:** Raw markdown of the job posting page.
- **Credential required:** Firecrawl API key.

---

### Node 2 — Instructor LLM (Extract structured JSON)

- **What it does:** Receives the scraped markdown and extracts a fixed set of fields into a validated JSON object.
- **Prompt behaviour:** Strictly schema-bound — the LLM is instructed to return only valid JSON, use `""` (not `null`) for missing string fields, and never guess values that are not explicitly stated.
- **Output schema:**

| Field | Type | Notes |
|---|---|---|
| `company` | string | Company name as stated |
| `role_title` | string | Exact job title |
| `location` | string | City/region as stated |
| `remote_type` | string | e.g. Remote, Hybrid, On-site |
| `tech_stack` | string[] | Only explicitly named technologies |
| `experience_level` | string | One of: `fresher`, `junior`, `mid`, `senior`; `null` if unstated |
| `salary_range` | string | As stated; `""` if not present |
| `application_deadline` | string | As stated; `""` if not present |
| `source_url` | string | Passed through from trigger input |

- **Guardrail:** The LLM must never infer or hallucinate values. If a field is absent, it returns an empty string or empty array.

---

### Node 3 — Agent Classifier (Priority)

- **What it does:** Reads the extracted `tech_stack` and assigns a priority label.
- **Classes:**
  - **High** — tech stack contains any of: `LangChain`, `LangGraph`, `RAG`, `vector database`, `pgvector`, `Python`, `machine learning`, `LLM`, `agent orchestration`
  - **Low** — none of the above are present
- **Output:** A single string — `"High"` or `"Low"` — stored as `agentClassifierNode_222.output.class`.
- **Guardrail:** The classifier returns only the category label, no explanation or prose.

---

### Node 4 — Notion (Save page)

- **What it does:** Creates a new page in the configured Notion database using all extracted fields plus the priority classification.
- **Operation:** `createPage` inside the database specified by `databaseId`.
- **Properties written:**

| Notion Property | Source |
|---|---|
| `role_title` | `InstructorLLMNode_200.output.role_title` |
| `company` | `InstructorLLMNode_200.output.company` |
| `location` | `InstructorLLMNode_200.output.location` |
| `remote_type` | `InstructorLLMNode_200.output.remote_type` |
| `tech_stack` | `InstructorLLMNode_200.output.tech_stack` |
| `experience_level` | `InstructorLLMNode_200.output.experience_level` |
| `salary_range` | `InstructorLLMNode_200.output.salary_range` |
| `application_deadline` | `InstructorLLMNode_200.output.application_deadline` |
| `source_url` | `InstructorLLMNode_200.output.source_url` |
| `priority` | `agentClassifierNode_222.output.class` |

- **Credential required:** Notion OAuth connection authorised on the target workspace.

---

### Node 5 — API Response

Returns a realtime response to the caller once the Notion page has been created. The response body is empty (`outputMapping: {}`); callers should treat a `200` as success.

---

## Guardrails & Behavioural Constraints

1. **No hallucination:** The extraction LLM is explicitly forbidden from inferring or guessing field values not present in the source text.
2. **Schema strictness:** The Instructor LLM node enforces a fixed JSON schema — malformed or extra fields are rejected.
3. **Classifier is binary:** The classifier returns exactly one of two labels. It does not produce free-form output.
4. **Single-page scope:** Firecrawl is configured for single-page scrape only (`crawlSubPages: false`, `crawlLimit: 1`). The agent will not follow links or spider the site.
5. **No external link following:** `allowExternalLinks: false` and `allowBackwardLinks: false` ensure the scrape is constrained to the supplied URL.

---

## Integration Reference

| Integration | Node | Credential Type | Purpose |
|---|---|---|---|
| Firecrawl | `firecrawlNode_795` | API Key | Web scraping |
| LLM provider | `InstructorLLMNode_200` | Model config | Structured extraction |
| LLM provider | `agentClassifierNode_222` | Model config | Priority classification |
| Notion | `notionNode_1` | OAuth | Database page creation |

---

## Consistency Notes (for reviewers)

- The `description` in [`lamatic.config.ts`](./lamatic.config.ts) matches this document: *"Scrapes a job posting URL, extracts structured data (role, company, salary, tech stack, experience level) via LLM, classifies priority, and saves it as a new page in a Notion database."*
- The `databaseId` field in `flows/job.ts` (`notionNode_1`) is a placeholder (`REPLACE_WITH_YOUR_NOTION_DATABASE_ID`) and must be set before deployment — this is expected and documented in the README.
- Tags in `lamatic.config.ts` (`scraping`, `notion`, `automation`, `job-search`) accurately reflect the flow's capabilities.
