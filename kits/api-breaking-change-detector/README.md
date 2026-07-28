# API Breaking Change Detector Kit

An automated workflow template built on Lamatic that detects breaking schema changes between `v1` and `v2` API endpoints and generates action-oriented developer migration guides.

## Features

- **Schema Diff Parser:** Identifies removed fields, changed data types, and altered endpoints or HTTP methods using custom JavaScript execution logic (`codeNode_676`).
- **LLM Migration Report Generation:** Converts structural JSON diffs into clear, markdown-formatted developer migration guides using Gemini.
- **GraphQL Integration:** Programmatically triggerable via Lamatic's GraphQL endpoint.
- **PR Automation Ready:** Designed to run in CI/CD pipelines to automatically comment breaking-change analysis directly on Pull Requests.

---

## The Problem

When API teams transition from `v1` to `v2` endpoints, breaking schema changes (such as removed properties, changed types, or deprecated paths) often break downstream third-party clients and microservices without warning. Manual review of API diffs is slow and error-prone, while standard openapi-diff tools lack context on *how* client developers should migrate their code.

This kit acts as an automated breaking-change guardrail. It analyzes raw endpoint schemas, isolates structural breaking diffs from non-breaking additions, and generates human-readable developer migration guides with step-by-step resolution paths and side-by-side payload examples.

---

## How It Works

1. **Input Schemas:** The flow takes `v1_schema` and `v2_schema` JSON strings via GraphQL.
2. **Diff Parsing (`codeNode_676`):** Custom JS logic compares request bodies, endpoints, and HTTP methods to produce a structured JSON diff highlighting breaking vs. non-breaking changes.
3. **Report Generation (`LLMNode_543`):** Gemini consumes the structural diff and formats a comprehensive developer migration guide.
4. **Output Report:** Returns a ready-to-post Markdown report listing high-level summaries, breaking change breakdowns, and client payload examples.

```text
v1_schema + v2_schema ──▶ codeNode_676 (JS Diff) ──▶ Structured Diff ──▶ LLMNode_543 (Gemini) ──▶ Markdown Migration Report
```

---

## Tradeoffs & Assumptions

- **JSON Request Body Scope:** Focuses primarily on request payload structural changes, endpoint URL changes, and HTTP method alterations.
- **Deterministic Diffing:** Diffs are computed via deterministic JavaScript code (`codeNode_676`) rather than relying on LLMs to spot schema differences, ensuring zero hallucinated diffs.
- **Temperature 0:** LLM generation runs at temperature 0 for consistent, reproducible developer guides across test runs.

---

## Usage Example

### 1. Running the Local Test Runner
Run the provided Python script in `samples/` to execute an end-to-end check:

```bash
python samples/test_flow.py
```

### 2. Sample Request & Output

**Input Schemas Tested:**
- `v1_schema`: `{"endpoint": "/v1/users", "method": "POST", "request_body": {"user_id": "string", "email": "string", "age": "integer"}}`
- `v2_schema`: `{"endpoint": "/v2/users", "method": "POST", "request_body": {"user_id": "string", "email": "string", "phone": "string"}}`

**Generated Migration Report Output:**

```markdown
### 1. High-Level Summary
- **Status:** ⚠️ BREAKING CHANGES DETECTED
- **Summary:** The API is transitioning from `/v1/users` to `/v2/users`. The `age` integer field has been removed, and `phone` string field introduced.

---

### 2. Breaking Changes
- **Breaking Count:** 2
- **Detailed Diffs:**
  1. **Type:** `ENDPOINT_CHANGED` (Severity: `BREAKING`) — `/v1/users` -> `/v2/users`
  2. **Type:** `FIELD_REMOVED` (Severity: `BREAKING`) — Field 'age' (integer) removed.
  3. **Type:** `FIELD_ADDED` (Severity: `NON_BREAKING`) — Field 'phone' (string) added.

---

### 3. Developer Migration Guide
1. **Update Endpoint Base Path:** Update calls from `POST /v1/users` to `POST /v2/users`.
2. **Modify Payloads:** Remove the `age` property from creation payloads.
3. **Add New Fields:** Supply the optional `phone` field.

*v1 Request Payload:*
```json
{ "user_id": "usr_12345", "email": "dev@example.com", "age": 30 }
```

*v2 Request Payload:*
```json
{ "user_id": "usr_12345", "email": "dev@example.com", "phone": "+15555550199" }
```
```

---

## Setup & Running Locally

### Prerequisites
- Python 3.8+
- Active Lamatic AI Studio account and deployed workflow

### 1. Install Dependencies
```bash
pip install requests python-dotenv
```

### 2. Configure Environment Variables
Create a `.env` file inside `samples/`:
```env
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_WORKFLOW_ID=your_workflow_id
```

### 3. Run Test Flow
```bash
python samples/test_flow.py
```

---

## Project Structure

```text
kits/api-breaking-change-detector/
├── lamatic.config.ts        # Project metadata, steps, and links
├── agent.md                 # Agent capability and guardrails document
├── README.md                # Kit setup and integration guide
├── .env.example             # Environment variable templates
├── .gitignore               # Ignored local files
├── flows/                   # Exported flow definition files (.ts)
├── prompts/                 # Externalized prompt templates (.md)
├── scripts/                 # Externalized code node logic (.ts)
├── constitutions/           # Safety and operational guardrails (.md)
└── samples/
    ├── .env.example         # Sample environment variables
    ├── .env                 # Local secrets (git-ignored)
    └── test_flow.py         # Local Python integration runner
```

---

## Contributing & Community

This kit is part of the [Lamatic AgentKit](https://github.com/Lamatic/AgentKit) repository. Please refer to [CONTRIBUTING.md](../../CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for contribution guidelines and community standards.