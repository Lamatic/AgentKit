import { NextRequest, NextResponse } from 'next/server'

const EXECUTE_WORKFLOW = `
  query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
    executeWorkflow(
      workflowId: $workflowId
      payload: $payload
    ) {
      status
      result
    }
  }
`

export async function POST(req: NextRequest) {
  try {
    const {
      LAMATIC_API_URL,
      LAMATIC_API_KEY,
      WATCHDOG_FLOW_ID,
      LAMATIC_PROJECT_ID,
    } = process.env;

    // ✅ ENV VALIDATION
    if (!LAMATIC_API_URL || !LAMATIC_API_KEY || !WATCHDOG_FLOW_ID || !LAMATIC_PROJECT_ID) {
      console.error("Missing env vars:", {
        hasURL: !!LAMATIC_API_URL,
        hasKey: !!LAMATIC_API_KEY,
        hasFlow: !!WATCHDOG_FLOW_ID,
        hasProject: !!LAMATIC_PROJECT_ID,
      });

      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // ✅ BODY PARSE
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const competitors = Array.isArray(body?.competitors) ? body.competitors : [];

    // ✅ VALIDATION
    const isValid =
      competitors.length > 0 &&
      competitors.every(
        (c: any) =>
          typeof c?.org_name === 'string' &&
          c.org_name.trim() &&
          typeof c?.url === 'string' &&
          c.url.trim()
      );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid competitors data' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400000);

    const res = await fetch(LAMATIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LAMATIC_API_KEY}`,
        'x-project-id': LAMATIC_PROJECT_ID,
      },
      body: JSON.stringify({
        query: EXECUTE_WORKFLOW,
        variables: {
          workflowId: WATCHDOG_FLOW_ID,
          payload: { competitors },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // ✅ HANDLE NON-200 RESPONSES
    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Lamatic HTTP ${res.status}`, details: errorText },
        { status: res.status }
      );
    }

    // ✅ SAFE PARSE
    let data: any;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        { error: `Invalid JSON from Lamatic` },
        { status: 500 }
      );
    }

    // ✅ GRAPHQL ERROR HANDLING
    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0]?.message || 'GraphQL error' },
        { status: 500 }
      );
    }

    // ✅ SAFE RESPONSE ACCESS
    const result = data?.data?.executeWorkflow;

    if (!result) {
      return NextResponse.json(
        { error: "Unexpected Lamatic response structure" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Analyze route error:', err);
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - Lamatic API did not respond in time' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}