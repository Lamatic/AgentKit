import { NextResponse } from "next/server";
import { runFlow } from "@/lib/lamatic-client";
import { getOrCreateSession, updateSession, type BookingRequest } from "@/lib/session-store";

type IntakeOutput = {
  needs_clarification: boolean;
  clarifying_question: string;
  request: BookingRequest;
};

export async function POST(request: Request) {
  const { session_id, message } = await request.json();
  if (!session_id || !message) {
    return NextResponse.json(
      { error: "session_id and message are required" },
      { status: 400 }
    );
  }

  const flowId = process.env.INTAKE_AGENT;
  if (!flowId) {
    return NextResponse.json(
      { error: "INTAKE_AGENT flow ID is not configured" },
      { status: 500 }
    );
  }

  const session = getOrCreateSession(session_id);
  const messages = [...session.messages, message];

  try {
    const result = await runFlow<IntakeOutput>(flowId, {
      // Intake extracts from one message with no memory of its own, so re-send the whole
      // conversation joined together — this lets a clarifying answer combine with what the
      // customer already said, without needing state inside the flow itself.
      message: messages.join(" "),
      session_id,
    });

    const updated = updateSession(session_id, {
      messages,
      request: result.needs_clarification ? session.request : result.request,
      status: result.needs_clarification ? "intake" : "scheduling",
    });

    return NextResponse.json({
      needs_clarification: result.needs_clarification,
      clarifying_question: result.clarifying_question,
      request: updated.request,
      session_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Intake Agent call failed" },
      { status: 502 }
    );
  }
}
