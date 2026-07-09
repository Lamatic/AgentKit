// STUB — Intake Agent invocation endpoint, not yet implemented.
//
// Intended behavior: accept { session_id, message }, call the Intake Agent flow via
// lib/lamatic-client.ts (flow ID from INTAKE_AGENT), create or update the session via
// lib/session-store.ts with the result, and return either a clarifying question or the
// structured request.
//
// Build this once the Intake Agent flow is deployed in Lamatic Studio and INTAKE_AGENT is set
// in .env — there is nothing to call yet.
//
// Returns 501 for now so the route is valid and buildable without pretending to work.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
