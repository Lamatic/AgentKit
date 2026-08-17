import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issueDescription, imageUrl, homeType, issueLocation } = body;

    if (!issueDescription || typeof issueDescription !== "string") {
      return NextResponse.json(
        { error: "issueDescription is required" },
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

    const query = `
      query RunFlow($flowId: String!, $payload: JSON!) {
        runFlow(flowId: $flowId, payload: $payload) {
          output
        }
      }
    `;

    const payload: Record<string, string> = { issueDescription };
    if (imageUrl) payload.imageUrl = imageUrl;
    if (homeType) payload.homeType = homeType;
    if (issueLocation) payload.issueLocation = issueLocation;

    const response = await fetch(`${endpoint}/api/flow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-id": projectId,
      },
      body: JSON.stringify({
        query,
        variables: { flowId, payload },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Lamatic API error:", text);
      return NextResponse.json(
        { error: "Failed to reach Lamatic API. Check your endpoint and credentials." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawOutput: string | undefined = data?.data?.runFlow?.output;

    if (!rawOutput) {
      return NextResponse.json(
        { error: "No output returned from the flow. Ensure it is deployed." },
        { status: 500 }
      );
    }

    // Parse the JSON string returned by the LLM node
    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      // Return raw if it's not valid JSON
      parsed = { raw: rawOutput };
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Triage API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
