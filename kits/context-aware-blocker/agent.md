# Lamatic: Context-Aware Blocker

## Overview
Lamatic Context-Aware Blocker is a production-ready AgentKit application that blocks web pages based on contextual natural language rules. It is split into two components:
1. **Next.js Backend:** Securely stores Lamatic API credentials and acts as the secure proxy.
2. **Chrome Extension (Frontend):** Reads page context, queries the backend, and injects a full-screen block overlay if the AI determines the page violates the user's focus rules.

---

## Purpose
Traditional web blockers are "dumb" — they block entire domains (like `youtube.com`). This fails when a user legitimately needs YouTube for a coding tutorial. This agent acts as a context-aware accountability partner, analyzing the specific page title and URL against the user's natural language rules to make a dynamic ALLOW or BLOCK decision.

## Flows

### `content-classification`
- **Trigger**: Invoked via an API-triggered GraphQL request from the Next.js backend.
- **Input**: `page_title`, `page_url`, `user_rules`.
- **Logic**: Uses an Instructor LLM Node to evaluate the context and output a strict JSON decision.
- **Output**: JSON containing `decision` (ALLOW or BLOCK), `reason`, and `confidence`.

## Guardrails
- **Fail-Closed Strategy:** If the AI is uncertain, it defaults to BLOCK to protect the user's focus.
- **Privacy First:** Only the page title and URL are sent to the AI. No browsing history is stored.
- **No Hallucinations:** The agent is strictly constrained to output JSON schema, preventing injection attacks.

## Integration Reference
| Integration | Purpose | Config Key |
|---|---|---|
| Lamatic AgentKit | Orchestrates the classification flow | `CONTENT_CLASSIFICATION_FLOW_ID` |
| Lamatic API | Remote execution of flow | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Chrome API | DOM manipulation and Storage | `chrome.storage`, `chrome.tabs`, `chrome.scripting` |
