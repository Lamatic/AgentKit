# Mirror Check

## Overview
Mirror Check is a single-flow Lamatic Template you use to check yourself before you apply somewhere. You type out what's on your GitHub, portfolio, resume, or LinkedIn, and it gives you an honest first impression — the same read a stranger would form in the first 10 seconds.

## Purpose
Most self-check tools just tell you what you want to hear. Mirror Check doesn't: if something's missing or vague (no projects, no real experience described, weak GitHub activity), it calls that out as a real problem instead of giving you the benefit of the doubt. It's direct, not harsh. Nothing you type is shared with anyone — it's just for you. And the output is always the same set of fields, not a wall of text, so it's easy to scan and act on.

## Flows

### Mirror Check

- **Trigger**: Chat Widget (`chatTriggerNode`). You type what's on your GitHub, portfolio, resume, or LinkedIn — one of these, or a mix — as a single chat message.
- **Processing**: An LLM call (`InstructorLLMNode`, "Generate JSON") reads what you wrote, using a hiring-manager prompt, and returns every field of the report at once, including a `formatted_report` string already laid out for the chat.
- **Response**: The Chat Response node shows `formatted_report` back to you. Nothing leaves the chat.
- **When to use**: Before you apply somewhere, when you want an honest read on how your own material would come across to a stranger.
- **When not to use**: Not a real interview, and not built to check private code or anything you didn't actually type in.
- **Output**: A JSON object with `hiring_score`, `verdict`, `first_impression`, `strengths`, `red_flags`, `technical_assessment`, `communication_assessment`, `would_interview`, `top_improvements`, and `formatted_report`.
- **Dependencies**: An LLM provider configured in Lamatic Studio (developed and tested against `llama-3.3-70b-versatile` via Groq). No external services, databases, or webhooks.

## Guardrails
- Must not fabricate evidence not present in the submitted material — the constitution and system prompt both require grounding every claim in what was actually provided.
- Must not soften judgment into generic praise, but must remain direct without being cruel.
- Must not log, store, or repeat PII beyond what's needed to generate the report (see `constitutions/default.md`).

## Integration Reference

| Integration | Purpose | Required Credential |
|---|---|---|
| LLM Provider (`InstructorLLMNode`) | Writes the report | Provider credential set up in Lamatic Studio (e.g., a Groq credential for `llama-3.3-70b-versatile`) |

## Environment Setup
No environment variables are required. This is a Template — a single flow with no companion app. The LLM credential is configured once, at the Lamatic Studio workspace/project level, not per-deployment.

## Quickstart
1. Deploy this flow in Lamatic Studio.
2. Open the Chat Widget.
3. Type in what's on your GitHub, portfolio, resume, or LinkedIn.
4. Read what comes back.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Chat Response is blank | `Content` field isn't wired to `{{InstructorLLMNode_797.output.formatted_report}}` | Check the Chat Response node's Content field points to the right node and field |
| Generate JSON returns a 400 / function-call error | Schema is malformed, or has too many required fields for the model to fill reliably | Make sure the schema is valid JSON Schema with one top-level `required` array; try a stronger model if it keeps failing |
| A field is missing from the report | The model dropped a required field because the prompt or schema asked for too much at once | Shorten the prompt to only what's necessary, or lower the temperature |
| Report feels vague or too generous | You didn't give it much to work with | Write more — actual project details and experience work better than a bare link or one line |
