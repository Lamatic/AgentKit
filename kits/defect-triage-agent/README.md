# Manufacturing Defect Triage Agent

Takes a written defect observation from a quality control inspection and outputs a structured assessment: severity level, likely root cause, recommended action, and reasoning — so a quality manager can review and act on it in seconds instead of manually reading through raw inspection notes.

## The problem

When a defect is spotted on a production line, someone still has to manually read the description, judge how serious it is, and decide whether the part should pass, be reworked, be rejected, or escalated. That judgment call is slow, inconsistent between inspectors, and doesn't scale when volume increases. There's no lightweight way to turn a raw defect note into a structured, actionable decision.

## How it's built

This is a single Lamatic Studio flow using a **Generate JSON** node with a defined output schema, so the structure of the response (severity, root cause, action, reasoning) is enforced rather than left to hope-the-model-formats-it-right prompting.

**Flow: defect-triage**
API Request → Generate JSON → API Response

- **API Request** — accepts a single field, `defectDescription` (string): a free-text description of the observed defect (e.g. "crack on panel, 3cm long, left corner, near mounting bracket")
- **Generate JSON** — a Gemini 3.5 Flash Lite model call constrained to a structured output schema. The system prompt instructs the model to base its assessment only on what the description states, and to default to `severity: medium` / `recommended_action: escalate` if the description is too vague to assess confidently — rather than guessing
- **API Response** — returns the structured JSON directly

## Why this design

**Structured output over free-text parsing.** Early defect-triage tooling I've built (see below) needed regex-based extraction to handle inconsistent JSON from LLM responses. Using Lamatic's Generate JSON node with an explicit output schema solves that at the platform level instead of working around it after the fact.

**Escalate on uncertainty, don't guess.** The prompt is explicitly instructed to escalate rather than fabricate a confident-sounding severity when the input is vague or incomplete — a wrong "low severity" call is worse than asking a human to look again.

## Input schema

```json
{
  "defectDescription": "crack on panel, 3cm long, left corner, near mounting bracket"
}
```

## Output schema

```json
{
  "severity": "low | medium | high | critical",
  "root_cause_hypothesis": "string",
  "recommended_action": "pass | rework | reject | escalate",
  "reasoning": "string"
}
```

## Example

**Input:**
```json
{ "defectDescription": "crack on panel, 3cm long, left corner, near mounting bracket" }
```

**Output:**
```json
{
  "severity": "high",
  "root_cause_hypothesis": "Excessive stress applied during mounting or material defect at the bracket interface.",
  "recommended_action": "rework",
  "reasoning": "A 3cm crack on a structural panel near a mounting bracket compromises the integrity of the part and risks failure under load, making it a high severity defect requiring rework or rejection."
}
```

## What this kit does NOT do

Scoped out on purpose:

- **No vision/detection step** — this agent expects the defect description as text input. It's designed to sit downstream of a computer vision defect-detection system (I built one — an AI Visual Quality Inspector using YOLOv8 + an LLM vision model for automated defect classification) rather than duplicating that work here
- **No persistent logging or defect history** — each request is assessed independently; a production version would track defect trends per part/line over time
- **No multi-language support** — currently English-only defect descriptions

## About

Built as part of the Lamatic AgentKit Challenge. I'm a final-year Mechatronics Engineering student who works at the intersection of applied computer vision and AI systems — this agent grew directly out of debugging real production issues (LLM JSON reliability, structured severity scoring) on a defect inspection pipeline I built and deployed earlier this year.