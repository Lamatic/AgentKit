# Roster Rules Auditor

Checks a staff roster against the staffing rules **you** write, and reports every breach with the
arithmetic shown.

A language model reads the messy text. It does not do the maths. Every duration, rest gap and
weekly total in the output is computed by deterministic JavaScript from values copied out of your
own input, so no verdict rests on a model's arithmetic. Transcribing free text is still a model's
judgement, which is why the evaluator re-checks that each value it uses is written on the line it
came from, and refuses the line when it is not.

> This template checks the rules you supply. It is **not** a legal or regulatory compliance tool
> and makes no claim about working-time law in any jurisdiction.

## What it does

You paste two things: a roster, and your rules in plain English. You get back a structured audit —
which rules were understood, which shifts were read, and exactly which shifts breach which rule by
how much.

Rules it cannot express are **refused rather than guessed at**, and refusals are reported back to
you verbatim alongside the reason.

## Input

The flow is triggered by an API request with two string fields:

| Field | Description |
|---|---|
| `roster_text` | One shift per line. Each line must carry an ISO date (`YYYY-MM-DD`). |
| `rules_text` | One rule per line, in plain English. |

```json
{
  "roster_text": "Alice 2026-09-14 09:00-17:00\nAlice 2026-09-15 09:00-22:00",
  "rules_text": "No shift may be longer than 10 hours.\nEmployees must have at least 11 hours between shifts."
}
```

## Output

```json
{
  "status": "FAIL",
  "violations": [
    {
      "rule_id": "R1",
      "type": "MAX_SHIFT_HOURS",
      "rule_text": "No shift may be longer than 10 hours.",
      "limit": 10,
      "person": "Alice",
      "shift_ids": ["S2"],
      "actual_hours": 13,
      "excess_hours": 3,
      "detail": "2026-09-15 09:00-22:00 is 13h"
    }
  ],
  "unparsed_shifts": [],
  "unparsed_rules": [],
  "unclaimed_lines": []
}
```

The full response also carries `findings`, `people`, `shifts_parsed`, `rules_parsed` and an
`assumptions` block stating the evaluator's time semantics.

`status` is one of:

- **`PASS`** — no violations, *and* every roster line and every rule was understood.
- **`FAIL`** — at least one violation was computed.
- **`INCOMPLETE`** — something could not be read: an unparsed shift or rule, a roster line no shift
  claimed, a rule line no rule claimed, overlapping shifts for one person, or parser output that was
  not usable JSON. **The auditor never reports `PASS` on input it did not fully understand.**

## Architecture

```
Audit Request  (API trigger: roster_text, rules_text)
      ↓
Roster Parser  (LLM — transcribes lines into shifts)
      ↓
Rules Parser   (LLM — maps rules onto three predicates, or refuses)
      ↓
Roster Rules Evaluator  (deterministic JavaScript — all arithmetic)
      ↓
Audit Response
```

## Supported rules

Three predicates. Anything else is refused.

| Predicate | Example rule text |
|---|---|
| `MAX_SHIFT_HOURS` | "No shift may be longer than 10 hours." |
| `MIN_REST_HOURS` | "Employees must have at least 11 hours between shifts." |
| `MAX_WEEKLY_HOURS` | "Employees may work at most 48 hours per week." |

Thresholds are **inclusive**: a `MAX` rule is breached only when the actual value is greater than
the limit, and a `MIN` rule only when it is less.

## What it refuses, on purpose

A rule is returned in `unparsed_rules` with a reason, rather than approximated, when it is:

- **unsupported** — needs shift types, roles, headcount or a monthly window ("at least one
  supervisor per shift");
- **ambiguous** — no threshold the user actually wrote ("give people enough rest");
- **conditional** — carries an exception or qualifier ("11 hours rest, except on Fridays");
- **compound** — two requirements in one sentence ("40 hours a week and 11 hours rest").

A threshold must appear as digits in the rule text. The parser cannot supply a number you did not
write, and the evaluator re-checks this before using it.

Roster lines are refused the same way, into `unparsed_shifts`. Every non-blank roster line must be
accounted for, and so must every non-blank rule line; lines claimed by nothing are reported in
`unclaimed_lines` and `unclaimed_rule_lines`, so a dropped shift or a dropped rule is visible
instead of quietly becoming a clean result.

## Input format constraints

These are enforced, not advisory:

- **Dates must be written on the line as `YYYY-MM-DD`.** `14 Sep 2026`, `Sep 14 2026` and
  `03/04/2026` are refused rather than interpreted.
- Times may be written as `HH:MM` or in a simple am/pm form (`9am`, `9:30 AM`).
- An overnight shift (`22:00-06:00`) is detected by the evaluator and belongs to its **start date**.
- Weeks start **Monday**, and a shift counts wholly in the week of its start date.
- Times are treated as **naive wall-clock**. There is no timezone conversion and DST is not
  modelled, so a duration is the wall-clock difference. A roster line carrying a timezone marker
  (`IST`, `PST`, `UTC+5:30`, a trailing `Z`) is refused with `TIMEZONE_NOT_SUPPORTED`.

## Setup

No environment variables, no local runtime, and no `apps/` directory — this is a single-flow
template.

1. Import the template into Lamatic Studio.
2. **Select your own workspace credential on both LLM nodes, inside Studio.** The exported
   model-config files carry a `credentialId`, `provider_name` and `credential_name` from the
   workspace this template was built in. Those values will not resolve in yours.
3. **Do not hand-edit the files in `model-configs/`.** Studio has no runtime placeholder or
   environment-variable mechanism for credentials — the binding is made in Studio and written back
   by Studio. Editing the generated files does not attach a credential and will desynchronise them
   from the flow.
4. Deploy the flow and call its API endpoint with `roster_text` and `rules_text`.

Any text-generation provider works. The export happens to reference an OpenRouter credential named
`lamatic-openrouter`; that is what this template was built against, not a requirement.

The two parser prompts assume a model that follows a strict JSON output instruction. If yours
returns prose, an empty string, or a truncated object, the flow reports `INCOMPLETE` with
`PARSER_OUTPUT_UNREADABLE` rather than failing.
