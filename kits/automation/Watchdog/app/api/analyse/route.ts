import { NextRequest, NextResponse } from 'next/server'

const LAMATIC_ENDPOINT = process.env.LAMATIC_API_URL!
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY!
const WORKFLOW_ID = process.env.WATCHDOG_FLOW_ID!
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID!

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
    const body = await req.json();
    const competitors = Array.isArray(body?.competitors) ? body.competitors : [];

    const isValid = competitors.length > 0 && competitors.every(
      (c: any) => typeof c?.org_name === 'string' && c.org_name.trim() &&
                  typeof c?.url === 'string' && c.url.trim()
    );

    if (!isValid) {
      return NextResponse.json({ error: 'No competitors provided' }, { status: 400 })
    }

    const res = await fetch(LAMATIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LAMATIC_API_KEY}`,
        'x-project-id': LAMATIC_PROJECT_ID,
      },
      body: JSON.stringify({
        query: EXECUTE_WORKFLOW,
        variables: {
          workflowId: WORKFLOW_ID,
          payload: { competitors },
        },
      }),
    })

    const text = await res.text()
    let data: any

    try {
      data = JSON.parse(text)
    } catch {
      console.error('Non-JSON from Lamatic:', text.slice(0, 400))
      return NextResponse.json(
        { error: `Lamatic returned non-JSON response (HTTP ${res.status})` },
        { status: 500 }
      )
    }

    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      return NextResponse.json(
        { error: data.errors[0]?.message || 'GraphQL error' },
        { status: 500 }
      )
    }

    return NextResponse.json(data.data.executeWorkflow)

  } catch (err: any) {
    console.error('Analyze route error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}