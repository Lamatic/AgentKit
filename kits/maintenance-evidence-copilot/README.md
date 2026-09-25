# Maintenance Evidence Copilot

Maintenance Evidence Copilot is a single-flow Lamatic kit for reviewing a synthetic maintenance event for `MTR-101`, the Cooling Fan Drive Motor 101. It preserves the flow's deterministic telemetry status and priority, presents source-linked supporting and contradictory evidence, and keeps all possible explanations explicitly unconfirmed.

## What it does

- Runs the deployed `triage-maintenance-event` Lamatic flow for one of three fixed demonstration scenarios.
- Displays the returned assessment as read-only decision-support information.
- Produces a local CMMS-style inspection draft only after a human selects **Approve Assessment**. The approval does not call another model or external system.

## Prerequisites

- Node.js 20.9 or later
- npm 10 or later
- A deployed `triage-maintenance-event` flow in Lamatic Studio

## Setup

```bash
cd apps
cp .env.example .env.local
npm install
npm run dev
```

Set the four placeholders in `.env.local` with values from Lamatic Studio. Do not commit `.env.local`.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `LAMATIC_API_KEY` | Authenticates the server-side Lamatic API call. |
| `LAMATIC_PROJECT_ID` | Selects the Lamatic project. |
| `LAMATIC_API_URL` | Lamatic API endpoint. |
| `TRIAGE_MAINTENANCE_EVENT_FLOW_ID` | Deployed ID of the `triage-maintenance-event` flow. |

## Safety boundary

This is a synthetic decision-support demonstration. It does not confirm a root cause, authorize shutdown or repair, bypass isolation, or operate exposed equipment. Any physical inspection must follow approved site procedures.
