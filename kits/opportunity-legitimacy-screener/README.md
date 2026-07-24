# Opportunity Legitimacy Screener

A two-flow AgentKit bundle that screens job postings, recruiter emails, and freelance briefs for legitimacy — extracting structured signals, running live web research, and returning a risk tier with a plain-English explanation.

## The Problem

Job seekers and freelancers — especially students and early-career candidates applying to many roles quickly — are frequent targets of fraudulent postings: fake recruiters, advance-fee scams, and "too good to be true" remote offers with generic contact methods and vague company details. Manually verifying a posting (checking the company's web presence, cross-referencing contact details, searching for prior scam reports) takes time, and it's easy to skip that step when you're excited about an opportunity or in a hurry to respond.

## The Approach

The bundle is split into two flows that run in sequence:

1. **`gather-signals`** takes raw, unstructured text (a job posting, a recruiter email, a freelance brief) and:
   - Uses an LLM (Gemini 2.5 Flash) to extract structured fields: company name, claimed domain, sender email, stated compensation, role title, and contact method.
   - Runs a live web search (Serper) for the company name, and filters the results down to only those that actually mention the company — avoiding false signal from generically-named companies matching unrelated products (a real failure mode caught during testing — see Tradeoffs below).

2. **`score-and-explain`** takes that structured output and:
   - Runs a rule-based scoring pass counting red flags: a generic email domain (gmail/yahoo/outlook/hotmail), no verifiable web presence for the company, and negative reports (scam/fraud/complaint) surfacing in search results — with negation handling so phrases like "not a scam" or "no complaints" don't get misread as red flags.
   - Maps the flag count to a risk tier (`low` / `medium` / `high`) and routes to one of three tier-specific LLM prompts to generate a plain-English explanation and a recommended action (`proceed`, `verify_further`, or `avoid`).

## The Result

Given a raw posting or message, the bundle returns:

```json
{
  "risk_tier": "high",
  "explanation": "This opportunity has been flagged as high risk due to multiple concerns, including a generic contact method, unverifiable web presence, and/or negative reports. This pattern is highly consistent with known scam and fraud tactics. We strongly recommend you avoid proceeding without thorough, independent verification.",
  "recommended_action": "avoid"
}
```

This was validated end-to-end against three real test cases spanning all three tiers (a suspicious recruiter contact with a generic email and no verifiable web presence → `high`; a company with a clean, verifiable web presence and no red flags → `low`; a company using only a generic contact email with everything else clean → `medium`), plus the flow's own Else/fallback path.

## Setup

1. Fork/clone this repo and open the AgentKit project in [Lamatic Studio](https://studio.lamatic.ai).
2. Configure two credentials in your Lamatic project's Connections:
   - A Gemini model credential (used by both flows' `Generate Text` nodes).
   - A Serper API credential, named `Serper - AgentKit` to match the `Web Search` node in `gather-signals` (or update the node's credential reference to match your own credential name).
3. Import/deploy both flows (`gather-signals` and `score-and-explain`).
4. Copy `.env.example` to `.env.local` and fill in your Lamatic API URL, project ID, and API key.
5. Call `gather-signals` with `{ "raw_text": "...", "source_type": "..." }`, then pass its full output directly as the input to `score-and-explain`. See "Tradeoffs" below for why this is a manual two-call sequence rather than a single chained call.

## Tradeoffs & Limitations

Being upfront about what this doesn't (yet) do well:

- **The two flows are not internally chained.** The original design used Lamatic's Execute Flow (`flowNode`) node so `gather-signals` would call `score-and-explain` directly and a single API call would return the final verdict. This worked when tested manually in Studio's editor, but after deployment the chained call consistently returned an empty result with no corresponding entry in the target flow's execution logs, across multiple redeploy attempts. Since the underlying cause appeared to be platform-level rather than something fixable in the flow configuration, this bundle ships with the two flows independently deployed and tested, meant to be called in sequence by the consumer (see Setup above) rather than internally chained.
- **The negative-reports check is keyword matching, not semantic understanding.** It looks for the literal words "scam," "fraud," or "complaint" in search results (after stripping negated phrases like "not a scam"). This means it can miss reports that describe fraud without using those exact words, and — despite the negation handling — may still be fooled by more complex phrasing patterns it wasn't tested against.
- **LLM extraction is not fully deterministic.** Identical input text extracted `contact_method` as `"Gmail"` in one test run and `"Email"` in another. This doesn't change the resulting risk tier in practice (both correctly triggered the generic-email red flag), but it means the exact extracted values can vary slightly between runs of the same input.
- **The `search_results` field is a lossy summary,** capped at the top 3 relevant snippets joined into one string, rather than the full structured search response — a deliberate tradeoff to keep the downstream scoring logic simple, at the cost of losing some detail (ratings, source dates, etc.) that a more sophisticated version could use.
