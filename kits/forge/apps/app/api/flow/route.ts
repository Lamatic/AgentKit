import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { flowId, payload } = await req.json();

  const endpoint = process.env.NEXT_PUBLIC_LAMATIC_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    return NextResponse.json(
      { error: 'Missing Lamatic environment variables.' },
      { status: 500 }
    );
  }

  const graphqlQuery = {
    query: `query ExecuteWorkflow($workflowId: String! $payload: JSON!) {
      executeWorkflow(workflowId: $workflowId payload: $payload) {
        status
        result
      }
    }`,
    variables: { workflowId: flowId, payload },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-project-id': projectId,
      },
      body: JSON.stringify(graphqlQuery),
    });

    const rawText = await res.text();
    console.log('[Forge API] HTTP status:', res.status);
    console.log('[Forge API] Raw response:', rawText.slice(0, 500));

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: `Lamatic returned non-JSON: ${rawText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    if (data?.errors) {
      const msg = data.errors[0]?.message ?? 'GraphQL error';
      console.error('[Forge API] GraphQL error:', msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const result = data?.data?.executeWorkflow;
    if (!result) {
      return NextResponse.json(
        { error: `Unexpected response shape: ${JSON.stringify(data).slice(0, 200)}` },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Forge API] Fetch failed:', error);
    const message = error instanceof Error ? error.message : 'Flow execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
