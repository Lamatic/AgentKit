# Meeting Intelligence Chatbot Flow

This Lamatic flow powers the AI Meeting Intelligence Copilot. It takes a raw meeting transcript as input and returns structured insights, while simultaneously posting them to Slack.

## Flow Architecture

```
Chat Widget (Chat Trigger)
        ↓
Generate Text (LLM) — extracts full analysis
        ↓
Generate JSON (Instructor LLM) — structures output
        ↓
    ┌───┴───┐
    ↓       ↓
Slack API  Chat Response
(webhook)  (to widget UI)
```

## Nodes

### 1. Chat Trigger (`triggerNode_1`)
Receives messages from the embedded Lamatic chat widget. Configured with:
- `domains: ["*"]` — allows all origins (set your production domain in Lamatic Studio)
- Custom bot styling (red primary color, black header)

### 2. Generate Text (`llmNode`) — LLMNode
Passes the transcript to an LLM with a detailed system prompt that extracts:
- Executive Summary
- Key Decisions
- Action Items (with owner + priority)
- Key Insights
- Risks & Blockers
- Participant Highlights
- Suggested Next Steps
- Follow-up Email Draft
- Overall Sentiment

**Model:** `gemini/gemini-2.5-flash` (configurable — swap for GPT-4o, Claude, etc.)

### 3. Generate JSON (`InstructorLLMNode_742`) — InstructorLLMNode
Converts the LLM's markdown output into structured JSON:
```json
{
  "summary": "string",
  "action_items": "string",
  "risks": "string",
  "next_steps": "string"
}
```

### 4. API Node (`apiNode_145`) — Slack Webhook
Posts a formatted message to Slack with all insights.
After importing the flow, set your Slack Incoming Webhook URL directly in Lamatic Studio under **Flow Inputs → apiNode_145 → url**. Do not edit `config.json` — the URL is intentionally left blank so Studio manages it as a private input.

### 5. Chat Response (`chatResponseNode_1`)
Streams the full LLM analysis back to the chat widget UI.

## Setup

1. Import this flow config into Lamatic Studio
2. Set your LLM credentials (Gemini / OpenAI / Anthropic)
3. Set your Slack webhook URL in the API node
4. Add `*` (or your domain) to the Chat Trigger's allowed domains
5. Deploy the flow
6. Copy the Project ID, Flow ID, and API URL into `.env.local`

## Inputs Required

| Node | Input | Description |
|---|---|---|
| Generate Text | Gemini/LLM credentials | Any `generator/text` model |
| Generate JSON | Gemini/LLM credentials | Any `generator/text` model |
| API | Slack Webhook URL | `https://hooks.slack.com/services/...` |
