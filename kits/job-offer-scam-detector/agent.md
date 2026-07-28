# Job Offer Scam Detector

## Overview

An AI agent that analyzes job offer messages — emails, DMs, or texts — and flags common signs of employment fraud before a candidate acts on them. It returns a structured risk assessment rather than a vague opinion, so the output is easy to log, audit, or display directly in a UI.

## Purpose

Job seekers, especially early-career candidates applying to many roles at once, are frequent targets of employment scams: fake offers demanding upfront "processing fees," requests to move communication to WhatsApp/Telegram, urgency tactics ("respond in 2 hours or lose the offer"), and generic recruiter language designed to feel legitimate at a glance. This agent gives a fast, consistent second opinion before a candidate shares personal or financial information.

## Flow Description

**`job-offer-scam-detector`** — single-flow template.

1. **Trigger (API Request):** accepts one input, `job_offer_text` (string) — the raw job offer message.
2. **Generate Text (LLM node):** a system prompt instructs the model to evaluate the message against eight known fraud-pattern categories (urgency tactics, upfront payment requests, vague company details, unrealistic compensation, suspicious domains, gamified/dramatic language, off-channel communication requests, no verifiable interview process) and return a structured JSON verdict.
3. **API Response:** returns the JSON result directly to the caller.

## Output Schema

```json
{
  "risk_score": 0,
  "verdict": "Likely Legitimate | Use Caution | Likely Scam",
  "red_flags": ["..."],
  "reasoning": "..."
}
```

## Guardrails

- The agent only evaluates the text it is given — it does not claim to verify a company's real-world legitimacy, contact a domain, or perform any lookup. It is a linguistic/pattern-based signal, not a definitive fraud determination.
- Output is constrained to the fixed JSON schema above; the system prompt explicitly disallows freeform commentary outside that structure.
- This template itself does not add extra logging or storage beyond the LLM call — but data retention ultimately depends on your Lamatic project and model provider settings, which this template does not control.

## Model

Runs on `llama-3.3-70b-versatile` via Groq, chosen for fast inference and reliable instruction-following on structured JSON output at low cost.
