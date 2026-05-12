import { NextResponse } from 'next/server';
import { orchestrateFlow } from '../../../actions/orchestrate';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, message, messageType, chatHistory, selectedExcuse, selectedPerson } = body;

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return NextResponse.json(
        { error: "Invalid request: sessionId is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // Call the Lamatic flow via our server action SDK wrapper
    const result = await orchestrateFlow({
      sessionId,
      message: message || "",
      messageType: messageType || "chat",
      chatHistory: chatHistory || [],
      selectedExcuse: selectedExcuse || "",
      selectedPerson: selectedPerson || "",
    });

    if (!result.success) {
      // Mock response for development if missing credentials
      if (process.env.NODE_ENV === 'development' && result.error?.includes('credentials')) {
        return NextResponse.json({
          response: {
            type: selectedExcuse ? "question" : "options",
            message: selectedExcuse
              ? `Generating an excuse based on: ${selectedExcuse}... Here is your excuse: "I'm sorry, I was unexpectedly trapped in a time loop!"`
              : "What kind of excuse do you need today?",
            items: selectedExcuse ? [] : ["Work", "Social Event", "Family Gathering", "Other"],
            person: "Excuse Generator Bot"
          },
          selectionConfirmed: selectedExcuse ? {
            type: "done",
            message: "Thankyou, see you later!!"
          } : null
        });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // result.data contains { response, selectionConfirmed }
    return NextResponse.json(result.data);

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
