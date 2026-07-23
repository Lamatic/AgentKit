# Application Answer Memory Agent

## Overview

Job hunting means answering the same handful of underlying questions over and
over — *"why do you want to work here," "tell us something you've built,"
"walk us through a project"* — reworded slightly by every company's
application form. Most applicants either rewrite each answer from scratch
(slow, inconsistent) or copy-paste the same block everywhere (generic,
ignores what the question actually asked).

This agent sits between those two failure modes. Given a new application
question and a plain-text dump of a person's previous answers, it drafts a
new response that reuses the applicant's real tone, facts, and experiences —
adapted to fit the new question — instead of inventing anything new.

## Purpose

- Keep an applicant's voice and facts consistent across dozens of
  applications, without manual copy-editing every time.
- Save the repetitive part of applying (rewriting the same story) so the
  applicant can spend their time on the part that matters: tailoring to the
  specific role and company.

## Flow

| Flow | Description |
|---|---|
| `application-answer-memory-agent` | Single synchronous flow. Takes `new_question` and `past_answers` (free text) and returns a drafted answer. |

## Guardrails

Defined in [`constitutions/default.md`](./constitutions/default.md) and
reinforced directly in the system prompt:

- Never invents facts, numbers, or experiences that are not present in
  `past_answers`.
- If nothing relevant exists in `past_answers`, the agent says so honestly
  and answers generically from the question alone, rather than fabricating
  a history.
- Keeps tone and level of detail consistent with the applicant's own past
  writing instead of imposing a generic "AI assistant" voice.

## Inputs

| Field | Type | Required | Description |
|---|---|---|---|
| `new_question` | `string` | Yes | The new application question to answer. |
| `past_answers` | `string` | Yes | Free-text dump of the applicant's previous Q&A pairs (any format — the model reads it as context, not a strict schema). |

## Outputs

| Field | Type | Description |
|---|---|---|
| `response` | `string` | The drafted answer, adapted from past answers to fit the new question. |

## Integration Reference

See [`README.md`](./README.md) for setup and the `apps/` directory for the
reference Next.js UI that calls this flow via the Lamatic SDK.
