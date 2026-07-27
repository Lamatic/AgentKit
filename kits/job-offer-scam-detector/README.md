# Job Offer Scam Detector

Paste in a job offer message, get back a structured fraud-risk assessment.

## The Problem

Job seekers — especially freshers applying to many roles at once — regularly receive fraudulent "offers" designed to extract money or personal data. Common patterns include:

- Urgency ("accept within 2 hours or lose the offer")
- Upfront payment requests disguised as "equipment deposits" or "processing fees"
- Requests to move communication off official company channels (straight to WhatsApp/Telegram)
- Vague, unverifiable company details
- Gamified or overly dramatic language designed to build excitement and lower scrutiny

These patterns are recognizable, but easy to miss when you're excited about an offer. This template gives a fast, consistent second opinion.

## What It Does

Send a job offer message as input, and the agent returns:

```json
{
  "risk_score": 90,
  "verdict": "Likely Scam",
  "red_flags": [
    "Urgency/pressure tactics",
    "Requests for upfront payment",
    "Requests to move communication off official channels quickly"
  ],
  "reasoning": "This job offer exhibits multiple red flags, including a sense of urgency and a request for a security deposit, which are indicative of a scam."
}
```

## How It Works

One flow, one LLM node:

**Input → Generate Text (LLM) → Response**

The LLM is instructed via a system prompt to check the message against eight known fraud-pattern categories and return only the JSON shape above — no freeform text.

## Try It

Sample inputs and expected behavior:

| Input type | Expected `verdict` | Expected `risk_score` range |
|---|---|---|
| Urgent payment request + off-channel contact | Likely Scam | 80–100 |
| Formal offer letter, named company, official email domain | Likely Legitimate | 0–20 |
| Friendly tone but pushes to WhatsApp quickly | Use Caution / Likely Scam | 40–90 |

## Setup

1. Import this template into your own Lamatic Studio project, or deploy the flow as-is.
2. No environment variables or external API keys are required beyond your Lamatic project's configured model credential (this template uses Groq's `llama-3.3-70b-versatile`).
3. Call the flow's API endpoint with:

```json

{ "job_offer_text": "<the message to analyze>" }

```

## Limitations & Tradeoffs

- This is a pattern-based linguistic signal, not a verified fraud determination — it doesn't check domains, company registries, or contact real recruiters.
- A single LLM call keeps the template simple and fast, at the cost of not cross-referencing external data sources (e.g., a company database or domain reputation API), which could be a natural extension.
- Kept intentionally scoped to one flow, one job: analyze text, return a structured verdict — rather than building a full case-management or reporting system.
