# Interview Automation Kit (Next.js)

Run a complete interview assistant in one app: capture live speech, build a transcript in real time, and send it to Lamatic for structured interview insights.

## The Story

Interviews move fast. Notes get messy. Signals get missed.

This kit helps you keep up by turning spoken conversation into an always-visible transcript, then transforming that transcript into useful guidance:

- What happened (summary)
- What mattered (key signals)
- What to ask next (follow-ups)
- What to decide (recommendation)

You can start with this as a local prototype and evolve it into a production interview copilot.

## How It Works

1. The browser captures speech with Web Speech API.
2. The UI shows interim and final transcript text as the interview progresses.
3. On Analyze, the full transcript is sent to a Next.js server action.
4. The server action invokes your Lamatic workflow using your configured workflow ID.
5. Lamatic returns analysis output that is rendered in the app.

## Why This Kit Is Next.js Only

Everything lives in one project by design:

- Frontend: camera + transcript UI
- Backend: server action for Lamatic workflow execution
- Configuration: environment variables + kit metadata

No separate Express service is required for this starter.

## What You Get Out Of The Box

- Live transcript experience with start, stop, and reset controls
- Optional camera preview for interview context
- Lamatic workflow integration through a single server action
- Clear environment-variable driven setup

## Environment Variables

Create a `.env.local` file in this kit folder:

```bash
AUTOMATION_INTERVIEW_AUTOMATION="YOUR_FLOW_ID"
LAMATIC_API_URL="YOUR_LAMATIC_API_URL"
LAMATIC_PROJECT_ID="YOUR_PROJECT_ID"
LAMATIC_API_KEY="YOUR_API_KEY"
```

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Lamatic Workflow Requirements

Configure a Lamatic flow that:

1. Accepts transcript text as input.
2. Performs interview analysis.
3. Returns these fields (recommended):
   - `summary`
   - `keySignals`
   - `followUps`
   - `recommendation`

Set the deployed workflow ID in `AUTOMATION_INTERVIEW_AUTOMATION`.

## Suggested User Journey

1. Start camera (optional).
2. Start live transcription.
3. Conduct interview normally.
4. Stop transcription.
5. Click Analyze Transcript.
6. Review summary and recommendations.

## Production Notes

- Browser speech recognition support is strongest in Chrome and Edge.
- For multi-speaker or higher-accuracy transcription, replace browser STT with a streaming provider, while keeping the same UI and Lamatic analysis flow.
