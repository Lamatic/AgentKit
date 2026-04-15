# Interview Transcript Analysis Flow

This Lamatic flow receives a live interview transcript and returns structured AI-powered analysis.

## What It Does

Takes the full text of an interview transcript and returns:

- **Summary** — A concise overview of the candidate's performance.
- **Key Signals** — Notable positive or negative signals from the conversation.
- **Follow-ups** — Suggested follow-up questions for the interviewer.
- **Recommendation** — A hiring decision with brief rationale (`Strong Hire`, `Hire`, `No Hire`, or `Strong No Hire`).

## Flow Architecture

```
API Request (trigger)
  └─> Interview Analyst (LLM node)
        └─> Parse Output (Code node)
              └─> Response
```

## Input Schema

| Field        | Type   | Description                                |
|-------------|--------|--------------------------------------------|
| `transcript` | string | Full interview transcript text             |

## Output Schema

| Field            | Type   | Description                                      |
|-----------------|--------|--------------------------------------------------|
| `summary`        | string | 2–3 sentence performance overview                |
| `keySignals`     | string | Notable signals from the interview               |
| `followUps`      | string | Suggested follow-up questions                    |
| `recommendation` | string | Hire decision with rationale                     |

## Setup in Lamatic Studio

1. Import `config.json` into Lamatic Studio as a new flow.
2. Select an LLM model and credentials in the `Interview Analyst` node (`inputs.json`).
3. Deploy the flow.
4. Copy the deployed workflow ID into `.env.local` as `AUTOMATION_INTERVIEW_AUTOMATION`.

## Testing

Use the sample input from `meta.json` to test in Lamatic Studio before connecting to the app.
