# Import adapters

`js/adapters.js` holds one adapter per framework. An adapter is two functions:

| Function | Contract |
|---|---|
| `claim(doc)` | Cheap structural sniff — returns true if the JSON looks like this framework's export. Adapters are tried in order; the first claim wins. |
| `translate(doc)` | Best-effort mapping onto the canonical trace schema (`docs/trace-schema.md`). Missing sections stay empty; the rule engine tolerates that. |

## Detection signatures

| Format | Claimed when |
|---|---|
| Native | Object with `final_response` or `tool_calls` (and no `spans`) |
| LangGraph | Array (or `{events}`) of `astream_events` items: `event: "on_*"` or `metadata.langgraph_node` |
| OpenAI Agents SDK | `spans[]` where items carry `span_data.type` (`agent`, `function`, `generation`, `guardrail`, `handoff`) |
| CrewAI | `tasks[]` plus a `crew` or agents with `role`/`goal` |
| AutoGen | `chat_history[]` (or bare message array) with `name` / `tool_calls` / `function_call` fields |
| Lamatic | `nodes[]` plus `flowId` / `executionId` / `workflowId` |

## Field mapping highlights

- **Tool calls**: LangGraph `on_tool_start/end/error` pairs, OpenAI `function` spans, CrewAI `tool_calls`/`tools_used`, AutoGen `tool_calls` → `role:"tool"` replies, Lamatic `toolNode`/`apiNode`/`codeNode` executions. Error text containing "timeout" maps to `status:"timeout"`, anything else failing maps to `status:"error"`.
- **Retrieval**: LangGraph `on_retriever_end` documents and Lamatic `ragNode`/`vector` node outputs become `retrieved_docs` with their scores.
- **System prompt**: `system` messages (LangGraph, OpenAI, AutoGen), agent `role/goal/backstory` (CrewAI), `config.systemPrompt` (Lamatic).
- **Final response**: the last assistant generation / task output / `llmNode` text.
- **Logs**: guardrails, handoffs, node lifecycle, span errors, and fallback markers land in `logs` so the timeline and fallback rules see them.
- **Timestamps**: ISO strings and epoch numbers are folded to `HH:MM:SS`; ordering is what matters to the engine.

## Adding a framework

```js
new Adapter("myframework", "My Framework",
  doc => Array.isArray(doc.runs) && doc.runs.some(r => r.step_type),
  doc => { /* return an object in the canonical schema */ });
```

Register it before the stricter formats if its signature could shadow theirs, add a fixture to `tests/run-tests.js`, done.
