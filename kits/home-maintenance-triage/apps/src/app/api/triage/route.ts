import { NextRequest, NextResponse } from "next/server";

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

  const query = `
    query RunFlow($flowId: String!, $payload: JSON!) {
      runFlow(flowId: $flowId, payload: $payload) {
        output
      }
    }
  `;

  const payload: Record<string, string> = { issueDescription: issueDescription.trim() };
  if (imageUrl) payload.imageUrl = imageUrl;
  if (homeType) payload.homeType = homeType as string;
  if (issueLocation) payload.issueLocation = issueLocation as string;

  // 3. Call Lamatic API with timeout
  let response: Response;
  try {
    response = await fetch(`${endpoint}/api/flow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-id": projectId,
      },
      body: JSON.stringify({ query, variables: { flowId, payload } }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "The AI flow timed out. Please try again." },
        { status: 504 }
      );
    }
    console.error("Lamatic fetch error:", err);
    return NextResponse.json(
      { error: "Failed to reach Lamatic API. Check your endpoint and credentials." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const text = await response.text();
    console.error("Lamatic API error:", text);
    return NextResponse.json(
      { error: "Lamatic API returned an error. Check your credentials and flow ID." },
      { status: 502 }
    );
  }

  const data = await response.json();
  const rawOutput: string | undefined = data?.data?.runFlow?.output;

  if (!rawOutput) {
    return NextResponse.json(
      { error: "No output returned from the flow. Ensure it is deployed and running." },
      { status: 500 }
    );
  }

  // 4. Parse and validate the LLM JSON output
  let parsed: Record<string, unknown>;
  try {
    const candidate = JSON.parse(rawOutput);
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
