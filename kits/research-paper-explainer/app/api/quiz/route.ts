import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paperContent, numQuestions } = await req.json();

    if (!paperContent || paperContent.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide paper content before generating a quiz." },
        { status: 400 }
      );
    }

    const flowUrl = process.env.QUIZ_FLOW_URL;
    const apiKey = process.env.LAMATIC_API_KEY;

    if (!flowUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing QUIZ_FLOW_URL or LAMATIC_API_KEY." },
        { status: 500 }
      );
    }

    const response = await fetch(flowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        paperContent,
        numQuestions: numQuestions || 5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Lamatic quiz flow error:", errText);
      return NextResponse.json(
        { error: "The AI agent failed to generate the quiz. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw = data?.result || data?.output || data;

    // Parse if the LLM returned a JSON string
    let parsed: { questions: QuizQuestion[] };
    if (typeof raw === "string") {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } else {
      parsed = raw;
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Quiz API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
