# Rejection Email Decoder

## What this agent does
Takes the text of a job rejection email and analyzes it to help the applicant understand what actually happened — whether it's a generic template or a personalized response, whether there's a real signal to reapply, and what (if any) real feedback is buried in the corporate language.

## Purpose
Job seekers, especially those applying to many roles at once, often can't tell whether a rejection is worth re-reading closely or just a form letter. This agent gives a fast, consistent second opinion so the applicant can decide whether to reapply, adjust their approach, or move on.

## Flow
**Input → Generate Text (LLM) → Response**

- **Input**: `rejection_email_text` — the full text of the rejection email
- **Generate Text**: a single LLM call, prompted to classify the email's type, reapply signal, and tone, and to translate any real feedback into plain language
- **Response**: returns the structured result back to the caller

## Guardrails
See `constitutions/default.md`.

## Integration Reference
Call the deployed flow's API endpoint with:
```json
{ "rejection_email_text": "<rejection email text>" }
```
