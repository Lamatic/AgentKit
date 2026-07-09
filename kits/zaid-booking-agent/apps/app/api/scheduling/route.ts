// STUB — Scheduling Agent invocation endpoint, not yet implemented.
//
// Intended behavior: accept { session_id }, read the session's `request` via
// lib/session-store.ts, call the Scheduling Agent flow via lib/lamatic-client.ts (flow ID from
// SCHEDULING_AGENT), update the session's `proposed_slots` and `status`, and return the
// result for the chat UI to present.
//
// Build this only after the Intake Agent flow + this endpoint's predecessor (app/api/intake)
// are working — this is agent #2 in the build order (see top-level README.md).
//
// Returns 501 for now so the route is valid and buildable without pretending to work.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
