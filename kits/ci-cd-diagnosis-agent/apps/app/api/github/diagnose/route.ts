import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { fetchRunLogsZipBuffer, extractAndNormalizeLogs } from "@/lib/github/log-service";
import { createLamaticClient, getLamaticConfig } from "@/lib/lamatic-client";
import { DiagnosisSchema, GitHubDiagnoseRunRequestSchema } from "@/lib/types";

export async function POST(request: NextRequest) {
  // 1. Session Authorization Guard
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized. Please connect your GitHub account." },
      { status: 401 }
    );
  }

  // 2. Parse & Validate Request Body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = GitHubDiagnoseRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json(
      { error: firstError || "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { owner, repo, runId } = parsed.data;

  // 3. Download Workflow Logs Archive from GitHub Actions API
  const zipBuffer = await fetchRunLogsZipBuffer(session.accessToken, owner, repo, runId);
  if ("error" in zipBuffer) {
    return NextResponse.json(
      { error: zipBuffer.error },
      { status: zipBuffer.status }
    );
  }

  // 4. In-Memory Extraction, ANSI Stripping, Secret Redaction, and Normalization
  const logResult = extractAndNormalizeLogs(zipBuffer);
  if (!logResult.cleanedLog || logResult.cleanedLog.trim().length === 0) {
    return NextResponse.json(
      { error: "No readable log output could be extracted from this workflow run." },
      { status: 422 }
    );
  }

  // 5. Retrieve Lamatic Configuration
  let config: ReturnType<typeof getLamaticConfig>;
  try {
    config = getLamaticConfig();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lamatic configuration missing.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // 6. Invoke Existing 10-Node Lamatic AgentKit Workflow
  let rawResult: unknown;
  try {
    const client = createLamaticClient();
    rawResult = await client.executeFlow(
      config.flowId,
      { logContent: logResult.cleanedLog, ciProvider: "github" }
    );
  } catch (err: unknown) {
    console.error("[github-diagnose] Lamatic execution error:", err);
    return NextResponse.json(
      { error: "The diagnostic workflow failed to execute. Please try again." },
      { status: 502 }
    );
  }

  // 7. Validate Response Schema against DiagnosisSchema
  const payloadToValidate = typeof rawResult === "object" && rawResult !== null && "result" in rawResult 
    ? (rawResult as any).result 
    : rawResult;

  const validated = DiagnosisSchema.safeParse(payloadToValidate);
  if (!validated.success) {
    console.error("[github-diagnose] Schema mismatch from Lamatic:", validated.error.flatten());
    return NextResponse.json(
      { error: "The diagnosis response was malformed.", validationErrors: validated.error.flatten() },
      { status: 500 }
    );
  }

  return NextResponse.json(validated.data);
}
