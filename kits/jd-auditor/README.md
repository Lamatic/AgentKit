# JD Auditor

## The problem
A weak job description loses good candidates before the first interview. Recruiters often include biased wording ("rockstar", "young and energetic"), impossible requirements ("10 years of experience in a 3-year-old framework") or leave out basics like salary and location, and they rarely have time to review every posting.

## What it does
Paste a job description and an optional company name. JD Auditor returns structured JSON with:
- A score from 0 to 100 and a one-sentence reason
- Biased or exclusionary phrases, each with a neutral alternative
- Unrealistic requirements, each with a suggestion
- Missing or unclear parts (for example salary range, location, must-have versus nice-to-have)
- Strengths of the posting

## How it works
API Request -> Analyzer (LLM) -> API Response

## Inputs
- `job_description` (string): the full job description
- `company_name` (string, optional): the hiring company

## Output
`analysis` containing: `role_title`, `overall_score`, `score_reason`, `biased_language[]`, `unrealistic_requirements[]`, `missing_or_unclear[]`, `strengths[]`.

## Example
Input: "We are looking for a young and energetic rockstar developer with 10 years of experience in a 3-year-old framework. Must be a recent graduate and a good culture fit. He will work long hours."
Result: low score (5/100) with the biased phrases, the impossible experience requirement and the missing details flagged.

## Design decisions and tradeoffs
- It only flags phrases that actually appear in the text, and quotes them exactly.
- Very short or non-job-description input returns an error instead of a guess.
- It is decision support: a recruiter should review every suggestion. A score is a guide, not a verdict.
- A single LLM step keeps the flow simple and fast. Rewriting the full job description is a possible future step.

## Setup
1. Import the flow into Lamatic Studio.
2. Add a model credential (for example Gemini) and select a model on the Analyzer node.
3. Deploy, then call the flow with `job_description` and `company_name`.

## Related work
Existing hiring kits in this repository focus on resume screening and interview feedback. JD Auditor works earlier in the process, on the job posting itself.