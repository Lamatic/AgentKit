import { Lamatic } from 'lamatic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT;
    const projectId = process.env.LAMATIC_PROJECT_ID;
    const apiKey = process.env.LAMATIC_PROJECT_API_KEY;
    const flowId = process.env.LAMATIC_FLOW_ID;

    // Fails fast and safely if env vars are missing
    if (!endpoint || !projectId || !apiKey || !flowId) {
      return NextResponse.json(
        { error: "Missing required Lamatic environment variables on the server." },
        { status: 500 }
      );
    }

    const lamaticClient = new Lamatic({ endpoint, projectId, apiKey });
    const { ticket_text } = await request.json();

    const response = await lamaticClient.executeFlow(flowId, { ticket_text });
    return NextResponse.json(response);
    
  } catch (error: unknown) {
    // Safely narrows the 'unknown' error type
    const errorMessage = error instanceof Error ? error.message : "API execution failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}