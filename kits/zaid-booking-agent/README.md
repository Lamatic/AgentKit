# Local Service Booking Agent

A multi-agent appointment booking system for local service businesses (salon, barbershop, and
similar), built for the Lamatic.ai AgentKit challenge. Four discrete Lamatic flows — Intake,
Scheduling, Confirmation, and (stretch) Follow-up — pass a shared session object through
explicit, orchestrated handoffs, driven by a Next.js chat demo app.

See [`agent.md`](./agent.md) for the full architecture, per-flow contracts, guardrails, and
failure modes. See [`docs/decision-log.md`](./docs/decision-log.md) for the reasoning behind
key architectural choices.

## Status

MVP core complete: Intake, Scheduling, and Confirmation are all built and tested end-to-end in
Lamatic Studio. Remaining before merge: exporting each flow's real node graph into
`flows/*.ts` via Studio's export menu, and wiring up the Next.js demo app. Follow-up
(reminders) is a stretch goal, started only after the 3-agent MVP is merged.

## Repo layout

```
kits/zaid-booking-agent/
  lamatic.config.ts       # kit metadata + flow-ID env keys
  agent.md                # architecture, flow contracts, guardrails
  flows/                  # one file per agent flow (exported from Lamatic Studio)
  prompts/                # LLM system prompts, referenced from flows via @prompts/...
  scripts/                # codeNode script bodies (e.g. mock availability data)
  constitutions/          # guardrail/persona definitions
  apps/                   # Next.js demo app (chat widget + orchestration)
  docs/decision-log.md    # running log of architectural decisions
```

## Setup

1. **Create a Lamatic project.** Sign up at [lamatic.ai](https://lamatic.ai), create a new
   project, and open Studio.
2. **Build the Intake Agent flow first.** In Studio, recreate the node graph described under
   "Intake Agent" in [`agent.md`](./agent.md) and the header comment in
   [`flows/intake-agent.ts`](./flows/intake-agent.ts). Reference the system prompt at
   [`prompts/intake-agent_extract-request_system.md`](./prompts/intake-agent_extract-request_system.md).
   Deploy the flow and copy its Flow ID.
3. **Export the flow** back into this repo via Studio's export menu, replacing the stub content
   of `flows/intake-agent.ts`.
4. **Repeat for Scheduling and Confirmation** once Intake is fully working on its own. The
   Scheduling flow's availability check should be a `codeNode` referencing
   [`scripts/mock-availability.js`](./scripts/mock-availability.js) — no external API needed for
   local development, since Lamatic Studio's cloud runtime can't reach `localhost`.
5. **Configure the demo app**:
   ```bash
   cd apps
   cp .env.example .env
   # fill in INTAKE_AGENT, SCHEDULING_AGENT, CONFIRMATION_AGENT, LAMATIC_API_URL,
   # LAMATIC_PROJECT_ID, LAMATIC_API_KEY
   npm install
   npm run dev
   ```
6. Open the app and send a booking request through the chat widget.

## Shared data contract

Every agent reads/writes the same session object, held and passed forward by the Next.js app
(see `apps/lib/session-store.ts`) as an in-memory `Map` keyed by `session_id`:

```json
{
  "session_id": "string",
  "messages": ["string"],
  "request": {
    "service_type": "string",
    "preferred_date": "string",
    "preferred_window": "string",
    "name": "string",
    "phone": "string",
    "notes": "string"
  },
  "status": "intake | scheduling | awaiting_confirmation | confirmed",
  "proposed_slots": [{ "date": "string", "time": "string" }],
  "confirmed_slot": { "date": "string", "time": "string" } | null,
  "confirmation_message": "string | null"
}
```

`name`/`phone` live inside `request` rather than a separate `customer` object, matching what
the Intake Agent's extraction actually returns as one flat object. `messages` accumulates the
raw customer messages across a clarification round-trip — the Intake Agent extracts from a
single message string with no memory of its own, so the app re-sends the whole conversation
joined together each time rather than just the latest reply. `status` values `reminded` /
`no_show` are reserved for the Follow-up Agent stretch goal, not yet built.

## Why 4 discrete agents instead of one prompt

Separation of concerns and independent testability: each flow has one job, a typed
input/output contract, and can be built and verified in Lamatic Studio on its own before being
wired into the next flow. See `docs/decision-log.md` for the full reasoning, including why the
Next.js app (not flow-to-flow chaining) owns the session state.
