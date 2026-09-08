import { NextRequest, NextResponse } from "next/server";
import { Lamatic } from "lamatic";

type Scene = {
  scene_number: number;
  voiceover_text: string;
  image_url: string | null;
};

const FLOW_TIMEOUT_MS = 30_000;
const TTS_TIMEOUT_MS = 15_000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  const requestData = body as Record<string, unknown>;

  if (typeof requestData.ttsText === "string") {
    return createNarrationAudio(requestData.ttsText);
  }

  const sampleInput = requestData.sampleInput;
  if (typeof sampleInput !== "string" || !sampleInput.trim()) {
    return NextResponse.json(
      { error: "sampleInput is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  const endpoint = validatedHttpsEndpoint(process.env.LAMATIC_PROJECT_ENDPOINT);
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_PROJECT_API_KEY;
  const flowId = process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID;
  if (!endpoint || !projectId || !apiKey || !flowId) {
    return NextResponse.json(
      { error: "Lamatic credentials are incomplete or the project endpoint is not a valid HTTPS URL." },
      { status: 500 }
    );
  }

  let rawOutput: unknown;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const lamatic = new Lamatic({ endpoint, projectId, apiKey });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("FlowTimeout")), FLOW_TIMEOUT_MS);
    });
    // executeFlow includes Lamatic's request and response-body parsing; the timeout covers both.
    const response = await Promise.race([
      lamatic.executeFlow(flowId, { sampleInput: sampleInput.trim() }),
      timeoutPromise,
    ]) as unknown as Record<string, unknown>;
    if (response.status === "error") {
      return NextResponse.json(
        { error: `Lamatic flow error: ${String(response.message ?? "Unknown error")}` },
        { status: 502 }
      );
    }
    rawOutput = response.result;
  } catch (error) {
    if (error instanceof Error && error.message === "FlowTimeout") {
      return NextResponse.json({ error: "The Lamatic flow took too long. Please try again." }, { status: 504 });
    }
    console.error("Lamatic flow request failed:", error);
    return NextResponse.json(
      { error: "The app could not reach the Lamatic flow. Check the endpoint, credentials, and deployment status." },
      { status: 502 }
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const parsed = parseFlowOutput(rawOutput);
  if (!parsed) {
    return NextResponse.json(
      { error: "Lamatic returned scenes in an unexpected format. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ output: parsed });
}

function validatedHttpsEndpoint(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const endpoint = new URL(value);
    return endpoint.protocol === "https:" ? endpoint.toString() : null;
  } catch {
    return null;
  }
}

function parseFlowOutput(value: unknown): Scene[] | null {
  let parsed = value;
  // Flow exports may return a JSON string, { output: Scene[] }, or Scene[] directly.
  // Normalize all SDK-supported result shapes before validating scenes.
  while (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  const output = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>).output
      : undefined;
  const scenes = Array.isArray(output) ? output.map(normalizeScene) : null;
  return scenes && scenes.length > 0 && scenes.every(isScene)
    ? scenes
    : null;
}

function normalizeScene(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const scene = value as Record<string, unknown>;
  const sceneNumber = typeof scene.scene_number === "string" && /^\d+$/.test(scene.scene_number)
    ? Number(scene.scene_number)
    : scene.scene_number;
  // Image-generation nodes can return a one-item array; the UI needs its first data URI.
  if (Array.isArray(scene.image_url) && scene.image_url.length === 1) {
    return { ...scene, scene_number: sceneNumber, image_url: scene.image_url[0] };
  }
  return { ...scene, scene_number: sceneNumber };
}

async function createNarrationAudio(text: string) {
  const narration = text.trim();
  if (!narration) {
    return NextResponse.json({ error: "Narration text is required." }, { status: 400 });
  }
  if (narration.length > 180) {
    return NextResponse.json({ error: "Narration text must be 180 characters or less." }, { status: 400 });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), TTS_TIMEOUT_MS);
  try {
    const ttsUrl = new URL("https://translate.googleapis.com/translate_tts");
    ttsUrl.searchParams.set("ie", "UTF-8");
    ttsUrl.searchParams.set("client", "tw-ob");
    ttsUrl.searchParams.set("tl", "en");
    ttsUrl.searchParams.set("q", narration);
    const response = await fetch(ttsUrl, { signal: abortController.signal, redirect: "error" });
    if (!response.ok) {
      return NextResponse.json(
        { error: "The narration service is unavailable right now. Please try again shortly." },
        { status: 503 }
      );
    }
    const audio = await response.arrayBuffer();
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Narration audio timed out. Please try again." }, { status: 504 });
    }
    console.error("Narration audio request failed:", error);
    return NextResponse.json(
      { error: "The server could not reach the narration service. Please try again." },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
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
