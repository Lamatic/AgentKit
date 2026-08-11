import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth/session";

/**
 * GET /api/auth/github/session
 * Returns current authenticated user profile WITHOUT exposing access token.
 */
export async function GET() {
  const session = await getSession();

  if (!session?.user || !session?.accessToken) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    user: session.user,
  });
}

/**
 * DELETE /api/auth/github/session
 * Clears user session cookie (Disconnect GitHub).
 */
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true, connected: false });
}
