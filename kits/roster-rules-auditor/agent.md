# Roster Rules Auditor

## Overview

A single-flow, API-invoked AgentKit template that audits a staff roster against user-supplied
staffing rules. Two LLM nodes transcribe free text into structured records; one deterministic code
node performs every calculation and every rule comparison.

The design principle is a trust boundary: **the model interprets text, the code does the
arithmetic.** No number in the output is produced by a language model. The parsers copy values out
of the user's own lines, and the evaluator re-checks that each copied value actually appears on the
line it claims to come from before using it.

This template audits the rules the caller supplies. It is not a legal or regulatory compliance
system and asserts nothing about working-time law.

## Purpose

Small teams write rosters as free text and enforce their own rules by eye. Checking rest gaps and
weekly totals across a week of shifts is interval arithmetic — the kind of task a language model
performs fluently and unreliably. This agent separates the two jobs so the fluent part stays with
the model and the reliable part stays in code.

After a run, the caller has a structured verdict: which rules were understood, which shifts were
read, and precisely which shift breaches which rule by how many hours.

## Flow: `roster-rules-auditor`

Five nodes, strictly linear. No branching.

1. **Audit Request** — `graphqlNode` trigger. Schema: `roster_text` (string), `rules_text` (string).
2. **Roster Parser** — `LLMNode` (`LLMNode_260`). Transcribes each roster line into
   `{ person, date, start, end, end_date, source_text }`. It is instructed never to compute a
   duration, a weekday, a week number or an overnight rollover, and to place anything it is not
   certain of into `unparsed_shifts` with the line copied verbatim.
3. **Rules Parser** — `LLMNode` (`LLMNode_836`). Maps each rule line onto one of three predicates
   or refuses it. Cannot emit a threshold the user did not write.
4. **Roster Rules Evaluator** — `codeNode` (`codeNode_986`). Deterministic JavaScript. Validates
   both parser outputs, performs all arithmetic, and assembles the verdict.
5. **Audit Response** — `graphqlResponseNode`. Returns the evaluator output under `result`.

## Input fields

| Field | Type | Notes |
|---|---|---|
| `roster_text` | string | One shift per line. The date must be written on the line as `YYYY-MM-DD`. |
| `rules_text` | string | One rule per line, plain English. Thresholds must be written as digits. |

## Supported rules

| Predicate | Breach condition |
|---|---|
| `MAX_SHIFT_HOURS` | a single shift's duration is **greater than** the limit |
| `MIN_REST_HOURS` | the gap between one person's consecutive shifts is **less than** the limit |
| `MAX_WEEKLY_HOURS` | a person's total for one week is **greater than** the limit |

Thresholds are inclusive — exact equality passes. The vocabulary is closed: the evaluator rejects
any predicate outside these three, so the rules parser cannot widen it.

The predicate set is deliberately small. The evaluator runs inside a Lamatic code node with a
payload-size limit, and three well-tested predicates were preferred over more predicates that would
not fit.

## Guardrails and refusal behaviour

Refusal is a first-class result, not an error path.

**Rules** are returned in `unparsed_rules` with a reason when they are unsupported (need shift
types, roles or a monthly window), ambiguous (no threshold written), conditional (carry an
exception or qualifier), or compound (two requirements in one sentence).

**Roster lines** are returned in `unparsed_shifts` with a reason when a field is missing, a date is
not written in ISO form, a time cannot be read, or the line carries a timezone. A parser record is
also refused with `DUPLICATE_SHIFT_CLAIM` when every physical roster line matching its
`source_text` has already been claimed by an accepted shift, so one line is never counted twice
while genuinely repeated identical lines each keep their own shift.

**Provenance checks run in code, after the model.** Before a shift is used, the evaluator confirms
that its `source_text` is a verbatim line of the roster, that the person's name appears on that
line, that the ISO date is written on that line, and that both clock times appear on it. Before a
rule is used, it confirms the predicate is one of the three and the threshold is a number present
in the rule's own text. A parser that distorts a value cannot make that value count — the shift or
rule is refused instead.

**Line accounting.** Every non-blank roster line must be claimed by a parsed or refused shift, and
every non-blank rule line by a parsed or refused rule. Lines claimed by neither are reported in
`unclaimed_lines` and `unclaimed_rule_lines`, so a silently dropped shift — or a dropped rule that
would otherwise simply never be enforced — surfaces instead of producing a clean result.

**Unreadable parser output.** If either LLM node returns something that is not usable JSON, the
result is `INCOMPLETE` carrying `PARSER_OUTPUT_UNREADABLE`, not a thrown error. This keeps
malformed, empty, or truncated parser output visible as an explicit incomplete result.

**Status semantics.** `PASS` requires zero violations *and* zero unparsed shifts *and* zero unparsed
rules *and* zero unclaimed roster lines *and* zero unclaimed rule lines *and* no overlapping-shift
findings. `FAIL` means a violation was
computed. `INCOMPLETE` means the input could not be fully established. The auditor never reports
`PASS` on input it did not fully understand.

## Time semantics

Stated in the response under `assumptions`, so the disclosure travels with the output:

- Weeks start Monday; a shift counts wholly in the week of its start date, never split.
- An overnight shift belongs to its start date.
- Durations are naive wall-clock. There is no timezone conversion and DST is not modelled — so on a
  DST transition day the reported duration is the wall-clock difference, not elapsed real time.
  A roster line carrying a timezone marker is refused **by the evaluator** with
  `TIMEZONE_NOT_SUPPORTED`; the parser prompt refuses it too, but the guard does not depend on the
  prompt.
- Overlapping shifts for one person are reported as a finding, and rest checks are suppressed for
  the affected pair rather than reporting a negative gap as a rest breach.

## Integration reference

| Reference | File |
|---|---|
| `@prompts/roster-rules-auditor_llmnode-260_system_0.md` | Roster Parser system prompt |
| `@prompts/roster-rules-auditor_llmnode-260_user_1.md` | Roster Parser user prompt |
| `@prompts/roster-rules-auditor_llmnode-836_system_0.md` | Rules Parser system prompt |
| `@prompts/roster-rules-auditor_llmnode-836_user_1.md` | Rules Parser user prompt |
| `@model-configs/roster-rules-auditor_llmnode-260_generative-model-name.ts` | Roster Parser model config |
| `@model-configs/roster-rules-auditor_llmnode-836_generative-model-name.ts` | Rules Parser model config |
| `@scripts/roster-rules-auditor_code-node-986_code.ts` | Deterministic evaluator |
| `@constitutions/default.md` | Guardrails / identity |

Both LLM nodes are configured for a text-generation model through an OpenRouter credential named
`lamatic-openrouter`. Substitute your own provider and credential on import; no API key is
contained in this template.
