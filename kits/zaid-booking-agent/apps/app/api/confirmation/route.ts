import { NextResponse } from "next/server";
import { runFlow } from "@/lib/lamatic-client";
import { getSession, updateSession, type Slot } from "@/lib/session-store";

type ConfirmationOutput = {
  booked: boolean;
  confirmation_message: string;
};

export async function POST(request: Request) {
  const { session_id, confirmed_slot } = (await request.json()) as {
    session_id?: string;
    confirmed_slot?: Slot;
  };
  if (!session_id || !confirmed_slot?.date || !confirmed_slot?.time) {
    return NextResponse.json(
      { error: "session_id and confirmed_slot { date, time } are required" },
      { status: 400 }
    );
  }

  const session = getSession(session_id);
  if (!session || !session.request) {
    return NextResponse.json(
      { error: "session has no structured request yet" },
      { status: 400 }
    );
  }

  const flowId = process.env.CONFIRMATION_AGENT;
  if (!flowId) {
    return NextResponse.json(
      { error: "CONFIRMATION_AGENT flow ID is not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await runFlow<ConfirmationOutput>(flowId, {
      confirmed_date: confirmed_slot.date,
      confirmed_time: confirmed_slot.time,
      service_type: session.request.service_type,
      customer_name: session.request.name,
      session_id,
    });

    const updated = updateSession(session_id, {
      confirmed_slot: result.booked ? confirmed_slot : null,
      status: result.booked ? "confirmed" : "awaiting_confirmation",
      confirmation_message: result.confirmation_message,
    });

    return NextResponse.json({
      booked: result.booked,
      confirmation_message: updated.confirmation_message,
      session_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Confirmation Agent call failed" },
      { status: 502 }
    );
  }
}
