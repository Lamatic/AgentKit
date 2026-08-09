# Rejection Email Decoder

Paste in a job rejection email and get a clear read on what it actually means.

## The Problem
When you're applying to many roles at once — especially as an entry-level candidate — rejection emails pile up fast, and most of them are frustratingly vague. It's genuinely hard to tell the difference between a cold, copy-pasted auto-reject and one where the company left a real door open. Any specific feedback is often buried in soft, ambiguous language ("we were impressed by your background, but decided to move forward with other candidates"), making it hard to know what — if anything — to change before applying again.

## What It Does
Send in the text of a rejection email, and the agent returns:
- **Type**: Generic template / Semi-personalized / Fully personalized
- **Reapply signal**: Encouraged to reapply / Unclear / Door closed
- **Plain-language takeaway**: any real feedback translated into something actionable
- **Tone**: Warm / Neutral / Cold

## How It Works
One flow, one LLM node:

**Input → Generate Text (LLM) → Response**

The LLM is instructed via a system prompt to classify the rejection email against these four dimensions and return a structured, easy-to-read summary — not vague reassurance, not corporate-speak restated. The email text is treated strictly as data to analyze, never as instructions to follow.

## Try It
1. Import this template into your own Lamatic Studio project (or fork this repo and deploy the flow as-is).
2. In the **Generate Text** node, connect a credential for **Gemini** (or another supported model provider) under "Select Credential," and choose a model under "Select Model."
3. Click **Deploy** to make the flow live.
4. Call the deployed flow's API endpoint with:
```json
{ "rejection_email_text": "<the rejection email text to analyze>" }
```

## Example
Input: a generic "we've decided to move forward with other candidates" email

Output:
```
Type: Generic template
Reapply signal: Unclear
Plain-language takeaway: No specific feedback was given; this reads as a standard auto-reject with no clear invitation or rejection of a future application.
Tone: Neutral
```

## Limitations & Tradeoffs
- This reads tone and language patterns — it can't verify a company's actual internal decision or hiring plans.
- A single LLM call keeps the template simple and fast, at the cost of not cross-referencing anything external.
- Kept intentionally scoped to one job: read a rejection email, return a structured interpretation — not a full application-tracking system.
