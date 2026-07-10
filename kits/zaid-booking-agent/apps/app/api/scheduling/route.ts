import { NextResponse } from "next/server";
import { runFlow } from "@/lib/lamatic-client";
import { getSession, updateSession, type Slot } from "@/lib/session-store";

type SchedulingOutput = {
  slot_available: boolean;
  proposed_slots: Slot[];
  message: string;
};

export async function POST(request: Request) {
  const { session_id } = await request.json();
  if (!session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const session = getSession(session_id);
  if (!session || !session.request) {
    return NextResponse.json(
      { error: "session has no structured request yet — call /api/intake first" },
      { status: 400 }
    );
  }

  const flowId = process.env.SCHEDULING_AGENT;
  if (!flowId) {
    return NextResponse.json(
      { error: "SCHEDULING_AGENT flow ID is not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await runFlow<SchedulingOutput>(flowId, {
      preferred_date: session.request.preferred_date,
      preferred_window: session.request.preferred_window,
      session_id,
    });

    const updated = updateSession(session_id, {
      proposed_slots: result.proposed_slots,
      status: "awaiting_confirmation",
    });

    return NextResponse.json({
      message: result.message,
      proposed_slots: updated.proposed_slots,
      session_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduling Agent call failed" },
      { status: 502 }
    );
  }
}
