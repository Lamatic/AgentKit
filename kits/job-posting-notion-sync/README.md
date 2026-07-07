# Job Posting Extractor & Notion Sync

> An [AgentKit](https://github.com/Lamatic/AgentKit) template that scrapes a job posting URL, extracts structured data via LLM, classifies its priority, and saves it as a new page in a Notion database — fully automated.

---

## What It Does

This kit automates your job-tracking workflow in three steps:

1. **Scrape** — Uses [Firecrawl](https://www.firecrawl.dev/) to fetch and clean the raw content of any job posting URL.
2. **Extract** — An Instructor LLM node parses the scraped markdown and returns structured JSON containing:
   - `company`, `role_title`, `location`, `remote_type`
   - `tech_stack` (array), `experience_level`, `salary_range`
   - `application_deadline`, `source_url`
3. **Classify & Save** — A classifier LLM rates the posting as **High** or **Low** priority based on the tech stack, then creates a new page in your Notion database with all extracted fields plus the priority label.

### Priority Classification Logic

| Priority | Triggered when tech stack includes… |
|----------|--------------------------------------|
| **High** | LangChain, LangGraph, RAG, vector database, pgvector, Python, ML, LLM, agent orchestration |
| **Low**  | None of the above |

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Lamatic account** | Required to import and run the flow |
| **Firecrawl API key** | Obtain at [firecrawl.dev](https://www.firecrawl.dev/) — used to scrape job posting pages |
| **Notion OAuth connection** | Connect your Notion workspace via OAuth inside Lamatic's credential manager |
| **Notion Database ID** | The ID of the Notion database where job pages will be created |

### Notion Database Schema

Your Notion database must have the following properties (exact names, matching types):

| Property Name | Type |
|---|---|
| `role_title` | Title |
| `company` | Text |
| `location` | Text |
| `remote_type` | Select or Text |
| `tech_stack` | Multi-select or Text |
| `experience_level` | Select or Text |
| `salary_range` | Text |
| `application_deadline` | Date or Text |
| `source_url` | URL |
| `priority` | Select (`High` / `Low`) |

---

## Setup

### 1. Import the Kit

Import this kit into your Lamatic workspace. The flow `job` will be added automatically.

### 2. Configure Firecrawl Credentials

1. In Lamatic, go to **Credentials**.
2. Add a new credential of type **Firecrawl** and paste your API key.
3. In the flow, select this credential on the **Firecrawl** node (`firecrawlNode_795`).

### 3. Connect Notion via OAuth

1. In Lamatic, go to **Credentials**.
2. Add a new credential of type **Notion** and complete the OAuth flow to authorise your workspace.
3. In the flow, select this credential on the **Save to Notion** node (`notionNode_1`).

### 4. Set Your Notion Database ID

Open [`flows/job.ts`](./flows/job.ts) and find the `notionNode_1` values block. Replace the three placeholders:

```ts
// flows/job.ts  ~line 232-239
"pageId":     "REPLACE_WITH_YOUR_NOTION_PAGE_ID",   // the database page acting as parent
"parent":     "REPLACE_WITH_YOUR_NOTION_PAGE_ID",   // same value as pageId
"databaseId": "REPLACE_WITH_YOUR_NOTION_DATABASE_ID", // the database to create pages in
```

> **`pageId` / `parent`** — the Notion page that *contains* the database (the parent page ID).  
> **`databaseId`** — the ID of the database itself where new job entries will be created.

Both IDs appear in the Notion page URL:

```
https://www.notion.so/myworkspace/<PAGE_ID>?v=<DATABASE_ID>
```

### 5. Choose LLM Models

The flow uses two LLM nodes. Select a model for each in the **Inputs** panel (or edit `model-configs/`):

- **Generate JSON** (`InstructorLLMNode_200`) — any capable model (e.g. `gpt-4o`, `claude-3-5-sonnet`)
- **Classifier** (`agentClassifierNode_222`) — a lightweight model works fine (e.g. `gpt-4o-mini`)

---

## Running the Flow

The flow is triggered via a **GraphQL API call** with the following input schema:

```json
{
  "job_url": "string",
  "destination": "string"
}
```

### Example Input

```json
{
  "job_url": "https://jobs.ashbyhq.com/acmecorp/senior-ml-engineer",
  "destination": "notion"
}
```

### Example Output (Extracted JSON)

```json
{
  "company": "Acme Corp",
  "role_title": "Senior ML Engineer",
  "location": "San Francisco, CA",
  "remote_type": "Hybrid",
  "tech_stack": ["Python", "LangChain", "pgvector", "FastAPI", "AWS"],
  "experience_level": "senior",
  "salary_range": "$180,000 – $220,000",
  "application_deadline": "2026-08-31",
  "source_url": "https://jobs.ashbyhq.com/acmecorp/senior-ml-engineer"
}
```

### Example Notion Page Created

| Field | Value |
|---|---|
| **role_title** | Senior ML Engineer |
| **company** | Acme Corp |
| **location** | San Francisco, CA |
| **remote_type** | Hybrid |
| **tech_stack** | Python, LangChain, pgvector, FastAPI, AWS |
| **experience_level** | senior |
| **salary_range** | $180,000 – $220,000 |
| **application_deadline** | 2026-08-31 |
| **source_url** | [Acme Corp posting](https://jobs.ashbyhq.com/acmecorp/senior-ml-engineer) |
| **priority** | ✅ High |

---

## Flow Architecture

```text
Trigger (job_url)
    │
    ▼
Firecrawl Node        ← scrapes & cleans the job page
    │
    ▼
Instructor LLM Node   ← extracts structured JSON from scraped markdown
    │
    ▼
Classifier Node       ← assigns High / Low priority from tech stack
    │
    ▼
Notion Node           ← creates a new page in your database
    │
    ▼
API Response
```

---

## Project Structure

```text
job-posting-notion-sync/
├── flows/
│   └── job.ts                          # Flow definition (nodes, edges, inputs)
├── prompts/
│   ├── job_instructor-llmnode-200_system_0.md   # Extractor system prompt
│   ├── job_instructor-llmnode-200_user_1.md     # Extractor user prompt
│   ├── job_agent-classifier-node-222_system_0.md # Classifier system prompt
│   └── job_agent-classifier-node-222_user_1.md  # Classifier user prompt
├── model-configs/                      # LLM model selection configs
├── constitutions/
│   └── default.md                      # Behavioural guardrails
├── lamatic.config.ts                   # Kit metadata
└── README.md
```

---

## Links

- **GitHub**: [AgentKit / job-posting-notion-sync](https://github.com/Lamatic/AgentKit/tree/main/kits/job-posting-notion-sync)
- **Firecrawl Docs**: [docs.firecrawl.dev](https://docs.firecrawl.dev/)
- **Notion API Docs**: [developers.notion.com](https://developers.notion.com/)
