import { NextRequest, NextResponse } from "next/server";
import { Lamatic } from "lamatic";

/**
 * POST /api/triage
 *
 * Accepts a home maintenance issue description (and optional image URL, home type,
 * and issue location), forwards the payload to the deployed Lamatic flow via the
 * official SDK, and returns a structured triage assessment containing category,
 * severity, urgency, professional recommendation, safe next steps, and a disclaimer.
 *
 * @param req - Incoming Next.js request with JSON body containing:
 *   - issueDescription {string} Required. Text description of the home issue.
 *   - imageUrl {string}         Optional. Public HTTPS URL of an issue photo.
 *   - homeType {string}         Optional. Type of home (e.g. "apartment", "house").
 *   - issueLocation {string}    Optional. Location in the home (e.g. "kitchen", "roof").
 * @returns NextResponse with { result } on success, or { error } with an appropriate HTTP status.
 */
export async function POST(req: NextRequest) {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { issueDescription, imageUrl, homeType, issueLocation } = body as Record<string, unknown>;

  if (!issueDescription || typeof issueDescription !== "string" || !issueDescription.trim()) {
    return NextResponse.json(
      { error: "issueDescription is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (imageUrl !== undefined && typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl must be a string." }, { status: 400 });
  }

  if (homeType !== undefined && typeof homeType !== "string") {
    return NextResponse.json({ error: "homeType must be a string." }, { status: 400 });
  }

  if (issueLocation !== undefined && typeof issueLocation !== "string") {
    return NextResponse.json({ error: "issueLocation must be a string." }, { status: 400 });
  }

  // Validate imageUrl — only accept public HTTPS URLs, reject private/loopback destinations
  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "https:") {
        return NextResponse.json(
          { error: "imageUrl must use HTTPS." },
          { status: 400 }
        );
      }
      const hostname = parsed.hostname.toLowerCase();
      const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254."];
      if (blocked.some((b) => hostname.startsWith(b) || hostname === b)) {
        return NextResponse.json(
          { error: "imageUrl must point to a public host." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "imageUrl is not a valid URL." }, { status: 400 });
    }
  }

  // 2. Check env config
  const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT || "https://mohdsorganization618-homemaintenancetriage432.lamatic.dev/graphql";
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_PROJECT_API_KEY;
  const flowId = process.env.NEXT_PUBLIC_LAMATIC_FLOW_ID;

  if (!projectId || !apiKey || !flowId) {
    return NextResponse.json(
      { error: "Lamatic credentials are not configured. Check your .env file." },
      { status: 500 }
    );
  }

  const payload: Record<string, string> = {
    issueDescription: issueDescription.trim(),
  };
  if (imageUrl) payload.imageUrl = imageUrl;
  if (homeType) payload.homeType = homeType as string;
  if (issueLocation) payload.issueLocation = issueLocation as string;

  // 3. Execute Lamatic Flow via SDK (Official utils.ts pattern)
  let rawOutput: any;

  try {
    const lamaticClient = new Lamatic({
      endpoint,
      projectId,
      apiKey,
    });

    const flowPromise = lamaticClient.executeFlow(flowId, payload);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TimeoutError")), 30000);
    });

    const response = (await Promise.race([flowPromise, timeoutPromise])) as any;
    console.log("[Lamatic SDK raw response]:", JSON.stringify(response));

    if (response?.status === "error") {
      console.error("[Lamatic SDK flow error]:", response?.message);
      return NextResponse.json(
        { error: `Flow returned an error: ${response?.message || "Unknown error"}` },
        { status: 502 }
      );
    }

    // SDK returns { status, result: { output: { ...fields } }, statusCode }
    // Unwrap: result.output first, then result, then response itself
    const resultObj = response?.result;
    const raw = resultObj?.output ?? resultObj ?? response?.output ?? response;
    rawOutput = typeof raw === "string" ? raw : JSON.stringify(raw);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TimeoutError") {
      return NextResponse.json(
        { error: "The AI flow timed out. Please try again." },
        { status: 504 }
      );
    }
    console.error("Lamatic SDK Execution Error:", err);
    return NextResponse.json(
      { error: "Failed to execute Lamatic flow. Check your credentials and flow deployment." },
      { status: 502 }
    );
  }

  if (!rawOutput) {
    return NextResponse.json(
      { error: "No result returned from the flow. Ensure it is deployed in Lamatic Studio." },
      { status: 500 }
    );
  }

  // 4. Parse and validate the LLM JSON output
  let parsed: Record<string, unknown>;
  try {
    const candidate = typeof rawOutput === "object" ? rawOutput : JSON.parse(rawOutput);
    if (typeof candidate !== "object" || candidate === null) {
      throw new Error("Output is not an object");
    }
    parsed = candidate as Record<string, unknown>;
  } catch {
    console.error("Failed to parse flow output as JSON:", rawOutput);
    return NextResponse.json(
      { error: "The AI returned an unexpected response format. Please try again." },
      { status: 500 }
    );
  }

  // Validate required triage fields
  const required = ["category", "severity", "urgency", "professionalNeeded", "safeNextSteps", "disclaimer"];
  const missing = required.filter((f) => !(f in parsed));
  if (missing.length > 0) {
    console.error("Triage output missing fields:", missing);
    return NextResponse.json(
      { error: "The AI response was incomplete. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ result: parsed });
}
