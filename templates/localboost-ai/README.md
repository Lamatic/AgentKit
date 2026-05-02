# LocalBoost AI – Lead Intelligence for Local Businesses

LocalBoost AI is a Lamatic flow that analyzes real local business websites and generates structured lead insights along with personalized outreach messages.

It combines web scraping (Firecrawl) with AI analysis to identify positioning gaps, conversion issues, and growth opportunities.

---

## What This Flow Does

* Scrapes the business website content
* Extracts key signals (services, location, CTA)
* Identifies trust and conversion gaps
* Suggests actionable growth opportunities
* Generates a personalized outreach message in Portuguese
* Scores the lead based on potential

---

## Use Cases

* Agencies prospecting local businesses
* Freelancers offering marketing services
* Sales teams needing faster lead research
* AI-driven outbound workflows

---

## Input

```json
{
  "business_name": "string",
  "website": "string",
  "instagram": "string",
  "location": "string"
}
```

---

## Output

```json
{
  "business_summary": "string",
  "evidence": ["string"],
  "detected_problems": ["string"],
  "growth_opportunities": ["string"],
  "quick_wins": ["string"],
  "offer_angle": "string",
  "personalized_outreach": "string",
  "lead_score": "High | Medium | Low",
  "reason_for_score": "string"
}
```

---

## How It Works

1. API Request receives business data
2. Firecrawl scrapes website content
3. AI analyzes real content and generates structured insights
4. API Response returns ready-to-use lead intelligence

---

## Requirements

* Lamatic account
* Firecrawl integration
* OpenAI (or compatible LLM)

---

## Flow ID

Replace with your actual deployed flow ID:

```
your-flow-id
```

---

## Future Improvements

* Multi-source analysis (website + Instagram + Google Maps)
* Batch processing for multiple leads
* CRM integration
* Follow-up message generation
* Lead enrichment with external data

---

## Why This Matters

Most outreach is generic.

This flow makes outreach **contextual, data-driven, and personalized**, increasing the chances of response and conversion.
