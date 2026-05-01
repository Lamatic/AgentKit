import { NextRequest, NextResponse } from "next/server"

const query = `
  query ExecuteWorkflow($workflowId: String!, $chatMessage: String) {
    executeWorkflow(
      workflowId: $workflowId
      payload: { chatMessage: $chatMessage }
    ) {
      status
      result
    }
  }
`

const DISCLAIMER =
  "Informational only, not legal advice. Verify the answer against current law in your jurisdiction and consult a qualified attorney before acting."

type LamaticIssue = {
  message?: string
}

type LamaticGraphqlResponse = {
  data?: {
    executeWorkflow?: {
      status?: string
      result?: unknown
    }
  }
  errors?: LamaticIssue[]
  message?: string
}

function getGraphqlUrl(apiUrl: string) {
  const trimmed = apiUrl.trim().replace(/\/+$/, "")
  return trimmed.endsWith("/graphql") ? trimmed : `${trimmed}/graphql`
}

function extractAnswer(result: unknown): string {
  if (typeof result === "string") {
    return result.trim()
  }

  if (!result || typeof result !== "object") {
    return ""
  }

  const record = result as Record<string, unknown>
  const candidateKeys = [
    "answer",
    "response",
    "content",
    "generatedResponse",
    "modelResponse",
  ]

  for (const key of candidateKeys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return JSON.stringify(result, null, 2)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const question = typeof body?.question === "string" ? body.question.trim() : ""
    const jurisdiction =
      typeof body?.jurisdiction === "string" ? body.jurisdiction.trim() : ""
    const context = typeof body?.context === "string" ? body.context.trim() : ""

    if (!question) {
      return NextResponse.json(
        { error: "A legal question is required." },
        { status: 400 }
      )
    }

    const lamaticApiKey = process.env.LAMATIC_API_KEY?.trim()
    const lamaticApiUrl = process.env.LAMATIC_API_URL?.trim()
    const lamaticProjectId = process.env.LAMATIC_PROJECT_ID?.trim()
    const workflowId = process.env.ASSISTANT_LEGAL_CHATBOT?.trim()

    const missingEnv = [
      !lamaticApiKey && "LAMATIC_API_KEY",
      !lamaticApiUrl && "LAMATIC_API_URL",
      !lamaticProjectId && "LAMATIC_PROJECT_ID",
      !workflowId && "ASSISTANT_LEGAL_CHATBOT",
    ].filter(Boolean)

    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required Lamatic environment variables: ${missingEnv.join(
            ", "
          )}.`,
        },
        { status: 500 }
      )
    }

    const combinedPrompt = [
      jurisdiction ? `Jurisdiction: ${jurisdiction}` : "Jurisdiction: unspecified",
      context ? `Context: ${context}` : null,
      `Question: ${question}`,
      "Answer for informational purposes only. Cite the relevant law, statute, regulation, or source when possible. Close with practical next steps and a short reminder that this is not legal advice.",
    ]
      .filter(Boolean)
      .join("\n\n")

    const res = await fetch(getGraphqlUrl(lamaticApiUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lamaticApiKey}`,
        "Content-Type": "application/json",
        "x-project-id": lamaticProjectId,
      },
      body: JSON.stringify({
        query,
        variables: {
          workflowId,
          chatMessage: combinedPrompt,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    })

    const raw = await res.text()
    const trimmed = raw.trim()
    let data: LamaticGraphqlResponse | null = null

    if (trimmed) {
      try {
        data = JSON.parse(trimmed) as LamaticGraphqlResponse
      } catch {
        data = null
      }
    }

    if (!res.ok) {
      const upstreamMessage =
        data?.errors
          ?.map((error) => error?.message)
          .filter(Boolean)
          .join("; ") ||
        data?.message ||
        (trimmed.startsWith("<")
          ? "Lamatic returned HTML instead of JSON."
          : "Lamatic returned an unsuccessful response.")

      return NextResponse.json(
        { error: `Lamatic request failed (${res.status}): ${upstreamMessage}` },
        { status: 502 }
      )
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Lamatic returned an invalid non-JSON response." },
        { status: 502 }
      )
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const message = data.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join("; ")

      return NextResponse.json(
        { error: message || "Lamatic returned GraphQL errors." },
        { status: 502 }
      )
    }

    const execution = data.data?.executeWorkflow

    if (execution?.status?.toLowerCase() === "error") {
      return NextResponse.json(
        { error: "Lamatic reported an execution error." },
        { status: 502 }
      )
    }

    const answer = extractAnswer(execution?.result)

    if (!answer) {
      return NextResponse.json(
        { error: "Lamatic returned an empty legal response." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      answer,
      disclaimer: DISCLAIMER,
      jurisdiction: jurisdiction || "Unspecified",
    })
  } catch (error) {
    console.error("Legal route failed", error)

    return NextResponse.json(
      { error: "The legal assistant route failed before it could complete the request." },
      { status: 500 }
    )
  }
}
