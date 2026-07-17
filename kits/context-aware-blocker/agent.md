# Lamatic: Context-Aware Blocker

## Overview

Lamatic Context-Aware Blocker is a production-ready AgentKit application that blocks web pages based on contextual natural language rules. It is split into two components:
1. **Next.js Backend:** Securely stores Lamatic API credentials and acts as the secure proxy between the extension and Lamatic's AI flow.
2. **Chrome Extension (Frontend):** Reads page context (title, headings, meta description), queries the backend, and injects a full-screen block overlay if the AI determines the page violates the user's focus rules.

---

## Purpose

Traditional web blockers are "dumb" — they block entire domains (like `youtube.com`). This fails when a user legitimately needs YouTube for a coding tutorial. This agent acts as a context-aware accountability partner, analyzing the specific page title and URL against the user's natural language rules to make a dynamic ALLOW or BLOCK decision.

---

## Flows

### `content-classification`

- **Trigger**: API Request (GraphQL). Invoked by the Next.js backend's `/api/evaluate` endpoint.
- **Input Schema**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `url` | `string` | Yes | The full URL of the page being evaluated. |
  | `title` | `string` | Yes | The page's `<title>` tag content. |
  | `h1` | `string` | No | Concatenated H1 heading text from the page. |
  | `meta` | `string` | No | The page's `<meta name="description">` content. |
  | `activeRules` | `string` | Yes | Combined string of static domain rules and AI natural language rules. |
- **Logic**: Uses an Instructor LLM Node to evaluate the page context against the active rules and output a strict JSON decision. The LLM is constrained to only output the expected schema — no free-form text.
- **Output Schema**:
  | Field | Type | Description |
  |---|---|---|
  | `decision` | `string` | Either `"BLOCK"` or `"PASS"`. |
  | `reason` | `string` | A short explanation of why the decision was made. |
  | `confidence` | `number` | Confidence score (0-1) of the decision. |

---

## Evaluation Pipeline (Node Walkthrough)

The evaluation does not go straight to the AI. The extension runs a multi-step pipeline that minimizes AI calls:

1. **Whitelist Check** — Is the URL `localhost:3000` (our own dashboard)? → Instant PASS. No further checks.
2. **Time Window Check** — Is any focus session currently active (based on day + time)? → If no, instant PASS. Zero cost.
3. **Static Domain Match** — Is the URL's hostname explicitly listed in any active block's domain list? → If yes, instant BLOCK. Zero AI cost.
4. **Rule Existence Check** — Are there any rules (static or AI) defined at all? → If no, instant PASS. Zero AI cost.
5. **Rule-Aware Cache Check** — Has this URL been evaluated before with the exact same set of rules? → If yes, return cached decision. Zero AI cost.
6. **Lamatic AI Call** — Only genuinely new URLs with current rules reach this step. The page context and rules are sent to the Lamatic flow. The decision is cached.

---

## Guardrails

- **Fail-Closed Strategy:** If the AI is uncertain, it defaults to BLOCK to protect the user's focus.
- **Privacy First:** Only the page title and URL are sent to the AI. No browsing history is stored or transmitted.
- **No Hallucinations:** The agent is strictly constrained to output JSON schema via the Instructor node, preventing injection attacks and free-form responses.
- **Anti-Circumvention:** The "Strict Bouncer" feature closes `chrome://extensions` tabs to prevent the user from disabling the extension during a focus session.

---

## Integration Reference

| Integration | Purpose | Config Key |
|---|---|---|
| Lamatic AgentKit | Orchestrates the content-classification flow | `CONTENT_CLASSIFICATION_FLOW_ID` |
| Lamatic API | Remote execution of the flow | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Chrome Extension APIs | DOM manipulation, tab management, storage | `chrome.storage`, `chrome.tabs`, `chrome.scripting` |

---

## Known Limitations

1. **Local Development Only**: The extension currently hardcodes `http://localhost:3000` as the API endpoint. For production deployment, this should be replaced with a deployed Vercel URL.
2. **No Persistent Backend Storage**: Block configurations are stored in `localStorage` (dashboard) and synced to `chrome.storage.local` (extension). There is no server-side database — this is intentional for a privacy-first, offline-capable design.
3. **Single Flow**: The entire AI evaluation is handled by one flow. A future enhancement could split this into specialized flows (e.g., separate classification for social media vs. news content).
4. **Native Extension Removal is Unblockable**: The extension intercepts navigation to `chrome://extensions` during strict mode to prevent being disabled. However, due to Chromium security policies, it is impossible for any extension to block its own removal via the native browser "Remove from Chrome" dropdown menu.
