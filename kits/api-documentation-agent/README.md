# API Documentation Agent

Feed it an OpenAPI or Swagger spec — get production-ready endpoint docs, code examples, and a plain-language API overview.

## Problem
Writing API documentation by hand is tedious, error-prone, and inevitably drifts from the actual spec. Developers either maintain docs separately (doubling the work) or skip them entirely (frustrating consumers). Existing generators produce reference-style output that lacks examples, explanations, and usability context.

## How it works
1. Submit an `openapi_spec` (JSON or YAML string — OpenAPI 3.x or Swagger 2.0).
2. A structured extraction pass normalises the spec into a clean endpoint inventory (method, path, params, schemas, auth).
3. A documentation pass generates Markdown docs with parameter tables, status codes, and auth notes.
4. An example pass generates runnable code snippets in cURL, Python, JavaScript, and TypeScript with realistic sample data.
5. A review pass cross-checks the generated docs and examples against the original spec, scoring quality and listing any discrepancies.

See [`agent.md`](./agent.md) for the full architecture and design rationale.

## Example
**Input:**
```json
{
  "openapi_spec": "{\n  \"openapi\": \"3.0.0\",\n  \"info\": { \"title\": \"Pet Store\", \"version\": \"1.0.0\" },\n  \"paths\": {\n    \"/pets\": {\n      \"get\": {\n        \"summary\": \"List all pets\",\n        \"parameters\": [{ \"name\": \"limit\", \"in\": \"query\", \"schema\": { \"type\": \"integer\" } }],\n        \"responses\": { \"200\": { \"description\": \"A list of pets\" } }\n      },\n      \"post\": {\n        \"summary\": \"Create a pet\",\n        \"requestBody\": { \"content\": { \"application/json\": { \"schema\": { \"type\": \"object\", \"properties\": { \"name\": { \"type\": \"string\" }, \"tag\": { \"type\": \"string\" } }, \"required\": [\"name\"] } } } },\n        \"responses\": { \"201\": { \"description\": \"Pet created\" } }\n      }\n    }\n  }\n}"
}
```

**Output:**
```json
{
  "documentation": "# Pet Store API\n\n## GET /pets\n**List all pets**\n\n### Parameters\n| Name | In | Type | Required | Description |\n|---|---|---|---|---|\n| limit | query | integer | No | — |\n\n### Responses\n| Status | Description |\n|---|---|\n| 200 | A list of pets |\n\n---\n\n## POST /pets\n**Create a pet**\n\n### Request Body\n| Field | Type | Required |\n|---|---|---|\n| name | string | Yes |\n| tag | string | No |\n\n### Responses\n| Status | Description |\n|---|---|\n| 201 | Pet created |",
  "examples": "### GET /pets\n```bash\ncurl -X GET 'https://api.example.com/pets?limit=10'\n```\n```python\nimport requests\nresponse = requests.get('https://api.example.com/pets', params={'limit': 10})\n```\n\n### POST /pets\n```bash\ncurl -X POST 'https://api.example.com/pets' -H 'Content-Type: application/json' -d '{\"name\": \"Buddy\", \"tag\": \"dog\"}'\n```",
  "summary": "The Pet Store API provides endpoints for managing pet records. It supports listing pets with optional pagination and creating new pet entries. No authentication is required.",
  "quality_score": 0.94,
  "issues": ["Consider adding error response documentation for 4xx/5xx status codes"]
}
```

## Setup
1. Deploy this flow in [Lamatic Studio](https://studio.lamatic.ai).
2. Connect a text-generation model credential (built and tested with Groq's `llama-3.3-70b-versatile`).
3. Call the deployed API endpoint with an `openapi_spec` string (JSON or YAML).

## Supported spec formats
- OpenAPI 3.0.x / 3.1.x (JSON or YAML)
- Swagger 2.0 (JSON or YAML)

## What you get back
| Field | Type | Description |
|---|---|---|
| `documentation` | string | Markdown-formatted endpoint reference |
| `examples` | string | Code snippets in cURL, Python, JS, and TS |
| `summary` | string | Plain-language API overview |
| `quality_score` | number | 0–1 accuracy score from the review pass |
| `issues` | string[] | Discrepancies or suggestions found during review |
