# Interview Reflection Coach

Interview Reflection Coach helps job candidates turn anonymous post-interview notes into structured feedback, improved STAR-format answers, professional follow-up drafts, and next-round preparation plans.

The template is designed for candidates after screening, technical, behavioral, or challenge rounds. It keeps the candidate identity private by using a candidate alias instead of personally identifiable information.

## What it does

- Summarizes interview context from raw notes.
- Identifies strengths demonstrated during the interview.
- Flags weak or incomplete answers.
- Rewrites weak answers using the STAR method.
- Drafts a concise follow-up email.
- Creates a prioritized next-round preparation plan.
- Produces a confidence score and top focus areas.

## Input schema

```json
{
  "candidateAlias": "Candidate A",
  "role": "Applied AI Engineer",
  "company": "Lamatic.ai",
  "interviewRound": "Technical Interview",
  "interviewNotes": "The candidate explained their AI project clearly but missed deployment details.",
  "questionsAsked": "Tell me about your AI project. How would you scale it?",
  "answersGiven": "The candidate described the project, model choice, and motivation.",
  "candidateFeeling": "Confident overall but unsure about the system design answer.",
  "recruiterComments": "The next round will focus on practical AI workflow building."
}
```

## Output

The flow returns a `reflectionReport` containing:

- Interview Reflection Summary
- Strengths Demonstrated
- Weak Spots or Gaps
- Improved STAR Answers
- Follow-Up Email Draft
- Next-Round Preparation Plan
- Confidence Score
- Top 3 Focus Areas

## Privacy

This template does not require real candidate names. Use an alias such as `Candidate A`. The prompt instructs the model not to ask for or expose personal identifiers.

## Flow

```text
API Request -> Generate Reflection Report -> Response
```
