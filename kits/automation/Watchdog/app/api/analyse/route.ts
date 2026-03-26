import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Safe Environment Variable Loading
    const { 
      LAMATIC_API_URL, 
      LAMATIC_API_KEY, 
      WATCHDOG_FLOW_ID, 
      LAMATIC_PROJECT_ID 
    } = process.env;

    if (!LAMATIC_API_URL || !LAMATIC_API_KEY || !WATCHDOG_FLOW_ID || !LAMATIC_PROJECT_ID) {
      console.error("Missing Environment Variables");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. Strong Request Validation
    const body = await req.json();
    const competitors = Array.isArray(body?.competitors) ? body.competitors : [];
    const isValid = competitors.length > 0 && competitors.every(
      (c: any) => typeof c?.org_name === 'string' && c.org_name.trim() &&
                  typeof c?.url === 'string' && c.url.trim()
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid competitors data' }, { status: 400 });
    }

    const EXECUTE_WORKFLOW = `
      mutation ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
        executeWorkflow(workflowId: $workflowId, payload: $payload)
      }
    `;

    // 3. Hardened Fetch with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

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

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Lamatic Error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    if (data.errors) {
      return NextResponse.json({ error: data.errors[0]?.message }, { status: 500 });
    }

    return NextResponse.json(data.data.executeWorkflow);
  } catch (err: any) {
    console.error('Route Error:', err);
    const message = err.name === 'AbortError' ? 'Request Timed Out' : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}