# Trace schema

A trace is one agent run, captured as a single JSON object. Every field the rule engine reads is documented here; unknown fields are ignored, and every section except `final_response` may be empty.

## Top-level fields

| Field | Type | Purpose |
|---|---|---|
| `meta` | object | Display only: `agent`, `flow_id`, `model`, `session`, `date`. |
| `system_prompt` | string | The agent's instructions. Read by the prompt-ambiguity rules (R31, R32). |
| `conversation` | array | Messages: `{ role: "user"\|"assistant", ts, content }`. The last user message defines the task for tool-selection rules (R41, R42). |
| `available_tools` | array | `{ name, description }`. The full toolbox the agent could have used — required for wrong-tool detection. |
| `tool_calls` | array | See below. |
| `retrieved_docs` | array | `{ id, source, score, content }`. Retrieval results that reached the context. Read by RAG rules (R21, R23) and the groundedness rule (R22). |
| `logs` | array | `{ ts, level: "INFO"\|"WARN"\|"ERROR", event, message }`. Infrastructure events. Fallbacks, empty-retrieval warnings and output-instability warnings are recognized by event name (`flow.fallback`, `retrieval.empty`, `output.validation`). |
| `final_response` | object | `{ ts, content }`. The answer the user actually received — the "body" of the investigation. |

## Tool call fields

```json
{
  "ts": "10:33:02",
  "tool": "get_order_status",
  "input": { "order_id": "A-58291" },
  "status": "success",
  "duration_ms": 214,
  "output": "{\"status\":\"in_transit\",\"eta\":\"2026-07-12\"}"
}
```

`status` must be one of `success`, `error`, `timeout`. `output` is a string (stringify structured results). Timeouts and errors feed the tool-failure rules (R11, R12); successful outputs feed the groundedness corpus for R14 and R22.

## Timestamps

`ts` is a `HH:MM:SS` string. Timestamps only need to sort correctly relative to each other — the timeline is reconstructed by ordering, not by wall-clock math (except timeout endpoints, computed from `duration_ms`).

## Design note

The schema mirrors the request lifecycle that agent platforms already log: prompt in, tools and retrieval in the middle, response out. Mapping a platform's native run log onto this shape is an adapter, not a redesign — which is the point.
