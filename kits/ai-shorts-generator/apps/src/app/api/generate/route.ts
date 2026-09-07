import { NextRequest, NextResponse } from "next/server";

type Scene = {
  scene_number: number;
  voiceover_text: string;
  image_url: string | null;
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const requestData = typeof body === "object" && body !== null
    ? body as Record<string, unknown>
    : null;
  if (!requestData) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  // The browser requests narration from this same-origin route so CORS cannot block recording.
  if (typeof requestData.ttsText === "string") {
    return createNarrationAudio(requestData.ttsText);
  }

  const sampleInput =
    requestData.sampleInput;
  if (typeof sampleInput !== "string" || !sampleInput.trim()) {
    return NextResponse.json(
      { error: "sampleInput is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_PROJECT_API_KEY;
  const flowId = process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID;
  if (!endpoint || !projectId || !apiKey || !flowId) {
    return NextResponse.json(
      { error: "Lamatic credentials are not configured. Check your .env file." },
      { status: 500 }
    );
  }

  let rawOutput: unknown;
  try {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 30000);
    const lamaticResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-id": projectId,
      },
      body: JSON.stringify({
        query: `query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
          executeWorkflow(workflowId: $workflowId, payload: $payload) { status result }
        }`,
        variables: {
          workflowId: flowId,
          payload: { sampleInput: sampleInput.trim() },
        },
      }),
      signal: abortController.signal,
    });
    clearTimeout(timeout);
    if (!lamaticResponse.ok) {
      return NextResponse.json(
        { error: `Lamatic could not process this request (status ${lamaticResponse.status}). Check the project endpoint, API key, and deployed flow ID in .env.` },
        { status: 502 }
      );
    }
    const graphQLResponse = await lamaticResponse.json().catch(() => null) as {
      data?: { executeWorkflow?: { status?: string; result?: unknown } };
      errors?: Array<{ message?: string }>;
    } | null;
    if (!graphQLResponse) {
      return NextResponse.json(
        { error: "Lamatic returned a response that was not valid JSON. Check the project endpoint in .env." },
        { status: 502 }
      );
    }

    if (graphQLResponse.errors?.length) {
      return NextResponse.json(
        { error: `Flow returned an error: ${graphQLResponse.errors[0].message ?? "Unknown error"}` },
        { status: 502 }
      );
    }
    const execution = graphQLResponse.data?.executeWorkflow;
    if (!execution) {
      return NextResponse.json(
        { error: "Lamatic returned no flow result. Confirm that the flow is deployed and that NEXT_PUBLIC_LAMATIC_FLOW_ID is correct." },
        { status: 502 }
      );
    }
    if (execution?.status === "error") {
      return NextResponse.json({ error: "Lamatic flow returned an error." }, { status: 502 });
    }
    rawOutput = execution?.result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "The AI flow timed out. Please try again." }, { status: 504 });
    }
    console.error("Lamatic SDK error:", error);
    return NextResponse.json(
      { error: "Failed to execute Lamatic flow. Check your credentials and flow status." },
      { status: 502 }
    );
  }

  let parsed: unknown = rawOutput;
  if (typeof rawOutput === "string") {
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return NextResponse.json({ error: "The AI returned invalid JSON." }, { status: 502 });
    }
  }

  const output =
    typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>).output
      : undefined;
  if (!Array.isArray(output) || !output.length || !output.every(isScene)) {
    return NextResponse.json(
      { error: "The AI response did not contain valid video scenes." },
      { status: 502 }
    );
  }

  return NextResponse.json({ output: output as Scene[] });
}

async function createNarrationAudio(text: string) {
  const narration = text.trim();
  if (!narration) {
    return NextResponse.json({ error: "Narration text is required." }, { status: 400 });
  }
  if (narration.length > 180) {
    return NextResponse.json({ error: "Narration text must be 180 characters or less." }, { status: 400 });
  }

  try {
    const ttsUrl = new URL("https://translate.googleapis.com/translate_tts");
    ttsUrl.searchParams.set("ie", "UTF-8");
    ttsUrl.searchParams.set("client", "tw-ob");
    ttsUrl.searchParams.set("tl", "en");
    ttsUrl.searchParams.set("q", narration);
    const response = await fetch(ttsUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "The free narration service is unavailable right now. Please try again in a moment." },
        { status: 503 }
      );
    }
    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Narration audio request failed:", error);
    return NextResponse.json(
      { error: "The server could not reach the free narration service. Check its internet connection and try again." },
      { status: 503 }
    );
  }
}

function isScene(value: unknown): value is Scene {
  if (typeof value !== "object" || value === null) return false;
  const scene = value as Record<string, unknown>;
  return (
    typeof scene.scene_number === "number" &&
    typeof scene.voiceover_text === "string" &&
    scene.voiceover_text.trim().length > 0 &&
    (typeof scene.image_url === "string" || scene.image_url === null)
  );
}
