import { Lamatic } from 'lamatic';
import { NextRequest, NextResponse } from 'next/server';

const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_PROJECT_ENDPOINT!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiKey: process.env.LAMATIC_PROJECT_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { ticket_text } = await request.json();
    const flowId = process.env.LAMATIC_FLOW_ID;

    if (!flowId) {
      return NextResponse.json({ error: "Missing LAMATIC_FLOW_ID configuration." }, { status: 500 });
    }

    const response = await lamaticClient.executeFlow(flowId, { ticket_text });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "API execution failed" }, { status: 500 });
  }
}