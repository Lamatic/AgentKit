// STUB — Confirmation Agent invocation endpoint, not yet implemented.
//
// Intended behavior: accept { session_id, confirmed_slot }, call the Confirmation Agent flow
// via lib/lamatic-client.ts (flow ID from CONFIRMATION_AGENT), update the session's
// `confirmed_slot` and `status` to "confirmed" via lib/session-store.ts, and return the
// natural-language confirmation message.
//
// Build this last, after Intake and Scheduling are both working — this is agent #3 in the
// build order (see top-level README.md).
//
// Returns 501 for now so the route is valid and buildable without pretending to work.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
