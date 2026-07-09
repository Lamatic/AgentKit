// STUB — session read/write endpoint, not yet implemented.
//
// Intended behavior: GET returns the current session object for `id` (see lib/session-store.ts
// for the shape); PUT/PATCH updates it. Used by the other API routes and, if needed, by the
// chat UI to poll session status.
//
// Returns 501 for now so the route is valid and buildable without pretending to work.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
