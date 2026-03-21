import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/actions/orchestrate";

export async function POST(req: NextRequest) {
  try {
    const { paperContent, numQuestions } = await req.json();

    if (!paperContent || paperContent.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of paper content." },
        { status: 400 }
      );
    }

    const result = await generateQuiz(paperContent, numQuestions || 5);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Quiz route error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}