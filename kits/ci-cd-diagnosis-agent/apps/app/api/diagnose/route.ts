import { NextRequest, NextResponse } from "next/server";
import { createLamaticClient, getLamaticConfig } from "@/lib/lamatic-client";
import { DiagnoseRequestSchema, DiagnosisSchema } from "@/lib/types";
import { truncateLog } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  // ── 1. Size guard ──────────────────────────────────────────────────────────
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
    return NextResponse.json(
      { error: "Log file exceeds the 5 MB limit. Please upload a smaller log or paste only the failing section." },
      { status: 413 }
    );
  }

  // ── 2. Parse & validate body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DiagnoseRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json(
      { error: firstError || "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { logContent, ciProvider } = parsed.data;
  const safeLog = truncateLog(logContent);

  // ── 3. Check Lamatic configuration ────────────────────────────────────────
  let config: ReturnType<typeof getLamaticConfig>;
  try {
    config = getLamaticConfig();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Configuration error.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // ── 4. Invoke Lamatic flow ─────────────────────────────────────────────────
  let rawResult: unknown;
  try {
    const client = createLamaticClient();
    rawResult = await client.executeFlow(
      config.flowId,
      { logContent: safeLog, ciProvider }
    );
  } catch (err: unknown) {
    console.error("[diagnose] Lamatic execution error:", err);
    return NextResponse.json(
      { error: "The diagnostic workflow failed to execute. Please try again." },
      { status: 502 }
    );
  }

  // ── 5. Validate response schema ────────────────────────────────────────────
  const payloadToValidate = typeof rawResult === "object" && rawResult !== null && "result" in rawResult 
    ? (rawResult as any).result 
    : rawResult;

  const validated = DiagnosisSchema.safeParse(payloadToValidate);
  if (!validated.success) {
    console.error("[diagnose] Schema mismatch from Lamatic:", validated.error.flatten());
    return NextResponse.json(
      { error: "The diagnosis response was malformed. Please check your Lamatic flow output schema.", validationErrors: validated.error.flatten() },
      { status: 500 }
    );
  }

  return NextResponse.json(validated.data, { status: 200 });
}
