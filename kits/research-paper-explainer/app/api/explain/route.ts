import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paperContent, level } = await req.json();

    if (!paperContent || paperContent.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a research paper abstract or content (at least 50 characters)." },
        { status: 400 }
      );
    }

    const flowUrl = process.env.EXPLAIN_FLOW_URL;
    const apiKey = process.env.LAMATIC_API_KEY;

    if (!flowUrl || !apiKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing EXPLAIN_FLOW_URL or LAMATIC_API_KEY." },
        { status: 500 }
      );
    }

    const response = await fetch(flowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ paperContent, level: level || "undergraduate" }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Lamatic explain flow error:", errText);
      return NextResponse.json(
        { error: "The AI agent failed to process the request. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ explanation: data?.result || data?.output || data });
  } catch (err) {
    console.error("Explain API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
