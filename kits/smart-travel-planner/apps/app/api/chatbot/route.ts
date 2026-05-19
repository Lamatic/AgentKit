import { NextResponse } from "next/server";
import { runChatAgent } from "../../../actions/orchestrate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = String(body?.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }
    const result = await runChatAgent({ message });

    return NextResponse.json({
      success: true,
      reply: result?.result ?? result, 
    });
  } catch (error) {
    console.error("Chatbot route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get chatbot reply",
      },
      { status: 500 }
    );
  }
}