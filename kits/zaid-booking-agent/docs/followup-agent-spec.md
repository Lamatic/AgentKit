# Follow-up Agent — stretch goal spec

STUB — not started. Per the project spec: do not begin this until the 3-agent MVP
(Intake → Scheduling → Confirmation) is fully working and merged.

This is a specification document, not a flow export — there is no real Lamatic Studio flow
behind it yet, so it does not live under `flows/` (that directory is reserved for real
`meta`/`inputs`/`references`/`nodes`/`edges` exports from Studio; see CLAUDE.md). Once this
flow is built, export it the same way as the other three and move it into `flows/`.

## Purpose

Sends a reminder message for each booking confirmed for the next day. Runs on its own daily
schedule; not invoked by the Next.js app's per-customer flow sequence.

## Trigger

Scheduled/cron (daily).

## Planned Node Walkthrough

1. `Cron Trigger` — runs once daily.
2. `Query Tomorrow's Bookings` (codeNode/apiNode) — reads confirmed bookings for the next
   calendar day from the booking store.
3. `Generate Reminder` (LLMNode, runs per booking) — generates a reminder message. System
   prompt: `@prompts/followup-agent_reminder_system.md`.
4. `Send Reminder` (apiNode) — sends the reminder via Twilio SMS.
5. (stretch of stretch) `Check For Reply` / `Flag No-Show` — flags a booking `no_show` if no
   confirmation reply is received before the appointment time.

## Dependencies

- Booking store (shared with Confirmation Agent).
- Twilio.
- LLM provider for the Generate Reminder node.
