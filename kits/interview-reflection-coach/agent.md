# Interview Reflection Coach

Interview Reflection Coach is a candidate-side career assistant for post-interview reflection and next-round preparation.

## Purpose

Candidates often leave interviews with scattered notes and uncertain next steps. This agent converts those notes into a structured, actionable report that helps the candidate understand what went well, what needs improvement, and how to prepare for the next round.

## Flow Description

The flow accepts an API request with anonymous interview details, sends the structured context to an LLM, and returns a Markdown reflection report.

```text
API Request -> Generate Reflection Report -> Response
```

## Required Inputs

- `candidateAlias`: Anonymous candidate label, for example `Candidate A`.
- `role`: Role applied for.
- `company`: Company name.
- `interviewRound`: Interview stage or round.
- `interviewNotes`: Raw notes from the candidate.
- `questionsAsked`: Questions asked during the interview.
- `answersGiven`: Candidate's remembered answers.
- `candidateFeeling`: Candidate's self-assessment.
- `recruiterComments`: Any recruiter or interviewer feedback.

## Output

The response contains `reflectionReport`, a Markdown report with:

- interview summary
- strengths demonstrated
- weak spots or gaps
- improved STAR answers
- follow-up email draft
- next-round preparation plan
- confidence score
- top 3 focus areas

## Guardrails

- Do not request or expose personally identifiable candidate information.
- Refer to the person only as `the candidate` or by the provided alias.
- Do not invent facts when interview details are missing.
- Clearly mark missing details and suggest what the candidate should clarify.
- Keep feedback supportive, practical, and role-specific.

## Integration Reference

This template is exposed through an API Request trigger and returns a JSON response:

```json
{
  "reflectionReport": "..."
}
```
