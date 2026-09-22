# 📝 Notion Assistant — AgentKit Template

![Template](https://img.shields.io/badge/AgentKit-Template-blueviolet)
![Status](https://img.shields.io/badge/Status-Validated-success)

An AI-powered Notion Assistant template built on [Lamatic.ai](https://lamatic.ai) that turns natural language queries, meeting notes, and project instructions into structured Notion API blocks, page trees, and database properties.

---

## 🌟 Key Features

- **Natural Language Workspace Ops**: Ask questions, request page creation, or format unstructured notes into organized Notion structures.
- **Prompt-Guided Block Tree Generation**: Generates structured Notion block payloads (`heading_1`, `heading_2`, `heading_3`, `paragraph`, `to_do`, `bulleted_list_item`, `callout`, `code`) guided by prompt schemas.
- **Database Property Mapping**: Automatically maps titles, status tags, priorities, and dates to Notion Database property types.
- **Built-in Security & PII Redaction**: Automatically suppresses private Notion tokens (`secret_...`), API keys, and sensitive contact details while preserving valid target parent IDs.

---

## 🏗️ Architecture

```text
User Query / Notes 
       │
       ▼
[ GraphQL API Trigger Node ]
       │
       ▼
[ LLM Generation Node (Gemini 1.5 Pro) ]
   ├── @prompts/notion-assistant_generate-action_system.md
   ├── @prompts/notion-assistant_generate-action_user.md
   └── @constitutions/default.md
       │
       ▼
[ GraphQL Response Node ] ──► Formatted JSON (Summary, Notion Block Tree, Suggestions)
```

---

## 📥 Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | **Yes** | Natural language instruction, question, or raw notes. |
| `actionType` | `string` | No | Target operation (`"search"`, `"create_page"`, `"update_database"`, `"summarize"`, `"auto"`). |
| `targetDatabase` | `string` | No | Name or UUID of target Notion database/parent page. |
| `contextData` | `string` | No | Additional context, existing notes, or pre-fetched JSON data. |

---

## 📤 Outputs

| Field | Type | Description |
|---|---|---|
| `result` | `string` | Stringified JSON payload containing `action`, `summary`, `status`, `notionPayload` (Notion block tree and properties), and `suggestions`. |

---

## 💡 Example

### Request Payload:

```json
{
  "query": "query ExecuteNotionAssistant($query: String!, $actionType: String, $targetDatabase: String, $contextData: String) { notionAssistant(query: $query, actionType: $actionType, targetDatabase: $targetDatabase, contextData: $contextData) { result } }",
  "variables": {
    "query": "Create an architectural decision record for adopting Redis cache in our microservices",
    "actionType": "create_page",
    "targetDatabase": "4b8c9d12-34ef-56ab-78cd-90ef12345678",
    "contextData": "Target microservice: user-profile-service"
  }
}
```

### Sample Response:

```json
{
  "result": "{\"action\":\"create_page\",\"summary\":\"Generated an Architectural Decision Record (ADR) page for adopting Redis caching with context, decision, consequences, and action items.\",\"status\":\"success\",\"notionPayload\":{\"title\":\"ADR 004: Redis Caching Layer Adoption\",\"parent\":{\"type\":\"database_id\",\"database_id\":\"4b8c9d12-34ef-56ab-78cd-90ef12345678\"},\"properties\":{\"Name\":{\"title\":[{\"text\":{\"content\":\"ADR 004: Redis Caching Layer Adoption\"}}]},\"Status\":{\"select\":{\"name\":\"Proposed\"}},\"Tags\":{\"multi_select\":[{\"name\":\"Architecture\"},{\"name\":\"Backend\"}]}},\"children\":[{\"object\":\"block\",\"type\":\"heading_2\",\"heading_2\":{\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"1. Context and Problem Statement\"}}]}},{\"object\":\"block\",\"type\":\"paragraph\",\"paragraph\":{\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"High database read load on user profile service requires a fast distributed in-memory cache.\"}}]}},{\"object\":\"block\",\"type\":\"callout\",\"callout\":{\"icon\":{\"type\":\"emoji\",\"emoji\":\"💡\"},\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"Decision: Deploy Redis cluster with LRU eviction policy.\"}}]}},{\"object\":\"block\",\"type\":\"to_do\",\"to_do\":{\"rich_text\":[{\"type\":\"text\",\"text\":{\"content\":\"Benchmark Redis throughput with synthetic load test\"}}],\"checked\":false}}]},\"suggestions\":[\"Add telemetry and Prometheus metrics monitoring task\",\"Configure fallback strategy in case of cache connection timeout\"]}"
}
```

---

## 🚀 Deployment & Usage

1. Open this template in [Lamatic Studio](https://studio.lamatic.ai).
2. Click **Deploy** to generate your live GraphQL endpoint.
3. Call the endpoint from your application, CLI, or workflow automation tools.
