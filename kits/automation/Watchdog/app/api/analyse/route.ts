import { NextRequest, NextResponse } from 'next/server'

const LAMATIC_ENDPOINT = process.env.LAMATIC_ENDPOINT!
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY!
const WORKFLOW_ID = process.env.LAMATIC_WORKFLOW_ID!
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
    const { competitors } = await req.json()

    if (!competitors || competitors.length === 0) {
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