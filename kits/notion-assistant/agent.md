# Notion Assistant Agent

## Overview

The Notion Assistant is an AI-powered workspace copilot designed to bridge natural language requests with structured Notion workspace operations. It transforms unstructured user commands, meeting notes, and research into schema-guided Notion block hierarchies, database item properties, and search queries.

## Purpose

Managing Notion workspaces manually—such as formatting notes into structured blocks, creating database entries with consistent multi-select tags, and summarizing extensive project documentation—can be tedious and error-prone. The Notion Assistant automates this lifecycle by translating user intent into structured, schema-guided Notion API payloads with built-in PII and secret sanitization.

## Flows

### `notion-assistant`

- **Trigger**: Real-time API / GraphQL request accepting `query`, optional `actionType`, `targetDatabase`, and `contextData`.
- **Processing**: The input is passed to an LLM node (powered by Gemini 1.5 Pro) executing the `@prompts/notion-assistant_generate-action_system.md` prompt.
- **Output**: Returns a stringified JSON result containing `action`, `summary`, `status`, `notionPayload` (Notion block tree and properties), and follow-up `suggestions`.
- **Dependencies**: Lamatic Studio GraphQL Node, LLM Node, Model Configs, and System Prompts.

## Guardrails

- **Credential Protection**: Automatically suppresses and redacts Notion integration tokens (`secret_...`), Bearer tokens, and private API keys while preserving valid database and page parent IDs.
- **PII Redaction**: Redacts phone numbers, personal email addresses, and private contact information from generated blocks.
- **Schema Guidance**: Guides generated child blocks through prompt instructions to adhere to standard Notion API block types (`heading_1`, `heading_2`, `heading_3`, `paragraph`, `to_do`, `bulleted_list_item`, `callout`, `code`).

## Integration Reference

- **Notion Payloads & Queries**: Generates structured, schema-guided Notion REST API payloads and query parameters for (`/v1/pages`, `/v1/databases`, `/v1/search`, `/v1/blocks/{id}/children`).
- **Lamatic Studio**: Orchestrates the LLM prompt execution and API response mapping.

## Environment Setup

No external environment variables are required for basic flow execution. When deploying downstream with live Notion API execution:
- `NOTION_API_KEY`: Notion Internal Integration Secret Token (`secret_...`).
- `NOTION_DEFAULT_DATABASE_ID`: (Optional) Default target database ID for new tasks.

## Quickstart

1. Deploy the template in Lamatic Studio using the `deployUrl`.
2. Send a POST request to the flow GraphQL endpoint with `query` and `variables`:

   ```json
   {
     "query": "query ExecuteNotionAssistant($query: String!, $actionType: String, $targetDatabase: String, $contextData: String) { notionAssistant(query: $query, actionType: $actionType, targetDatabase: $targetDatabase, contextData: $contextData) { result } }",
     "variables": {
       "query": "Create a project sprint checklist with 3 tasks for AI agent rollout",
       "actionType": "create_page",
       "targetDatabase": "4b8c9d12-34ef-56ab-78cd-90ef12345678",
       "contextData": "Sprint: Q3 AI Launch"
     }
   }
   ```

3. Receive the stringified Notion block payload in the response.

## Common Failure Modes

| Symptom | Cause | Resolution |
|---|---|---|
| Ambiguous Action | Query is too short or lacks intent | Provide a more descriptive query or specify `actionType`. |
| Unspecified Target | Database update requested without target | Specify `targetDatabase` in the input payload. |
| Malformed Custom JSON | Invalid JSON string passed in `contextData` | Ensure `contextData` is valid JSON or plain text. |
