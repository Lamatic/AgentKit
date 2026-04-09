# Interview Automation Kit (Next.js)

Real-time transcription for interviews with AI post-analysis, built fully in Next.js.

## What This Kit Does

- Captures speech live in the browser (Web Speech API).
- Shows interim and final transcript text while the candidate speaks.
- Sends transcript to a Lamatic workflow for interview analysis.
- Returns:
  - Summary
  - Key interview signals
  - Follow-up questions
  - Recommendation

## Why Next.js Only

This kit keeps everything in one app:

- Frontend: transcript UI
- Backend: server action for Lamatic workflow invocation
- Config: local env + kit metadata

No separate Express service is required for this starter.

## Environment Variables

Create `.env.local`:

```bash
AUTOMATION_INTERVIEW_AUTOMATION="AUTOMATION_INTERVIEW_AUTOMATION Flow ID"
LAMATIC_API_URL="LAMATIC_API_URL"
LAMATIC_PROJECT_ID="LAMATIC_PROJECT_ID"
LAMATIC_API_KEY="LAMATIC_API_KEY"
```

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Lamatic Setup

1. Build/deploy a flow in Lamatic Studio for transcript analysis.
2. Use input field: `transcript`.
3. Return output fields: `summary`, `keySignals`, `followUps`, `recommendation`.
4. Paste the deployed flow ID into `AUTOMATION_INTERVIEW_AUTOMATION`.

## Notes

- Live browser transcription relies on Web Speech API support (best in Chrome/Edge).
- For production-grade multi-speaker audio/video stream STT, you can later replace this with provider realtime WebSocket streaming while keeping the same Next.js UI and Lamatic analysis action.
