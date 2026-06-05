import { NextRequest, NextResponse } from 'next/server';

const isDebug =
  process.env.NODE_ENV !== 'production' || process.env.FORGE_DEBUG === '1';

function getAllowedFlowIds(): Set<string> {
  return new Set(
    [
      process.env.NEXT_PUBLIC_FLOW_PRICING,
      process.env.NEXT_PUBLIC_FLOW_TRADEOFF,
      process.env.NEXT_PUBLIC_FLOW_CONTRACT,
      process.env.NEXT_PUBLIC_FLOW_INVOICE,
    ].filter((id): id is string => typeof id === 'string' && id.length > 0)
  );
}

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

  const allowed = getAllowedFlowIds();
  if (typeof flowId !== 'string' || !allowed.has(flowId)) {
    return NextResponse.json(
      { error: 'Unknown or disallowed flowId.' },
      { status: 400 }
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
    if (isDebug) {
      console.log('[Forge API] HTTP status:', res.status);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      const detail = isDebug ? `: ${rawText.slice(0, 200)}` : '';
      return NextResponse.json(
        { error: `Lamatic returned non-JSON${detail}` },
        { status: 500 }
      );
    }

    if (data?.errors) {
      const msg = data.errors[0]?.message ?? 'GraphQL error';
      if (isDebug) {
        console.error('[Forge API] GraphQL error:', msg);
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const result = data?.data?.executeWorkflow;
    if (!result) {
      const detail = isDebug ? `: ${JSON.stringify(data).slice(0, 200)}` : '';
      return NextResponse.json(
        { error: `Unexpected response shape${detail}` },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (isDebug) {
      console.error('[Forge API] Fetch failed:', error);
    }
    const message = error instanceof Error ? error.message : 'Flow execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
