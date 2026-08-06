# Local Service Booking Agent

A multi-agent appointment booking system for local service businesses (salon, barbershop, and
similar), built for the Lamatic.ai AgentKit challenge. Four discrete Lamatic flows — Intake,
Scheduling, Confirmation, and (stretch) Follow-up — pass a shared session object through
explicit, orchestrated handoffs, driven by a Next.js chat demo app.

See [`agent.md`](./agent.md) for the full architecture, per-flow contracts, guardrails, and
failure modes. See [`docs/decision-log.md`](./docs/decision-log.md) for the reasoning behind
key architectural choices.

## Status

MVP complete: Intake, Scheduling, and Confirmation are all built, tested end-to-end in Lamatic
Studio, and exported into `flows/*.ts`. The Next.js demo app is wired up and builds cleanly.
Remaining before merge: deploying the flows in a Lamatic project and filling in real flow
IDs/credentials in `apps/.env`. Follow-up (reminders) is a stretch goal, started only after the
3-agent MVP is merged.

## Repo layout

```text
kits/zaid-booking-agent/
  lamatic.config.ts       # kit metadata + flow-ID env keys
  agent.md                # architecture, flow contracts, guardrails
  flows/                  # one file per agent flow, exported from Lamatic Studio
  prompts/                # LLM system/user prompts, referenced from flows via @prompts/...
  model-configs/          # per-node LLM model selection, referenced via @model-configs/...
  scripts/                # codeNode script bodies, referenced via @scripts/...
  constitutions/          # guardrail/persona definitions
  apps/                   # Next.js demo app (chat widget + orchestration)
  docs/decision-log.md    # running log of architectural decisions
```

Filenames under `prompts/`, `model-configs/`, and `scripts/` match what Lamatic Studio's
"Export as AgentKit" menu generates verbatim (e.g. `scheduling-agent_llmnode-969_system_0.md`)
since each flow's `@reference` strings point to those exact paths — don't rename them without
also re-exporting the flow.

## Setup

1. **Create a Lamatic project.** Sign up at [lamatic.ai](https://lamatic.ai), create a new
   project, and open Studio.
2. **Import each flow.** The node graphs for Intake, Scheduling, and Confirmation are already
   built and exported into `flows/*.ts` (see the header comment in each file for a full
   node-by-node walkthrough) — recreate them in your own Studio project, or use Studio's import
   if your account supports importing an AgentKit export directly. Deploy each flow and copy
   its Flow ID.
3. **Configure the demo app**:
   ```bash
   cd apps
   cp .env.example .env
   # fill in INTAKE_AGENT, SCHEDULING_AGENT, CONFIRMATION_AGENT, LAMATIC_API_URL,
   # LAMATIC_PROJECT_ID, LAMATIC_API_KEY
   npm install
   npm run dev
   ```
4. Open the app and send a booking request through the chat widget.

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
